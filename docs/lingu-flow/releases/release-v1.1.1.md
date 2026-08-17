---
id: release-v1.1.1
title: LinguFlow 1.1.1
sidebar_label: v1.1.1
sidebar_position: 3
description: Release notes for LinguFlow v1.1.1, introducing TOEIC Listening media, passage sets, and exam integrity lock.
---

# LinguFlow 1.1.1

**Release version:** `v1.1.1`  
**Status:** Superseded by [v1.2.0](./release-v1.2.0.md)  
**GitHub Release:** https://github.com/newtc22222/lingu-flow/releases/tag/v1.1.1  
**Previous:** [v1.1.0](https://github.com/newtc22222/lingu-flow/releases/tag/v1.1.0) · [v1.0.0](./release-v1.0.0.md)

Production cut of staging after the TOEIC listening track and exam-integrity sitting lock. Version strings are `1.1.1` on the package, OpenAPI, `GET /api/health`, and arcade footer.

---

## Product highlights

| Area | What’s in 1.1.1 |
|------|------------------|
| Listening | Author TOEIC Parts 1–4 with audio (and Part 1 photo) on the shared bank; sit with the tape player |
| Sets | Parts 3–4 share one clip via `passageGroup`; set create copies `audioUrl` onto every stem |
| Sitting | Autoplay on the live booth; seekable replay on results and composer preview |
| Integrity | Live sitting hides the app chrome; copy / context menu / inspect shortcuts blocked; docked DevTools warns then force-submits |
| Docs | [TOEIC Listening Items](../features/toeic-listening.md) |

---

## New since v1.1.0

### TOEIC Listening (manual track — #83–#86, PR #97)

- `questions.audio_url` / `image_url` (Alembic `0010_question_listening_media`) — https URL or R2 key
- Media `purpose: "question"` → final keys under `questions/{user}/…` (audio + image types)
- Bank compose defaults to Part 1; Parts 3–4 switch to the set form
- Confirm before removing audio or photo
- Session details expose `audioPlayUrl` / `imagePlayUrl` (session-scoped, not owner-gated)
- Freeze media after a **submitted** answer (`user_answer != ""`)
- Leave-session warning while status is `in-progress`

### Exam integrity

- Sitting route is full-bleed (no app header)
- Copy, right-click, and inspect shortcuts blocked during a live sitting
- Docked DevTools: two warnings, third episode force-submits
- START refused if tools are already open

---

## Deploy notes (production)

1. Railway entrypoint applies **Alembic `0010_question_listening_media`** (`alembic upgrade head` then seed).
2. Listening uses the existing R2 pipeline. Production `R2_*` env and **bucket CORS** stay required.
3. `GET /api/health` reports `"version": "1.1.1"`.

---

## Shipped PRs

- #97 TOEIC listening bank media, upload, and exam player
- #101 this release (staging → main)

See also: [TOEIC Listening Items](../features/toeic-listening.md), [API Documentation](../architecture/api-documentation.md), [Card Image Uploads](../features/card-image-uploads.md).
