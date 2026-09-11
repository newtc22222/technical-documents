---
id: release-v1.3.0
title: LinguFlow 1.3.0
sidebar_label: v1.3.0
sidebar_position: 3
description: Release notes for LinguFlow v1.3.0, introducing the optional AI tutor, flashcard TTS, sheet import, and four-grade Review.
---

# LinguFlow 1.3.0

**Release version:** `v1.3.0`  
**Status:** Superseded by [v1.3.1](./release-v1.3.1.md)  
**GitHub Release:** https://github.com/newtc22222/lingu-flow/releases/tag/v1.3.0  
**Previous:** [v1.2.1](./release-v1.2.1.md) · [v1.2.0](./release-v1.2.0.md)

Production cut of staging since v1.2.1. The product gains an optional AI tutor,
browser text-to-speech on flashcards, spreadsheet import for decks, four-grade
Review, and a Learn batch that requeues misses.

Version strings are `1.3.0` on the package, `GET /api/health`, OpenAPI, and the
arcade footer.

---

## Product highlights

| Area | What's in 1.3.0 |
| ------ | ------------------ |
| AI tutor | Explain a flipped card or a finished exam answer; generate unattached bank questions; opt-in non-spoiling hint (`H`) in a live sitting |
| Flashcards | Speak the visible face or a text selection (`S`); Review grades are Again / Hard / Good / Easy (scores 1–4) |
| Learn | Lobby batch size 10 / 20 / 30 / all; missed cards return until correct; MCQ options shuffle per prompt |
| Library | Paste a sheet or pick a `.csv` to fill a deck (preview first; duplicate fronts skipped) |
| Performance | Public exam catalog is cacheable; remounts reuse sessionStorage; hashed `/assets/*` are immutable |

AI is optional. Study, grading, and exams work with empty vendor keys and with
the `ai` kill switch off. See [AI Features](../features/ai-features.md) and
[AI Service Layer](../features/ai-service-layer.md).

---

## New since v1.2.1

### Optional AI tutor (#96)

- **Explain** a flipped review/learn card, or a question on a **finished**
  results screen. In-progress sittings 409 — that would leak the key.
- **Generate** from the question bank: one or more topics, exam type, reading
  section, item type, count (1–10), difficulty. `POST /api/ai/generate-questions`
  returns 202 + `jobId`; an in-process worker inserts **unattached** questions
  owned by the caller. Never auto-attaches to a template.
- Generate is reading-only. The API rejects a listening/writing part
  (`part is not a generateable reading section`).
- Generated items are stamped with topic tags and the chosen part. Teaching
  notes are required on explanations.
- **Hint (`H`)** during a live sitting. Opt-in; does not pause the clock. A
  code-side spoiler filter discards text that names the winning letter or
  option; a slip becomes “AI is temporarily unavailable”, not a leak.
- Registered non-guest only (403 guests). Cross-user card / session / job
  lookups are 404. Provider errors are 503, never 500.
- Admin kill switch: `GET/PATCH /api/feature-flags` (`ai`). Missing row =
  enabled. Disable it and every `/api/ai/*` 503s without a redeploy.
- Gemini is the default (`AI_DEFAULT_PROVIDER=gemini`). HSK/JLPT always use
  Gemini. Empty keys keep core flows working; only AI routes 503.

### Flashcard study (#108)

- Web Speech API on Review / Learn / deck-detail. `S` speaks the selection if
  it is inside the study root, otherwise the visible face; `S` again stops.
  Speak lives on the review card. Match has no speech.
- One Settings `speechLang` (`en-US` / `vi-VN` / `zh-CN` / `ja-JP`) on the
  existing `user_settings` JSON. Voices come from the OS, not LinguFlow.
- Review is Again / Hard / Good / Easy (scores 1–4) instead of binary 1/4.
  Keys 1–4 while flipped. The backend already accepted the full SM-2 scale.
- Learn lobby: batch 10 / 20 / 30 / all. Misses go to the back of the current
  round until correct. MCQ distractors and button order shuffle per prompt
  (and again when a miss is requeued).
- Review progress on a large deck is `n / total`, not a row of overflow dots.
  The review card no longer collapses to a thin orange line.

### Sheet import (#107)

- Parse in the browser (`sheetRows.ts`): RFC 4180, delimiter sniffing
  (comma / tab / semicolon), BOM strip, EN and VI header aliases.
- `front` + `back` required, `notes` optional. Bad rows are reported and
  excluded; only an uninterpretable sheet (no header, over 500 rows, over
  200 KB) fails outright.
- `POST /api/decks/{deck_id}/cards/import` inserts in one transaction.
  Duplicate fronts (in the deck or the payload) are skipped. A foreign deck
  id 404s.

### Caching (#106)

- Redis is **not** wired. `Cache-Control` helpers live in
  `app/core/http_cache.py`.
- `GET /api/exam-types` is publicly cacheable (30s + SWR).
- `GET /api/exams/templates?scope=public` returns only public templates and
  may be cached. The default mixed list is `no-store`.
- Public sit briefing supports ETag / 304; private briefing is `no-store`.
- Frontend persists exam-type flags, settings/locale, username, hub catalog,
  and dashboard progress in `sessionStorage` (SWR).
- Vercel + Docker nginx: hashed `/assets/*` immutable, `index.html` no-cache.

### Question bank and arcade chrome

- Tag multi-select, set-import protocol, real totals, hide-scan, and applied
  filter chips when the scan list is hidden.
- Passage is an input; explanation is a textarea.
- Shared arcade Dropdown, Autocomplete, Table, and toast tickets.

---

## Deploy notes (production)

Railway must apply three additive Alembic revisions — new tables, no backfill:

- `0012_feature_flags` — product kill switches (`ai`). Absence of a row means
  enabled.
- `0013_ai_explanations` — explain cache (`kind`, `subject_key`, `locale`).
- `0014_ai_generation_jobs` — async generate jobs.

The entrypoint already runs `alembic upgrade head` before the app serves.

**Seeder:** no seed-version bumps since v1.2.1. No template is rewritten and
no questions are archived. `toeic-lr-full` stays `isPublic: False`.

**Env (optional).** Empty keys are valid — core study/exam flows stay up; only
`/api/ai/*` 503s. Health checks never ping vendors.

| Variable | Default | Notes |
| ---------- | --------- | ------- |
| `GEMINI_API_KEY` | empty | Required for Gemini (HSK/JLPT always; default for everything else) |
| `OPENAI_API_KEY` | empty | Required only if OpenAI is the default or fallback |
| `AI_DEFAULT_PROVIDER` | `gemini` | `gemini` or `openai`. HSK/JLPT ignore this |
| `GEMINI_MODEL` | `gemini-2.0-flash` | |
| `GEMINI_FALLBACK_MODEL` | empty | Same-provider fallback |
| `OPENAI_MODEL` | `gpt-4o-mini` | |
| `OPENAI_FALLBACK_MODEL` | empty | |
| `AI_CROSS_PROVIDER_FALLBACK` | `true` | After same-provider fallback fails. Never for HSK/JLPT |
| `AI_REQUEST_TIMEOUT_SECONDS` | `20` | |

Instant rollback for AI: `PATCH /api/feature-flags/ai` with `{ "enabled": false }`.
No redeploy.

Confirm `GET /api/health` reports `"version": "1.3.0"`.

---

## Not in this release

- Audio and photography for the TOEIC L&R sample, which is what would make it
  publishable
- Grading of written responses — essays are still captured and excluded from
  the denominator, with no reviewer flow (#20)
- Speaking — no mic capture, no sitter-side upload, no audio playback in
  results (#79, #89, #90, #91)
- Learn direction (term ↔ meaning) — spec only, not shipped
- `.xlsx` upload, Google Sheets URL fetch, Redis cache-aside
- Scaled and band scoring — scores remain a raw percentage

---

## Shipped PRs

- #106 cache public exam reads and cut remount refetches
- #107 import flashcards from a CSV or pasted sheet
- #108 flashcard TTS, four-grade Review, and Learn batch/requeue
- #96 explain, generate, and non-spoiling hints
- #109 this release (staging → main)

## Issues closed

None. Phase 2 AI children (#8–#11, epic #76) stay open until staging live-key
smoke and the residual #10 gaps. Listening generate/TTS (#78, #87, #88, #19)
remain Phase 5.

**Tag:** `v1.3.0` on `main`.

**Next:** [v1.3.1](./release-v1.3.1.md) — TOEIC part6/7 AI generation, editable
passage sets, markdown-table passages.
