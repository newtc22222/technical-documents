---
id: release-v1.4.0
title: LinguFlow 1.4.0
sidebar_label: v1.4.0 (Current)
sidebar_position: 1
description: Release notes for LinguFlow v1.4.0, introducing Assessment v2 Question DSL, exam composer & booth, Question Bank console, and AI provenance.
---

# LinguFlow 1.4.0

**Release version:** `v1.4.0`  
**Status:** Current production  
**GitHub Release:** https://github.com/newtc22222/lingu-flow/releases/tag/v1.4.0  
**Previous:** [v1.3.1](./release-v1.3.1.md) · [v1.3.0](./release-v1.3.0.md)

Production cut of staging since v1.3.1. This major update introduces the comprehensive **Assessment v2 Architecture** built upon a canonical Question Domain-Specific Language (DSL), a redesigned Question Bank operator console, an interactive Exam Composer, the simulated Exam Booth with OMR answer sheet, and an AI generation pipeline backed by human review gates and provenance tracking.

Version strings are `1.4.0` on the package, `GET /api/health`, OpenAPI, and the arcade footer.

---

## Product Highlights

| Area | What's in 1.4.0 |
| ------ | ------------------ |
| **Question DSL (v2)** | Structured content blocks (documents, media, markdown) and multi-kind response models (`single_choice`, `multi_choice`, `text_entry`, `matching`, `ordering`, `numeric`, `extended_text`) with deterministic scoring engines |
| **Question Bank** | Two-column operator console with full-text search, facet/tag filters, collapsible passage-set cards, step preview modals, and sharing controls |
| **Exam Composer** | Three-step interactive exam builder with bank drawer integration, node editor, section configurations, and real-time paper preview |
| **Exam Runtime & Booth** | Exam lobby with briefing modal, distraction-free Exam Booth with digital clock, OMR mark form / answer sheet, integrity monitor, and rich ResultsView |
| **AI Generation v2** | Generation lands in a draft review queue (`origin="ai"`); complete provenance tracking (`AiProvenance`); sliding-window rate limit and concurrent in-flight caps |
| **Resource Sharing** | Visibility controls (`private`, `protected`, `public`) for decks, questions, and exams while keeping personal SM-2 progress and attempt records isolated |
| **Typography & UI** | Locally-hosted `LinguFlow Display` (SVN-Determination Sans) with complete Vietnamese diacritic support, numeric arcade font, and full `en`/`vi` internationalization |

---

## New Since v1.3.1

### 1. Assessment v2 Engine & Canonical Question DSL

- **Structured Question DSL (`app/domain/dsl.py`)**: Rebuilt the question-exam domain model around canonical typed data structures. Questions are composed of typed content blocks (`TextBlock`, `DocumentBlock`, `AudioBlock`, `VideoBlock`, `ImageBlock`) and explicit response schemas.
- **Deterministic Evaluation**: Dedicated per-kind scorers (`single_choice`, `multi_choice`, `text_entry`, `matching`, `ordering`, `numeric`, `extended_text`) with strict schema validation (`extra="forbid"`).
- **Immutable Versioning**: Questions, stimuli (passages), and exam templates are versioned (`QuestionVersion`, `StimulusVersion`, `ExamVersion`). When an exam is taken, the attempt snapshot pins the exact version sat by the learner, preserving historical integrity regardless of subsequent bank updates.
- **Passage-Set Architecture**: Native support for grouped reading and listening items referencing a shared `Stimulus` entity with order preservation and independent draft/published states.

### 2. Question Bank Operator Console

- **Refactored Bank Layout**: Modernized two-column operator console with responsive filter rail, tag cloud, difficulty indicators, and instant full-text search backed by Postgres denormalized search vectors.
- **Passage-Set Cards**: Grouped passage items collapse into a cohesive card displaying the stimulus text, inline blank markers, and constituent stems, functioning cleanly across pagination boundaries.
- **Authoring Cabinet**: Dedicated single-question and passage-set authoring dialogs with input validation, media attachments, and real-time validation.
- **Import Normalizers**: Structured import workflow supporting TOEIC and IELTS format guides for rapid bank population.

### 3. Exam Composer & Runtime Experience

- **Interactive Exam Composer**: Three-step workflow to configure exam metadata, draft and organize sections/parts via node trees, and attach items from the Question Bank drawer.
- **Briefing & Lobby**: Catalog view of available exams with historical score rail and pre-sitting instruction briefing modal.
- **Simulated Exam Booth**: Timed examination booth featuring section navigation tabs, flag/bookmark controls, exit confirmation dialogs, and a responsive OMR (Optical Mark Recognition) answer sheet.
- **Comprehensive Results Analysis**: Post-exam review with accuracy score ring, section performance breakdowns, detailed question-by-question explanations, and answer diffs.

### 4. AI Generation v2 & Provenance Pipeline

- **Human Review Gate**: AI-generated items immediately enter `status="draft"` with `origin="ai"`; unverified questions are never automatically published into the live pool.
- **Draft Review Queue**: Dedicated console for instructors to inspect, edit, approve, or reject generated items individually or in batch.
- **Complete Provenance Record**: Each generated version links to an `AiProvenance` entry capturing model ID, provider, prompt template version (`PROMPT_VERSION = "v2-2"`), input parameters, and raw completion text.
- **Sliding-Window & In-Flight Guards**: Upstream rate limiter enforcing per-user hourly generation budgets and concurrency locks to prevent quota abuse.
- **Contextual Explanations**: `POST /api/attempts/{id}/items/{position}/explain` provides on-demand pedagogical explanations for sat items.

### 5. Resource Sharing & Access Control

- **Visibility Levels**: Decks, question bank items, and exams support `private`, `protected`, and `public` visibility.
- **Personal State Isolation**: Learners can sit public or shared exams and study public decks while SM-2 spaced repetition schedules, cards progress, and exam attempt histories remain private.

### 6. Design System, Typography & i18n

- **Pixel Display Typography**: Deployed locally-hosted `LinguFlow Display` (SVN-Determination Sans) offering full Vietnamese diacritic support across the retro-arcade interface, plus a dedicated `font-numeric` face for counters and timers.
- **Bilingual Interface**: Full English (`en`) and Vietnamese (`vi`) localization covering the assessment engine, question bank, exam composer, and sitting interfaces.

---

## Deploy Notes (Production)

### Database Migrations

Three migrations introduced in this release:

1. **`0017_assessment_v2_schema`**: Renames legacy assessment tables to `legacy_*` prefixes and creates v2 tables (`stimuli`, `stimulus_versions`, `questions`, `question_versions`, `question_keys`, `exams`, `exam_versions`, `exam_nodes`, `exam_slots`, `attempts`, `attempt_items`, `responses`, `scores`, `ai_provenance`).
2. **`0018_exam_structure_catalog`**: Adds catalog index and structure support for standard exam frameworks.
3. **`0019_bank_search_text`**: Adds full-text search vector columns and indexes on questions and stimuli.

Execute migration via:

```bash
alembic upgrade head
```

### Seeder & CLI Commands

- Built-in startup seeding has been decoupled from application boot.
- To seed the standard 120-question TOEIC Listening & Reading mock exam:

```bash
python -m scripts.seed_toeic_120 --email admin@example.com
```

### Environment Variables

No mandatory new environment variables. Optional configurations:

- `GENERATE_MAX_CONCURRENT`: Maximum simultaneous in-flight AI generation requests per user (default: `2`).
- `GENERATE_WINDOW_LIMIT`: Hourly generation cap per user (default: `10`).

Verify system health:

```bash
curl http://localhost:8000/api/health
# Expect: { "status": "healthy", "version": "1.4.0" }
```

---

## Not in This Release

- Real-time microphone audio capture for speaking modules (#79, #89)
- Manual scoring workflow for open-ended extended essays (#20)
- Redis cache-aside layer (public reads leverage HTTP caching and sessionStorage)

---

## Shipped Pull Requests

- **#111**: Docker compose image prefix tags and port configuration
- **#112**: Extract ExamSessionService from ExamService
- **#113**: Unify typography scale, local display fonts, and toast notifications
- **#114**: Assessment: rebuild on Question DSL and restore exam + bank surfaces

**Tag:** `v1.4.0` on `main`.
