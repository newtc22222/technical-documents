---
id: release-v2.2.0
title: "LinguFlow 2.2.0"
sidebar_label: "v2.2.0 (Current)"
sidebar_position: 1
description: "Release notes for LinguFlow v2.2.0: flashcards and decks redesign, full-page bank authoring, admin console redesign, deck share links and the vercel.app proxy."
---

# LinguFlow 2.2.0

**Release version:** `v2.2.0`  
**Status:** Current production  
**GitHub Release:** [https://github.com/newtc22222/lingu-flow/releases/tag/v2.2.0](https://github.com/newtc22222/lingu-flow/releases/tag/v2.2.0)  
**Previous:** [v2.1.1](https://github.com/newtc22222/lingu-flow/releases/tag/v2.1.1) (tag only) · [v2.1.0](./release-v2.1.0.md)

A feature release (#231). It redesigns flashcards and decks, moves question bank authoring onto full pages, redesigns the admin console, and adds deck share links and a vercel.app proxy for networks that block phivo.dev. **It needs one migration, which runs on start, and has new optional environment variables; see [Deploy](#deploy).**

Version strings are `2.2.0` in the package manifests, in `GET /api/health` and in the Docker Compose image tags.

This page also covers the 2.1.1 patch (#208, tagged `v2.1.1` without its own release page): failed logins say why, `isAdmin` is on every auth payload, the theme switch moved to the auth footer, security headers, and the switch from the Vercel `/api/*` rewrite to direct API calls (`VITE_API_BASE_URL`).

---

## What's new

| Area | What changed |
| --- | --- |
| **Header** | Four sections with a section row underneath: Exams and Bank, Practice and Bank, Study and Decks (#221). |
| **Decks** | A deck page has Study, Cards, Preview and Share tabs. Each deck tile has one main action and a More menu, and a new deck opens on its Cards tab (#222). Big decks load their cards in pages, with per-deck status counts. |
| **Flashcards on phones** | The tile menu is a bottom sheet, Add card and Save stay within thumb reach, card rows have a Reorder toggle, and Delete moves into the card editor (#226). Learn and Match get a session bar with Exit instead of the app header (#224). |
| **Deck share links** | An owner turns on, rotates or turns off one link per deck. A signed-in link holder previews the first cards and copies the deck into their own library; the link grants no access to the original. See [Deck sharing](../features/deck-sharing.md). |
| **Question bank authoring** | One New button opens a chooser for the kind (question, passage set, listening) and the method (write, import, generate) (#223). The question and passage set editors are full pages that ask before discarding changes (#227). The passage set editor has four steps (passage, questions, answers, review) with a checklist (#228). The listening wizard has its own page, with reorderable script lines and guidelines for each TOEIC part (#229). |
| **Admin console** | Every tab has the same width. Users are two groups, accounts and guests, with their own counts, and the signed-in admin no longer sees their own row. Feature flags are tiles coloured by state, in two groups (switched off first), each sorted by when the flag was last switched, saying what the flag covers and what its switch will do. Blueprints have search, a card grid showing each blueprint's sections, and creating and editing in dialogs. |
| **vercel.app proxy** | phivo.dev pages call the phivo.dev API (#219). On `*.vercel.app`, production and staging builds call a same-origin proxy (`/api`, `/api-staging`), and a Vercel middleware passes the real client address with a shared secret, so per-IP limits and `last_ip` see the user. See the [Deployment & DevOps Guide](../operations/deployment-guide.md#how-the-spa-reaches-the-api). |

---

## API changes

| Endpoint | Change |
| --- | --- |
| `GET /api/admin/users` | Leaves out the acting admin, from the page and the total. |
| `GET /api/feature-flags`, `PATCH /api/feature-flags/{key}` | Each row has `updatedAt` (null for a flag that has never been switched). |
| `GET /api/exam-types`, `PATCH /api/exam-types/{type}` | Same `updatedAt` field. |
| `GET/PUT/DELETE /api/decks/{id}/share-link`, `GET /api/shared/{token}`, `POST /api/shared/{token}/copy` | Deck share links. |
| `GET /api/decks/{id}/cards/page`, `GET /api/decks/progress`, `GET /api/decks/{id}/progress` | Big decks load their cards in pages; per-deck status counts. |

Details: [API Documentation](../architecture/api-documentation.md).

---

## Fixes

| Area | What changed |
| --- | --- |
| **Flashcards** | A lobby round no longer offers more cards than the deck has (#225). |
| **Admin** | Switching an exam type uses the server's answer instead of a refetch that the 30 s public cache on `/api/exam-types` could answer with the old state. |
| **Observability** | Unhandled errors, including those raised while a response streams, are logged with their request ID (#217). |
| **Auth (2.1.1)** | A failed login shows the reason; guests keep their language and theme and no longer call forbidden endpoints. |

---

## Deploy

1. **Migration** `0029_deck_share_links` (adds the `deck_share_links` table) runs on start through `backend/entrypoint.sh`. It is additive.
2. **Proxy secret (optional):** `VERCEL_PROXY_SECRET` on the API and the same value as `LF_PROXY_SECRET` on the matching Vercel environment (server-side, not a `VITE_` variable), 16+ characters, different for production and preview. Without it the proxy still works, but rate limits see Vercel's address.
3. Deploy the backend before or with the frontend: the Share tab and the admin console call the new endpoints.

The [VPS deploy](../operations/vps-deploy.md) workflow deployed `lf-api` from the release merge `59fbd57`. Confirm `GET https://lingu-api.phivo.dev/api/health` reports `version: 2.2.0`.

---

## Verification

| Gate | Result |
| --- | --- |
| Backend CI on the release head `18ff117` | SQLite suite and Postgres integrity suite passed |
| Frontend CI on the release head | Vitest passed |
| Backend `pytest` on the release branch before the admin console merge | 1,031 passed, 9 skipped |
| CI on `main` after the merge (`59fbd57`) | Backend and frontend tests passed; VPS deploys for `main` and `staging` succeeded |
| Production health | `GET /api/health` reports `2.2.0` |

---

## Known issues

- The proxy secret is optional. Until `VERCEL_PROXY_SECRET` and `LF_PROXY_SECRET` are set in an environment, its vercel.app pages share Vercel's address in the login rate limiter.
- Some files already failed `lint:style` and `format:check` before this release. CI does not run either.
