---
id: release-v1.2.0
title: LinguFlow 1.2.0
sidebar_label: v1.2.0
sidebar_position: 2
description: Release notes for LinguFlow v1.2.0, adding five new item types and IELTS exam support.
---

# LinguFlow 1.2.0

**Release version:** `v1.2.0`  
**Status:** Superseded by [v1.2.1](./release-v1.2.1.md)  
**GitHub Release:** https://github.com/newtc22222/lingu-flow/releases/tag/v1.2.0  
**Previous:** [v1.1.1](./release-v1.1.1.md) · [v1.0.0](./release-v1.0.0.md)

Production cut of staging since v1.1.1. The exam system is no longer TOEIC-only:
per-exam-type behaviour moved into code-driven registries, five new item types
shipped, and IELTS became the first exam registered against the new abstraction.

Version strings are `1.2.0` on the package, OpenAPI, `GET /api/health`, and the
arcade footer — and from this release they all derive from a single authored
location.

---

## Product highlights

| Area | What's in 1.2.0 |
|------|------------------|
| Item types | Five beyond multiple choice: `matching`, `true-false-not-given`, `fill-in-blank`, `short-answer`, `essay` |
| IELTS | Registered end to end; sections named by skill, each narrowing the item types it accepts |
| Built-in exams | **Academic Reading** (14 questions, one original 400–600 word passage, 60 min) and **Academic Writing** (2 ungraded essay tasks) |
| Results | Written responses show as *awaiting review* rather than wrong; a mixed paper reports the graded denominator |
| Versioning | Authored once in the root `package.json`; a guard test fails CI on drift |

---

## New since v1.1.1

### Item types and exam-type registries

- `matching` and `true-false-not-given` are choice-shaped and reuse
  `options` / `correctAnswer`
- `fill-in-blank` and `short-answer` are text-graded — whitespace-collapsed and
  case-folded unless `caseSensitive`
- `essay` is captured and never auto-scored
- An all-essay paper no longer reads "0% — NOT PASSED"

### Authoring and sitting

- Alembic `0011_question_answer_key` — nullable `answer_key` JSON on `questions`
- Authoring is section-aware: the item-type selector offers only what the chosen
  section uses, and switching exam type re-defaults the section
- The API rejects an item type a *registered* section does not use (422).
  `custom` exams and questions without a part stay unconstrained
- Free-text answers save on a 600 ms per-question debounce, are serialized per
  question so a slow write cannot persist a stale prefix, and are flushed and
  awaited before submit
- An answered question's answer key stays frozen (409) — `answer_key` joins the
  existing freeze-diff

### Engineering

- The version is authored once in the root `package.json`. `npm run version:sync`
  writes it into `frontend/package.json` and a generated `backend/app/version.py`.
- The Postgres integrity CI job now runs with automated verification.

---

## Deploy notes (production)

Railway applies **Alembic `0011_question_answer_key`** — additive and
nullable, no backfill.

The seeder runs from the same entrypoint and updates built-in content:
- Two new public IELTS templates appear (`ielts-academic-reading-1` and writing).
- `ielts-academic-reading-1` seeds at `seedVersion` 4; the template row is updated in place.

Confirm `GET /api/health` reports `"version": "1.2.0"`.

---

## Shipped PRs

- #102 generalize the exam system beyond TOEIC (IELTS build-out)
- #103 this release (staging → main)
