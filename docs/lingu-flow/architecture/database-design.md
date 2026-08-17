---
id: database-design
title: Database Design & Schema Reference
sidebar_label: Database Design
sidebar_position: 2
description: PostgreSQL database tables, conventions, constraints, and Alembic migrations.
---

# LinguFlow Database Design

**Stack:** PostgreSQL (production / Docker) · SQLAlchemy 2 async ORM · Alembic migrations  
**Source of truth for shapes:** `backend/app/models/`  
**Migrations:** `backend/alembic/versions/` (`0001` … `0014`)

This document describes the schema after the Python/Postgres rewrite and the question-bank redesign. Field names below are **snake_case** (DB / ORM). The API exposes camelCase via Pydantic aliases.

---

## 1. Big picture

LinguFlow stores two product domains on one Postgres database:

| Domain                   | Purpose                                              | Core tables                                                                                 |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Flashcards / library** | User-owned decks, cards, SM-2 SRS                    | `users`, `decks`, `cards`                                                                   |
| **Exam simulator**       | Shared question bank, exam templates, timed sessions | `questions`, `exam_templates`, `exam_template_questions`, `exam_sessions`, `answer_records` |
| **Account prefs**        | Locale and UI flags                                  | `user_settings`                                                                             |

```txt
                         ┌──────────────┐
                         │    users     │
                         └──────┬───────┘
           ┌────────────────────┼────────────────────┬─────────────────┐
           │                    │                    │                 │
           ▼                    ▼                    ▼                 ▼
      ┌────────┐          ┌──────────┐        ┌────────────┐   ┌──────────────┐
      │ decks  │          │  cards   │        │exam_templates│  │user_settings │
      └───┬────┘          └────┬─────┘        └──────┬─────┘   └──────────────┘
          │                    │                     │
          │ 1:N (ORM cascade)  │ optional deck_id    │ M:N via join
          └────────────────────┘                     │
                                                     ▼
                                          ┌──────────────────────┐
                                          │exam_template_questions│
                                          └──────────┬───────────┘
                                                     │
                                                     ▼
                                              ┌───────────┐
                                              │ questions │  (shared bank)
                                              └─────┬─────┘
                                                    │
           ┌────────────────────────────────────────┤
           ▼                                        │
    ┌──────────────┐                                │
    │exam_sessions │◄───────────────────────────────┘  (template + user)
    └──────┬───────┘
           │ 1:N pre-created rows
           ▼
    ┌────────────────┐
    │ answer_records │──► questions (snapshot order via order_index)
    └────────────────┘
```

---

## 2. Conventions

| Convention       | Rule                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Primary keys** | UUID (`uuid.uuid4`), Postgres `UUID` type                                                                      |
| **Timestamps**   | `DateTime(timezone=True)`, UTC; most tables have `created_at` / `updated_at`                                   |
| **Ownership**    | User content rows carry `user_id` FK                                                                           |
| **JSON columns** | Used for flexible lists/maps (`options`, `tags`, settings blob) — not relational children                      |
| **Cascades**     | Prefer ORM `cascade="all, delete-orphan"` where ownership is exclusive; column `ondelete=` may differ (see §6) |

---

## 3. Tables

### 3.1 `users`

Identity and lightweight activity metadata.

| Column                      | Type                     | Notes                                                  |
| --------------------------- | ------------------------ | ------------------------------------------------------ |
| `id`                        | UUID PK                  |                                                        |
| `username`                  | String, unique, nullable | Classic signup                                         |
| `email`                     | String, unique, nullable |                                                        |
| `password_hash`             | String, nullable         | Absent for Google / guest                              |
| `google_id`                 | String, unique, nullable | OAuth                                                  |
| `is_guest`                  | Boolean                  | Guest lifecycle cleanup uses `(is_guest, last_active)` |
| `daily_streak`              | Integer                  | Flashcard habit counter                                |
| `last_active`               | timestamptz, indexed     | Guest sweep + activity                                 |
| `last_ip`                   | String(45), nullable     | Audit only — **not** an identity key (NAT)             |
| `created_at` / `updated_at` | timestamptz              |                                                        |

**Children (ownership):** decks, cards, exam sessions, user_settings (delete cascade).  
**Exam templates:** `user_id` SET NULL on user delete so public/custom template rows can survive or detach depending on product rules for built-ins (`user_id` null + `seed_key`).

---

### 3.2 `decks`

Named collections of flashcards belonging to one user.

| Column                      | Type                                | Notes |
| --------------------------- | ----------------------------------- | ----- |
| `id`                        | UUID PK                             |       |
| `user_id`                   | UUID → `users.id` ON DELETE CASCADE |       |
| `name`                      | String                              |       |
| `description`               | Text, nullable                      |       |
| `created_at` / `updated_at` | timestamptz                         |       |

**Relationship to cards:** ORM `Deck.cards` uses `cascade="all, delete-orphan"`. **Deleting a deck deletes its cards** in the application session, even though `cards.deck_id` is declared `ON DELETE SET NULL` at the column level. UI copy must say cards are deleted, not moved to Unfiled.

---

### 3.3 `cards`

Flashcard content + presentation order + SM-2 fields.

| Column                      | Type                                               | Notes                                                                   |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| `id`                        | UUID PK                                            |                                                                         |
| `user_id`                   | UUID → `users.id` ON DELETE CASCADE                | Owner (required even when unfiled)                                      |
| `deck_id`                   | UUID → `decks.id` ON DELETE SET NULL, **nullable** | `NULL` = Unfiled                                                        |
| `front` / `back`            | Text                                               | Markdown-capable content                                                |
| `position`                  | Integer                                            | Order **within a deck** (study / match / workspace). Independent of SRS |
| `image_url`                 | Text, nullable                                     |                                                                         |
| `notes`                     | Text, nullable                                     |                                                                         |
| `srs_interval`              | Integer                                            | SM-2                                                                    |
| `srs_ease_factor`           | Float, default 2.5                                 | SM-2                                                                    |
| `srs_repetitions`           | Integer                                            | SM-2                                                                    |
| `srs_next_review`           | timestamptz, indexed                               | SM-2 due date                                                           |
| `created_at` / `updated_at` | timestamptz                                        |                                                                         |

**Behaviors that shape the UI:**

- Unfiled cards (`deck_id IS NULL`) always get `position = 0` on write — **no server reorder** for Unfiled.
- Creating a card or changing `deck_id` **appends** it (`position` = max+1 for that deck).
- Reorder API requires an **exact cover** of all card IDs in the deck.

---

### 3.4 `questions` (shared bank)

Questions are **not** owned by a single exam. Placement lives only on the join table.

| Column                      | Type                                           | Notes                                                             |
| --------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| `id`                        | UUID PK                                        |                                                                   |
| `user_id`                   | UUID → `users.id` ON DELETE SET NULL, nullable | Null for seeded / unowned bank content                            |
| `exam_type`                 | String, indexed                                | `toeic`, `ielts`, `hsk`, `jlpt`, `custom` — required for browsing |
| `part`                      | String, indexed, nullable                      | Free-form (e.g. `part5`); not FK-validated against templates      |
| `passage_group`             | String, indexed, nullable                      | Shared-passage sets (TOEIC 6/7, etc.)                             |
| `archived_at`               | timestamptz, indexed, nullable                 | **Soft delete**                                                   |
| `question_text`             | Text                                           | Stem                                                              |
| `passage`                   | Text, nullable                                 | Reading block                                                     |
| `type`                      | String, default `multiple-choice`              |                                                                   |
| `options`                   | JSON                                           | List of option strings (typically 4)                              |
| `correct_answer`            | String                                         | `"A"` \| `"B"` \| `"C"` \| `"D"`                                  |
| `explanation`               | Text, nullable                                 |                                                                   |
| `tags`                      | JSON list, nullable                            | Used in results “by category”                                     |
| `difficulty`                | String, default `medium`                       | `easy` \| `medium` \| `hard`                                      |
| `created_at` / `updated_at` | timestamptz                                    |                                                                   |

**Invariants (do not work around):**

1. **Soft delete only** for bank listings (`archived_at`). Hard delete would cascade destroy `answer_records` history.
2. After a question has been answered in any session, mutating `options` / `correct_answer` is rejected (409) so stored `is_correct` stays consistent with the key shown later.
3. Session results resolve from **`answer_records`**, not from the template’s current join list.

---

### 3.5 `exam_templates`

An exam is a named timed set of links into the bank (plus scoring meta).

| Column                      | Type                                           | Notes                                                |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `id`                        | UUID PK                                        | Stable across seed version bumps                     |
| `user_id`                   | UUID → `users.id` ON DELETE SET NULL, nullable | Null for built-ins / detached                        |
| `name`                      | String                                         | Display only — **never** match seeds by name         |
| `exam_type`                 | String, indexed                                |                                                      |
| `description`               | Text, nullable                                 |                                                      |
| `duration_minutes`          | Integer                                        | Frozen onto session as `time_limit_minutes` at start |
| `total_questions`           | Integer                                        | Denormalized count; maintained by app services       |
| `passing_score`             | Integer %                                      | Default 60                                           |
| `level`                     | String, nullable                               | e.g. N5, Band 7                                      |
| `is_public`                 | Boolean, indexed                               | Built-in / shared catalog                            |
| `tags`                      | JSON list, nullable                            | Template-level tags                                  |
| `seed_key`                  | String, unique, nullable                       | Built-in identity (`toeic-reading-full`, …)          |
| `seed_version`              | String, nullable                               | Bump → update **in place** (same `id`)               |
| `created_at` / `updated_at` | timestamptz                                    |                                                      |

---

### 3.6 `exam_template_questions` (join)

Places one bank question at one position in one template.

| Column             | Type                                         | Notes                                      |
| ------------------ | -------------------------------------------- | ------------------------------------------ |
| `id`               | UUID PK                                      |                                            |
| `exam_template_id` | UUID → `exam_templates.id` ON DELETE CASCADE |                                            |
| `question_id`      | UUID → `questions.id` ON DELETE CASCADE      |                                            |
| `order_index`      | Integer                                      | Presentation / session freeze order source |

**Unique constraint:** `(exam_template_id, question_id)` — a question appears at most once per exam.

---

### 3.7 `exam_sessions`

One attempt by one user on one template.

| Column                          | Type                                         | Notes                           |
| ------------------------------- | -------------------------------------------- | ------------------------------- |
| `id`                            | UUID PK                                      |                                 |
| `user_id`                       | UUID → `users.id` ON DELETE CASCADE          |                                 |
| `exam_template_id`              | UUID → `exam_templates.id` ON DELETE CASCADE |                                 |
| `started_at`                    | timestamptz                                  |                                 |
| `finished_at`                   | timestamptz, nullable                        |                                 |
| `time_limit_minutes`            | Integer                                      | Snapshot of duration at start   |
| `score`                         | Float                                        | Percent after finish            |
| `correct_count` / `total_count` | Integer                                      |                                 |
| `status`                        | String, indexed                              | e.g. `in-progress`, `completed` |
| `created_at` / `updated_at`     | timestamptz                                  |                                 |

---

### 3.8 `answer_records`

Per-question answer within a session — also the **composition snapshot** for that attempt.

| Column               | Type                                        | Notes                              |
| -------------------- | ------------------------------------------- | ---------------------------------- |
| `id`                 | UUID PK                                     |                                    |
| `session_id`         | UUID → `exam_sessions.id` ON DELETE CASCADE |                                    |
| `question_id`        | UUID → `questions.id` ON DELETE CASCADE     |                                    |
| `order_index`        | Integer                                     | Order as sat; results sort by this |
| `user_answer`        | String                                      | `""` until answered; then `A`–`D`  |
| `is_correct`         | Boolean                                     | Set when answered / finished       |
| `time_taken_seconds` | Integer                                     |                                    |

---

### 3.9 `user_settings`

One row per user; freeform JSON for prefs.

| Column                      | Type                                            | Notes          |
| --------------------------- | ----------------------------------------------- | -------------- |
| `id`                        | UUID PK                                         |                |
| `user_id`                   | UUID → `users.id` ON DELETE CASCADE, **unique** | 1:1            |
| `settings`                  | JSON object                                     | See keys below |
| `created_at` / `updated_at` | timestamptz                                     |                |

---

## 4. Relationship summary

| From         | To                   | Cardinality  | Delete behaviour (effective)                                     |
| ------------ | -------------------- | ------------ | ---------------------------------------------------------------- |
| User         | Deck                 | 1:N          | Cascade delete decks                                             |
| User         | Card                 | 1:N          | Cascade delete cards                                             |
| User         | ExamSession          | 1:N          | Cascade delete sessions (+ answers)                              |
| User         | UserSettings         | 1:0..1       | Cascade delete settings                                          |
| User         | ExamTemplate         | 1:N optional | Template `user_id` SET NULL                                      |
| User         | Question             | 1:N optional | Question `user_id` SET NULL                                      |
| Deck         | Card                 | 1:N optional | **ORM cascade deletes cards** (column SET NULL is overridden)    |
| ExamTemplate | ExamTemplateQuestion | 1:N          | Cascade delete **links**                                         |
| Question     | ExamTemplateQuestion | 1:N          | Cascade delete links if question hard-deleted                    |
| ExamTemplate | ExamSession          | 1:N          | Cascade delete sessions                                          |
| ExamSession  | AnswerRecord         | 1:N          | Cascade delete records                                           |
| AnswerRecord | Question             | N:1          | Question hard-delete cascades records (hence soft-delete policy) |

---

## 5. Migrations (history)

| Rev    | Name                          | What it introduced                                                            |
| ------ | ----------------------------- | ----------------------------------------------------------------------------- |
| `0001` | initial schema                | users, decks, cards (base), exam templates/questions/sessions (early shape)   |
| `0002` | card position / image / notes | presentation fields on cards                                                  |
| `0003` | question bank                 | shared `questions`, join table, soft delete, seed keys, session `order_index` |
| `0004` | guest lifecycle               | guest fields / cleanup support on users                                       |
| `0005` | user settings                 | `user_settings` table                                                         |
| `0006` | exam type flags               | `exam_type_flags` table                                                       |
| `0010` | listening media               | `audio_url`, `image_url` on questions                                         |
| `0011` | question answer key           | nullable `answer_key` JSON on questions                                       |
| `0012` | feature flags                 | `feature_flags` table (kill switches)                                         |
| `0013` | ai explanations               | `ai_explanations` cache table                                                 |
| `0014` | ai generation jobs            | `ai_generation_jobs` table                                                    |
