---
id: database-design
title: Database Design & Schema
sidebar_label: Database Design
sidebar_position: 3
description: Complete PostgreSQL schema reference for assessment v2, flashcards, sharing, and migrations.
---

# LinguFlow Database Design

**Stack:** PostgreSQL (production / Docker) · SQLAlchemy 2 async ORM · Alembic migrations  
**Source of truth for shapes:** `backend/app/models/`  
**Migrations:** `backend/alembic/versions/` (head: `0021_exam_blueprints`)

Field names below are **snake_case** (DB / ORM). The API exposes camelCase via
Pydantic aliases.

**Related pages:** [Architecture & Database Schema](./architecture-and-database-schema.md)
(ERD summary) · [Question & Exam Design](./question-and-exam-design.md) (authoring /
sitting lifecycle) · [Exam-Type Feature Flags](../features/exam-type-feature-flags.md) ·
[AI Service Layer](../features/ai-service-layer.md)

> Assessment **v2** is current. Migrations `0017_assessment_v2_schema` +
> `0018_drop_legacy_assessment` replaced `exam_templates`, `exam_sessions`,
> `answer_records`, and the flat v1 `questions` body columns. `ai_generation_jobs`
> was dropped in `0018` (generation is synchronous + `ai_provenance` now).

---

## 1. Big picture

LinguFlow stores several product domains on one Postgres database:

| Domain | Purpose | Core tables |
| --- | --- | --- |
| **Accounts** | Identity, guests, prefs | `users`, `user_settings` |
| **Flashcards / library** | Decks, cards, per-learner SM-2 | `decks`, `cards`, `card_progress` |
| **Sharing** | Visibility + members (polymorphic) | `item_members`, `item_effective_access`, `item_effective_grantees` |
| **Question bank** | Shared stimuli + versioned items | `stimuli`, `stimulus_versions`, `questions`, `question_versions`, `question_keys`, `ai_provenance` |
| **Exams & attempts** | Definitions, sittings, scores | `exams`, `exam_versions`, `exam_nodes`, `exam_slots`, `attempts`, `attempt_items`, `responses`, `scores`, `attempt_sections`, `question_notes` |
| **Ops flags** | Kill switches / structure gates | `exam_type_flags`, `exam_type_blueprints`, `feature_flags` |
| **AI cache** | Explain responses | `ai_explanations` |

```txt
                         ┌──────────────┐
                         │    users     │
                         └──────┬───────┘
           ┌────────────────────┼────────────────────┬─────────────────┐
           │                    │                    │                 │
           ▼                    ▼                    ▼                 ▼
      ┌────────┐          ┌──────────┐        ┌────────────┐   ┌──────────────┐
      │ decks  │          │  cards   │        │   exams    │   │user_settings │
      └───┬────┘          └────┬─────┘        └──────┬─────┘   └──────────────┘
          │                    │                     │
          │ 1:N (ORM cascade)  │                     │ versions → nodes → slots
          └────────────────────┘                     │
                               │                     ▼
                               ▼              ┌─────────────┐
                        ┌──────────────┐      │  attempts   │
                        │card_progress │      └──────┬──────┘
                        └──────────────┘             │ items → responses
                                                     │ scores / sections

  Bank (shared):  stimuli → stimulus_versions
                  questions → question_versions → question_keys
                              └─(optional)→ stimulus_versions
                  exam_slots → questions (identity only)
                  attempt_items → question_versions (+ optional stimulus_versions)
```

---

## 2. Conventions

| Convention | Rule |
| --- | --- |
| **Primary keys** | UUID (`uuid.uuid4`), Postgres `UUID` type |
| **Timestamps** | `DateTime(timezone=True)`, UTC; most tables have `created_at` / `updated_at` |
| **Ownership** | User content rows carry `user_id` FK (`SET NULL` for shared bank/exams, `CASCADE` for personal rows) |
| **JSON columns** | Declared `JSON().with_variant(JSONB, "postgresql")` so SQLite tests work; GIN indexes live in migrations only |
| **Visibility** | `private` \| `protected` \| `public` on decks, cards, questions, stimuli, exams |
| **Content status** | `draft` \| `in_review` \| `published` \| `retired` on stimuli, questions, exams |
| **Cascades** | Prefer ORM `cascade="all, delete-orphan"` where ownership is exclusive; column `ondelete=` may differ (see §6) |
| **Soft delete** | Bank/exam listings use `archived_at`; attempt resolution does **not** filter it |

---

## 3. Tables

### 3.1 `users`

Identity and lightweight activity metadata.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `username` | String, unique, nullable | Classic signup |
| `email` | String, unique, nullable | |
| `password_hash` | String, nullable | Absent for Google / guest |
| `google_id` | String, unique, nullable | OAuth |
| `is_guest` | Boolean | Guest lifecycle cleanup uses `(is_guest, last_active)` |
| `is_active` | Boolean, default true | Deactivation checked at login / `get_current_user` (`0007`) |
| `daily_streak` | Integer | Flashcard habit counter |
| `last_active` | timestamptz, indexed | Guest sweep + activity |
| `last_ip` | String(45), nullable | Audit only — **not** an identity key (NAT) |
| `avatar_url` | String, nullable | R2 object key (`0008`) |
| `created_at` / `updated_at` | timestamptz | |

**Children (ownership):** decks, cards, card_progress, user_settings, attempts (delete cascade).  
**Bank / exams:** `user_id` SET NULL on user delete so authored content can detach.

---

### 3.2 `decks`

Named collections of flashcards belonging to one user.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID → `users.id` ON DELETE CASCADE | |
| `name` | String | |
| `description` | Text, nullable | |
| `visibility` | String, indexed | `private` \| `protected` \| `public` (`0015`) |
| `created_at` / `updated_at` | timestamptz | |

**Relationship to cards:** ORM `Deck.cards` uses `cascade="all, delete-orphan"`. **Deleting a deck deletes its cards** in the application session, even though `cards.deck_id` is declared `ON DELETE SET NULL` at the column level.

---

### 3.3 `cards`

Flashcard content + presentation order. **SM-2 state is not on this table** — see `card_progress`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID → `users.id` ON DELETE CASCADE | Owner (required even when unfiled) |
| `deck_id` | UUID → `decks.id` ON DELETE SET NULL, **nullable** | `NULL` = Unfiled |
| `front` / `back` | Text | Markdown-capable content |
| `position` | Integer | Order **within a deck** (study / match / workspace). Independent of SRS |
| `image_url` | Text, nullable | |
| `notes` | Text, nullable | |
| `visibility` | String, indexed | (`0015`) |
| `created_at` / `updated_at` | timestamptz | |

**Behaviors that shape the UI:**

- Unfiled cards (`deck_id IS NULL`) always get `position = 0` on write — **no server reorder** for Unfiled.
- Creating a card or changing `deck_id` **appends** it (`position` = max+1 for that deck).
- Reorder API requires an **exact cover** of all card IDs in the deck.

---

### 3.4 `card_progress`

Per-learner SM-2 schedule for a card (`0015_item_sharing`). Enables studying a shared/public card without writing onto the author's row.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | UUID → `users.id` ON DELETE CASCADE | PK part |
| `card_id` | UUID → `cards.id` ON DELETE CASCADE | PK part |
| `srs_interval` | Integer | Days until next review |
| `srs_ease_factor` | Float, default 2.5 | Floor 1.3 in the SM-2 service |
| `srs_repetitions` | Integer | Successful consecutive reviews |
| `srs_next_review` | timestamptz, indexed | Due date |
| `updated_at` | timestamptz | |

---

### 3.5 Sharing tables (`0015`)

Polymorphic membership / projection tables. There is **no FK** to the item row
(ids are plain UUIDs), so `0018` had to purge stale `exam_template` rows by hand
when v1 dropped.

| Table | Role |
| --- | --- |
| `item_members` | Explicit grantees: `(item_type, item_id, user_id)` unique |
| `item_effective_access` | Projected visibility per item: PK `(item_type, item_id)` — used by **decks/cards** |
| `item_effective_grantees` | Projected member set: PK `(item_type, item_id, user_id)` — decks/cards |

**Two access paths:**

- **Flashcards** (`services/access.py`): decks/cards may inherit visibility; the
  effective-\* tables are the materialized projection.
- **Assessment v2** (`services/assessment/access.py`): questions, stimuli, and
  exams carry their own `visibility`; members use `item_members` with types
  `question` \| `stimulus` \| `exam`. No inheritance from exam → bank item, so
  nothing is projected into `item_effective_*` for those types.

---

### 3.6 Stimulus (`stimuli` / `stimulus_versions`)

Shared source material (passage, conversation, photo, chart). Identity + facets on `stimuli`; immutable DSL body on `stimulus_versions`.

**`stimuli`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID → users, SET NULL | |
| `status` | String, indexed | content status |
| `locale` | String(32), indexed | Content language (not UI locale) |
| `tags` | JSONB list | |
| `visibility` | String, indexed | |
| `current_version_id` | UUID, nullable | Denormalized; **not** an FK (avoids cycle) |
| `archived_at` | timestamptz, indexed, nullable | Soft delete |
| `created_at` / `updated_at` | timestamptz | |

**`stimulus_versions`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `stimulus_id` | UUID → stimuli CASCADE | |
| `version` | Integer | Unique with `stimulus_id` |
| `schema_version` | String(16) | DSL schema |
| `title` | String(200), nullable | |
| `body` | JSONB | `app.domain.dsl.StimulusBody` |
| `created_by` | UUID → users, SET NULL | |
| `created_at` | timestamptz | |

---

### 3.7 Question bank (`questions` / `question_versions` / `question_keys`)

A **Question** is a shared bank identity. The authored body lives in immutable **QuestionVersion** rows; the answer key is in **QuestionKey** so a careless bank `SELECT` cannot return it.

**`questions`** — listing / filter facets only (never open version JSON to browse)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID → users, SET NULL | |
| `status` | String, indexed | `draft` \| `in_review` \| `published` \| `retired` |
| `origin` | String, indexed | `human` \| `ai` \| `import` |
| `response_kind` | String, indexed | Denormalized from body for filter scans |
| `locale` | String(32), indexed | |
| `difficulty` | String, indexed | default `medium` |
| `skill` | String(40), indexed, nullable | |
| `tags` | JSONB list | |
| `search_text` | String(500), nullable | Denormalized prompt text (`0019`) |
| `visibility` | String, indexed | |
| `current_version_id` | UUID, nullable | Denormalized; not an FK |
| `archived_at` | timestamptz, indexed, nullable | Soft delete |
| `created_at` / `updated_at` | timestamptz | |

Browse index: `ix_questions_bank_browse` on `(status, locale, response_kind, created_at)`.

**`question_versions`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `question_id` | UUID → questions CASCADE | |
| `version` | Integer | Unique with `question_id` |
| `schema_version` | String(16) | |
| `body` | JSONB | `QuestionBody` — **never** contains the key |
| `stimulus_version_id` | UUID → stimulus_versions RESTRICT, nullable | Passage-set link |
| `order_in_stimulus` | Integer, nullable | Stem order within a set |
| `created_by` | UUID → users, SET NULL | |
| `created_at` | timestamptz | |

**`question_keys`**

| Column | Type | Notes |
| --- | --- | --- |
| `question_version_id` | UUID PK → question_versions CASCADE | 1:1 |
| `key` | JSONB | `AnswerKey` |
| `scoring` | JSONB | Server-owned scoring config |

**`ai_provenance`** — how an AI-authored version was produced

| Column | Type | Notes |
| --- | --- | --- |
| `question_version_id` | UUID PK → question_versions CASCADE | |
| `provider` / `model` | String | |
| `prompt_version` | String(32), indexed | |
| `params` | JSONB | |
| `raw_completion` | Text, nullable | Debug failed parses |
| `regenerated_from_version_id` | UUID → question_versions SET NULL | |
| `created_at` | timestamptz | |

**Bank invariants:**

1. Soft-delete only (`archived_at`) for listings; attempts still resolve archived items.
2. Keys are versioned and recomputable — v1's "409 freeze after first answer" is gone.
3. Passage sets share one `stimulus_version_id` + `order_in_stimulus`, not a free-text `passage_group`.

---

### 3.8 Exams (`exams` / `exam_versions` / `exam_nodes` / `exam_slots`)

**`exams`** — stable identity

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID → users, SET NULL | |
| `name` | String | |
| `exam_type` | String, indexed | `toeic` \| `ielts` \| `hsk` \| `jlpt` \| `custom` |
| `description` | Text, nullable | |
| `level` | String, nullable | |
| `tags` | JSONB list | |
| `visibility` | String, indexed | |
| `status` | String, indexed | content status |
| `current_version_id` | UUID, nullable | Null until first publish |
| `archived_at` | timestamptz, indexed, nullable | |
| `blueprint` | JSONB | Working structure gate for the type |
| `draft_structure` | JSONB, nullable | Incomplete composer draft |
| `draft_saved_at` | timestamptz, nullable | |
| `created_at` / `updated_at` | timestamptz | |

**`exam_versions`** — published immutable composition

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `exam_id` | UUID → exams CASCADE | |
| `version` | Integer | Unique with `exam_id` |
| `total_questions` | Integer | Denormalized on publish |
| `time_limit_seconds` | Integer, nullable | Whole-exam limit |
| `scoring` | JSONB | Scale tables (TOEIC 10–990, IELTS bands, …) |
| `blueprint` / `blueprint_met` | JSONB / Boolean | Snapshot + gate result (`0021`) |
| `published_at` / `published_by` | timestamptz / UUID | |
| `created_at` | timestamptz | |

**`exam_nodes`** — recursive section/part/module tree

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `exam_version_id` | UUID → exam_versions CASCADE | |
| `parent_id` | UUID → exam_nodes CASCADE, nullable | Root = null |
| `role` | String(32) | `section` \| `part` \| `module` (free-form) |
| `key` | String(64), indexed, nullable | Catalog key (e.g. `part5`) |
| `label` | String(200), nullable | |
| `position` | Integer | |
| `time_limit_seconds` | Integer, nullable | Per-section clock |
| `config` | JSONB | |

**`exam_slots`** — placement of a question **identity** (not a version)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `node_id` | UUID → exam_nodes CASCADE | |
| `question_id` | UUID → questions RESTRICT | |
| `position` | Integer | Unique with `node_id` |

---

### 3.9 Attempts (`attempts` / `attempt_items` / `responses` / `scores` / `attempt_sections` / `question_notes`)

**`attempts`** — one sitting (`0020` added practice/pause fields)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID → users CASCADE | |
| `exam_version_id` | UUID → exam_versions RESTRICT, **nullable** | Null for bank practice draws |
| `status` | String, indexed | `in_progress` \| `completed` \| `abandoned` |
| `mode` | String, indexed | `exam` \| `practice` |
| `feedback_mode` | String | `none` \| `immediate` |
| `practice_spec` | JSONB, nullable | |
| `started_at` / `finished_at` | timestamptz | |
| `time_limit_seconds` | Integer, nullable | |
| `paused_at` / `resumed_at` | timestamptz, nullable | |
| `accumulated_seconds` | Integer | Pause-aware elapsed |
| `created_at` / `updated_at` | timestamptz | |

**`attempt_items`** — frozen composition; pins **versions**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `attempt_id` | UUID → attempts CASCADE | |
| `position` | Integer | Unique with attempt |
| `question_version_id` | UUID → question_versions RESTRICT | |
| `stimulus_version_id` | UUID → stimulus_versions RESTRICT, nullable | |
| `option_order` | JSONB, nullable | Shuffle as sat |
| `node_key` | String(64), indexed, nullable | Section subscores |

**`responses`** — learner write + derived grade

| Column | Type | Notes |
| --- | --- | --- |
| `attempt_item_id` | UUID PK → attempt_items CASCADE | 1:1 |
| `raw` | JSONB | Only field the sitter writes |
| `graded` | Boolean, nullable | Null = not machine-scorable |
| `points` / `max_points` | Float | |
| `detail` | JSONB, nullable | Per-blank / per-pair breakdown |
| `seconds` | Integer | |
| `answered_at` | timestamptz | |

**`scores`** — one row per scale (replaces a single float on the sitting)

| Column | Type | Notes |
| --- | --- | --- |
| `attempt_id` | UUID PK → attempts CASCADE | |
| `scale` | String(64) PK | e.g. `percent`, `section:listening`, `toeic_total` |
| `value` | Float | |
| `detail` | JSONB, nullable | |
| `computed_at` | timestamptz | |

**`attempt_sections`** — frozen section clocks/locks

| Column | Type | Notes |
| --- | --- | --- |
| `attempt_id` | UUID PK → attempts CASCADE | |
| `node_key` | String(64) PK | |
| `position` | Integer | |
| `label` | String(200), nullable | |
| `time_limit_seconds` | Integer, nullable | |
| `status` | String | `locked` \| `active` \| `closed` |
| `started_at` / `closed_at` | timestamptz, nullable | |

**`question_notes`** — one learner note per question identity (upsert)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID → users CASCADE | |
| `question_id` | UUID → questions CASCADE | Unique with user |
| `note_text` | Text | |
| `created_at` / `updated_at` | timestamptz | |

---

### 3.10 Ops / AI support tables

**`exam_type_flags`** (`0006`) — kill switch per exam type string PK. Missing row ⇒ enabled.

**`exam_type_blueprints`** (`0021`) — admin override of catalog default blueprint. Missing row ⇒ catalog default.

**`feature_flags`** (`0012`) — product-wide switches (e.g. `ai`). Missing row ⇒ enabled.

**`ai_explanations`** (`0013`) — cached explain output; unique `(kind, subject_key, locale)`.

**`user_settings`** (`0005`) — one row per user; freeform `settings` JSON.

Known `settings` keys (application-level):

| Key | Meaning |
| --- | --- |
| `locale` | `"vi"` \| `"en"` |
| `theme` | `"light"` \| `"dark"` \| `"simple"` |
| `crtEnabled` | bool (legacy; scanlines follow theme) |
| `dailyXpGoal` | int |
| `audioSfxEnabled` | bool |
| `notificationsEnabled` | bool |
| `speechLang` | `"en-US"` \| `"vi-VN"` \| `"zh-CN"` \| `"ja-JP"` |

---

## 4. Relationship summary

| From | To | Cardinality | Delete behaviour (effective) |
| --- | --- | --- | --- |
| User | Deck / Card / CardProgress / Settings / Attempt | 1:N | Cascade delete |
| User | Question / Stimulus / Exam | 1:N optional | `user_id` SET NULL |
| Deck | Card | 1:N optional | **ORM cascade deletes cards** (column SET NULL overridden) |
| Stimulus | StimulusVersion | 1:N | Cascade versions |
| Question | QuestionVersion | 1:N | Cascade versions |
| QuestionVersion | QuestionKey | 1:0..1 | Cascade key |
| QuestionVersion | StimulusVersion | N:0..1 | RESTRICT (can't drop a pinned stimulus version) |
| Exam | ExamVersion | 1:N | Cascade |
| ExamVersion | ExamNode | 1:N | Cascade tree |
| ExamNode | ExamNode | 1:N | Self-parent cascade |
| ExamNode | ExamSlot | 1:N | Cascade links only |
| ExamSlot | Question | N:1 | RESTRICT |
| ExamVersion | Attempt | 1:N | RESTRICT on version |
| Attempt | AttemptItem / Response / Score / AttemptSection | 1:N | Cascade |
| AttemptItem | QuestionVersion | N:1 | RESTRICT |

---

## 5. Domain invariants (assessment v2)

1. **Shared bank.** Composition is `exam_slots` → question **identity**. Bodies live only on versions.
2. **Attempts pin versions.** `attempt_items.question_version_id` (and optional `stimulus_version_id`) freeze what the sitter saw. Editing the bank cannot rewrite finished results.
3. **Soft-delete questions/exams/stimuli** via `archived_at` so history survives.
4. **Keys are separate and recomputable.** `responses.raw` is authoritative; `graded` / `points` may be recomputed after a key fix.
5. **Scores are multi-scale.** Do not reintroduce a single float score column on `attempts`.
6. **Blueprints.** Working copy on `exams.blueprint`; publish freezes onto `exam_versions` with `blueprint_met`. Per-type admin overrides in `exam_type_blueprints` (missing = catalog default).
7. **Exam-type kill switch.** Missing `exam_type_flags` row means enabled; starting an attempt for a disabled type is refused (403). In-progress/completed attempts keep working.

---

## 6. Cascade pitfalls (cards / decks)

```txt
cards.deck_id  →  ON DELETE SET NULL   (column)
Deck.cards     →  cascade="all, delete-orphan"  (ORM)
```

`db.delete(deck)` runs the ORM cascade → **cards are deleted**.  
A raw SQL `DELETE FROM decks` without ORM might SET NULL instead. Prefer the service/ORM path.

---

## 7. Migrations (history)

| Rev | Name | What it introduced |
| --- | --- | --- |
| `0001` | initial schema | users, decks, cards, early exam shape |
| `0002` | card position / image / notes | presentation fields on cards |
| `0003` | question bank | shared v1 `questions`, join table, soft delete, seed keys |
| `0004` | guest lifecycle | guest fields / cleanup support on users |
| `0005` | user settings | `user_settings` |
| `0006` | exam type flags | `exam_type_flags` |
| `0007` | user is_active | deactivation flag |
| `0008` | user avatar_url | avatar R2 key |
| `0009`–`0011` | exam draft / listening / answer_key | v1-era exam & question columns (later replaced) |
| `0012` | feature flags | `feature_flags` |
| `0013` | ai explanations | `ai_explanations` |
| `0014` | ai generation jobs | `ai_generation_jobs` (dropped in `0018`) |
| `0015` | item sharing | visibility, sharing tables, `card_progress`; SRS leaves `cards` |
| `0016` | question bank list index | v1 list index |
| `0017` | assessment v2 schema | stimuli/questions/exams/attempts v2 (+ rename legacy) |
| `0018` | drop legacy assessment | drop v1 tables + `ai_generation_jobs` |
| `0019` | question search text | `questions.search_text` |
| `0020` | attempt runtime | practice/pause, `attempt_sections`, `question_notes` |
| `0021` | exam blueprints | blueprint columns + `exam_type_blueprints` |

Apply with:

```bash
cd backend
alembic upgrade head
```

On SQLite local boot, prefer `python run_local.py` (`create_all` + `alembic stamp head`) — do not run `alembic upgrade head` against SQLite.

---

## 8. Indexes (high-signal)

Besides PKs/uniques:

- Users: `username`, `email`, `google_id`, `last_active`
- Cards: `user_id`, `deck_id`, `visibility`
- Card progress: `card_id`, `srs_next_review`
- Questions: facet columns + `ix_questions_bank_browse` `(status, locale, response_kind, created_at)`; `archived_at`
- Question versions: `(stimulus_version_id, order_in_stimulus)`
- Exams / attempts: `exam_type`, `visibility`, `status`, `mode`, `user_id`
- Exam nodes: `(parent_id, position)`; slots unique `(node_id, position)`
- Attempt items: unique `(attempt_id, position)`
- Settings: unique `user_id`
- AI provenance: `prompt_version`

---

## 9. What is _not_ in the database

| Concept | Where it lives |
| --- | --- |
| JWT auth tokens | Client storage / signed JWT |
| Unfiled card count | Aggregated via card query (`deck_id IS NULL`) |
| Live exam timer deadline | Derived from timestamps + `time_limit_seconds` / section clocks |
| Flat `passage` / `passage_group` / `audio_url` on questions | Removed with v1; use stimulus + DSL `body` |
| `ai_generation_jobs` | Dropped in `0018`; provenance is `ai_provenance` |
| Media blobs | Cloudflare R2; URLs/keys in card `image_url` or DSL media blocks |
| Exam structure catalog defaults | Code (`exam_structure_catalog` / blueprint helpers), overridden by `exam_type_blueprints` |

---

## 10. Related code map

| Concern | Location |
| --- | --- |
| ORM models | `backend/app/models/` (`assessment.py` for bank/exams/attempts) |
| Alembic | `backend/alembic/versions/` |
| Bank services | `backend/app/services/assessment/bank.py` |
| Exam authoring / publish | `backend/app/services/assessment/exams.py` |
| Sitting / grading | `backend/app/services/assessment/attempts.py`, `scoring.py` |
| Sharing / visibility | `backend/app/services/access.py`, `models/access.py` |
| DSL shapes | `backend/app/domain/dsl/` |
| Pydantic I/O (camelCase) | `backend/app/schemas/assessment.py` |
| Card SM-2 | `backend/app/services/sm2_service.py` + `card_progress` |
