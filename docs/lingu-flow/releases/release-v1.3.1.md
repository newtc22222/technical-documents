---
id: release-v1.3.1
title: LinguFlow 1.3.1
sidebar_label: v1.3.1
sidebar_position: 2
description: Release notes for LinguFlow v1.3.1, adding TOEIC part6/part7 passage sets, editable Question Bank sets, and markdown-table passages.
---

# LinguFlow 1.3.1

**Release version:** `v1.3.1`  
**Status:** Superseded by [v1.4.0](./release-v1.4.0.md)  
**GitHub Release:** https://github.com/newtc22222/lingu-flow/releases/tag/v1.3.1  
**Previous:** [v1.3.0](./release-v1.3.0.md) · [v1.2.1](./release-v1.2.1.md)

Production cut of staging since v1.3.0. AI generation gains TOEIC part6 (text
completion) and part7 (reading comprehension) passage sets, a generated set
in the Question Bank can be edited as a whole, and passages/explanations
keep their paragraph breaks — with part7 able to produce a real markdown
table for schedules, price lists, and invoices.

Version strings are `1.3.1` on the package, `GET /api/health`, OpenAPI, and
the arcade footer.

---

## Product highlights

| Area | What's in 1.3.1 |
| ------ | ------------------ |
| AI generation | TOEIC part6/part7 passage sets (not just flat part5 questions); sharper part5 distractor/explanation quality; per-part topic suggestions |
| Question Bank | A set renders as one grouped card with inline `[N]` blank tags; "Edit document" rewrites the shared passage and every stem in one request |
| Passage rendering | Multi-paragraph passages/explanations keep their line breaks; part7 can render a real markdown table instead of prose |
| Live sittings | AI hints (`H`) are no longer available mid-exam — rejected server-side before any vendor call |
| Admin | Sortable tables and UI cleanup on the user/feature-flag panels |

---

## New since v1.3.0

### TOEIC part6/part7 AI generation

- `POST /api/ai/generate-questions` now produces linked passage sets for
  `toeic`/`part6` and `toeic`/`part7`, reusing the existing shared-passage
  storage (`passage_group`) — no schema change.
- **Part 6** is always exactly 4 stems: three word/phrase blanks
  (`blankType: "word"`) testing grammar, word form, or vocabulary, plus one
  sentence-insertion blank (`blankType: "sentence"`) whose options are full
  candidate sentences. Structural validation rejects a candidate whose
  blank markers aren't ordered `____(1)____`..`____(4)____` or whose
  `blankType` mix doesn't match.
- **Part 7** is 2–4 stems with `questionType` (detail / inference /
  vocabulary / purpose / not-except) — a set needs at least two distinct
  types, and wrong options must be a plausible misreading of the passage
  rather than something irrelevant to it.
- The generate modal's "how many sets" is capped at 5 for these parts
  (flat generation stays capped at 10 — one set is heavier output than one
  question). Topic suggestions are now scoped per exam part: part6/part7
  offer passage-genre topics (office-memo, business-email, invoice-billing,
  travel-itinerary, and 10 more) instead of falling back to generic
  grammar/vocabulary topics.

### Sharper part5 prompt quality

- Distractors must share the same word family (word-form items) or be
  plausible near-synonyms (vocabulary items) — never eliminable by meaning
  alone.
- Explanations address every option by letter, not just the key.
- Sentences stay single-topic in a workplace register (memos, meetings,
  invoices, schedules); a batch is required to vary its grammar point and
  its correct-answer letter rather than repeating either.
- `easy` / `medium` / `hard` now have concrete definitions (e.g. "hard"
  means a subtle collocation or a referent separated from the blank by
  another clause) instead of being left to the model's own judgment.

### Editable passage sets

- A generated or manually-authored Part 6/7 set now renders in the
  Question Bank as **one card**: the shared passage (with the same
  `[N]` blank tags the exam view uses) followed by its stems, instead of
  N disconnected flat rows.
- New `PUT /api/questions/sets/{passageGroup}` rewrites the shared passage
  and every stem's own content in one transaction. Stem count/ids must
  match exactly — this is a content edit, not a restructuring tool. Per
  stem, it reuses the existing invariant: once a stem has been answered,
  its options/correct answer/answer key are frozen (409), but its wording
  and the shared passage always stay editable.

### Paragraph- and table-aware passages

- Multi-paragraph passages and explanations no longer collapse into one
  run-on block — `white-space: pre-wrap` now applies everywhere they're
  shown (exam-taking view, Question Bank preview, post-exam results
  review), matching what the exam-taking passage pane already did.
- `MarkdownRenderer.vue` (the existing `marked` + `DOMPurify` component
  already used for flashcards and AI hints) gained a left-align mode, and
  any passage document with no blank markers — every part7 passage, since
  blanks only ever occur in part6 — now renders through it instead of
  plain text. Part6's interactive blank-button rendering is unchanged.
- The generation prompt can now ask for a real markdown table (schedules,
  price lists, invoices, itineraries) instead of folding structured data
  into a sentence — verified against a live provider, including catching
  and fixing an initial version that produced table rows joined on one
  line with no newlines between them.

### Live sittings

- AI hints (`H`) are no longer available during an in-progress exam.
  `POST /api/ai/hint` rejects an in-progress session before any vendor
  call, and the hint control is unmounted from the sitting UI. The control
  and spoiler-filter helpers stay in the codebase for a future practice
  mode.

### Admin

- Sortable tables and a UI cleanup on the user and feature-flag admin
  panels.

---

## Deploy notes (production)

**No migration.** Nothing new under `backend/alembic/versions/` since
v1.3.0 — the passage-set update path reuses the existing `Question` table.

**Seeder:** no seed-version bumps since v1.3.0. No template is rewritten
and no questions are archived.

**Env:** no new variables since v1.3.0.

Confirm `GET /api/health` reports `"version": "1.3.1"`.

---

## Not in this release

- Audio and photography for the TOEIC L&R sample
- Grading of written responses — essays are still captured and excluded
  from the denominator, with no reviewer flow (#20)
- Speaking — no mic capture, no sitter-side upload, no audio playback in
  results (#79, #89, #90, #91)
- Table/chart rendering for part6 — blanks-only prose by design; tables
  are a part7-only capability
- The Question Bank set-card's per-stem stem text is still a single-line
  ellipsis truncation, not wrapped
- `.xlsx` upload, Google Sheets URL fetch, Redis cache-aside
- Scaled and band scoring — scores remain a raw percentage

---

## Shipped PRs

- #110 this release (staging → main)

## Issues closed

None tracked; this work came from iterative design and prompt-quality
review rather than filed issues.

**Tag:** `v1.3.1` on `main`.
