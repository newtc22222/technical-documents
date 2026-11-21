---
id: release-v2.0.0
title: "LinguFlow 2.0.0"
sidebar_label: "v2.0.0"
sidebar_position: 4
description: "Release notes for LinguFlow v2.0.0: practice mode, exam blueprints, RBAC, AI listening and speaking prompts."
---

# LinguFlow 2.0.0

**Release version:** `v2.0.0`  
**Status:** Previous production (superseded by [v2.0.1](./release-v2.0.1.md))  
**GitHub Release:** [https://github.com/newtc22222/lingu-flow/releases/tag/v2.0.0](https://github.com/newtc22222/lingu-flow/releases/tag/v2.0.0)  
**Previous:** [v1.4.0](./release-v1.4.0.md) · [v1.3.1](./release-v1.3.1.md)

Production cut of staging since `v1.4.0` (#128). It ships as a major because the change set is large: a practice runtime next to the exam runtime, blueprint-gated exam publishing, role-based access control, AI listening generation with TTS, speaking practice, and content-shaped loading and empty states across the app. The interim `1.5.0` bump on staging was never released; 2.0.0 replaces it.

Version strings are `2.0.0` across package manifests, `GET /api/health`, OpenAPI documentation, and the arcade footer.

---

## Product Highlights

| Area | What's in 2.0.0 |
|------|------------------|
| **Practice mode** | Pause/resume, count-up clock, immediate per-item feedback, an ask/explain panel that never blocks answering, per-question notes, practice sets with an editor, drill history, and a two-block practice lobby |
| **Exam runtime** | Locked sections that open in paper order, listening audio that plays once, unanswered items scored as failed |
| **Exam blueprints** | Composer drafts round-trip to the API; publishing is gated on `blueprint.validate()` (shared Python/TypeScript); admins can override the catalog with per-exam-type templates |
| **AI listening** | AI-generated TOEIC listening items with TTS audio, including Parts 1 and 2 |
| **Roles & permissions** | Client vs Operator roles with a root-admin bypass; AI question generation requires `ai.generate_question` |
| **Speaking practice** | Backend for standalone speaking prompts and attempts (transcript and/or an owned audio key) |
| **Loading & empty states** | Content-shaped skeletons on every loading page; a shared `EmptyState` with themed 16×16 pixel sprites that separates "nothing yet" from "nothing matches" |

---

## New Since v1.4.0

### 1. Practice mode (#118, #119)
- Practice attempts run beside exam attempts, with pause/resume and a count-up clock.
- Immediate-feedback practice shows the verdict and key for each answered item.
- The ask panel explains an item on demand and never blocks answering.
- Per-question notes resurface the next time the same item appears.
- Practice sets: an authored set editor, a drill history, and a lobby split into sets and past drills.

### 2. Exam runtime and blueprints (#117, #118)
- Exams are split into sections that unlock one at a time. Listening audio plays once.
- Unanswered items now score as failed instead of pending.
- The exam composer saves drafts to the API. Publishing requires a valid blueprint; the same `validate()` runs in Python and in the generated `examBlueprint.ts`.
- Admins can override the built-in exam-type catalog with blueprint templates.

### 3. AI listening generation (#120, #121)
- Operators can AI-generate TOEIC listening items with TTS audio, including Parts 1 and 2.
- Scripts are kept as authoring-only source on the stimulus version, so an item can be re-voiced.

### 4. Roles and permissions (#122, #125)
- Client and Operator roles, plus a root-admin allowlist from the environment.
- AI question generation requires the `ai.generate_question` permission.
- The Client role is assigned at sign-in, so `/auth/me` stays read-only.

### 5. Speaking practice backend (#124)
- `GET /api/speaking/prompts` (five built-in English prompts) and `POST /api/speaking/attempts`.
- Registered users only; submits limited to 20 per minute. The mic UI (#90) and AI feedback (#91) come later.

### 6. Loading and empty states (#123, #129)
- Seven new `ContentSkeleton` variants replace "Loading…" lines across the app. Settings no longer flashes default values while it fetches.
- `EmptyState` gives exams, practice, the question bank and flashcards a sprite, a title, one line on what to do next, and the action that does it. Sprites re-skin in light, dark and simple themes and stop blinking under reduced motion.

### 7. Fixes
- Nested exam sections (parts under Listening/Reading) unlock in paper order (#131).
- `/attempts/{id}/results` no longer reveals right/wrong verdicts during an in-progress exam (#131).
- OpenAI structured outputs run without strict mode (#116).
- AI errors and guards moved into the `services/ai` package; no behavior change (#126).

---

## Deploy

**Six additive migrations**, single head: `0020_attempt_runtime`, `0021_exam_blueprints`, `0022_exam_kind`, `0023_stimulus_source`, `0024_rbac`, `0025_speaking_practice`. The entrypoint already runs `alembic upgrade head`.

**Env (optional):** `OPENAI_TTS_MODEL` (e.g. `gpt-4o-mini-tts`), `LISTENING_TTS_TIMEOUT_SECONDS` (default `90`).

**One-off content reset (optional):** take a `pg_dump`, then from `backend/` run `python -m scripts.purge_assessment_content` (dry run), then add `--execute`. It deletes all exams, questions, stimuli and attempts and leaves decks, cards, users and speaking data alone.

Confirm `GET /api/health` reports `version: 2.0.0`.

---

## Verification

| Gate | Result |
| --- | --- |
| `pytest` (SQLite, skip postgres) | 655 passed, 3 skipped |
| `npm test` | 587 passed |
| CI on the release head (`272194b`) | SQLite suite, Postgres integrity suite, Vitest, Vercel all green |

---

## Known issues

- Section time limits are enforced by the client only (#132).
- Re-sitting a drill skips the exam-type and visibility gates (#133).
- Immediate feedback reveals the key but still accepts a changed answer (#134).
- Bank drill `count` has no upper bound (#135).
- In-exam AI hints were removed with assessment v1 and are not yet ported to v2 (#11).

## Not in this release

- Speaking mic recorder UI (#90) and AI spell/grammar feedback (#91)
- AI writing grader (#20)
