---
id: release-v2.1.0
title: "LinguFlow 2.1.0"
sidebar_label: "v2.1.0"
sidebar_position: 2
description: "Release notes for LinguFlow v2.1.0: notification inbox with live updates, Web Push and study reminders, per-user themes, and performance work."
---

# LinguFlow 2.1.0

**Release version:** `v2.1.0`  
**Status:** Superseded by [v2.2.0](./release-v2.2.0.md)  
**GitHub Release:** [https://github.com/newtc22222/lingu-flow/releases/tag/v2.1.0](https://github.com/newtc22222/lingu-flow/releases/tag/v2.1.0)  
**Previous:** [v2.0.1](./release-v2.0.1.md) · [v2.0.0](./release-v2.0.0.md)

A feature release (#179). It adds a notification inbox with live updates, Web Push and daily study reminders, user-customisable themes, and a round of performance and security fixes. **It needs three migrations, a new cron service and per-environment VAPID keys; see [Deploy](#deploy).**

Version strings are `2.1.0` in the package manifests, in `GET /api/health` and in the Docker Compose image tags.

---

## What's new

| Area | What changed |
| --- | --- |
| **Notification inbox** | A bell and inbox panel for every signed-in user, backed by a `notifications` table and `GET/POST /api/notifications*`. Types: `srs.due`, `content.shared`, `system.announcement`. See [Notifications & Reminders](../features/notifications-and-reminders.md). |
| **Live updates (SSE)** | `GET /api/notifications/stream` delivers new notifications instantly, fanned out across API processes with Postgres `LISTEN/NOTIFY`. The client falls back to polling the unread count every minute until a stream delivers bytes. |
| **Web Push** | Opt-in browser push with VAPID keys (`/api/push/*`). Dead subscriptions are removed automatically. Push is off, and the app still boots, when the keys are unset. |
| **Study reminders** | An hourly cron job sends one "cards are due" reminder per user per local day, at the hour and time zone each user chose in Settings. |
| **Content shared** | Sharing an item with someone now sends them a `content.shared` notification. |
| **Admin announcements** | `POST /api/admin/announcements` posts a plain-text message to every active registered user. |
| **Themes** | Presets renamed to `arcade-light`, `arcade-dark`, `simple-light`, `simple-dark` (old ids keep working). New per-user **Appearance editor** with validated `themeOverrides`, live draft preview and derived contrast. Exams are locked to an internal `exam` sheet. See [Themes & Appearance](../features/themes-and-appearance.md). |
| **Settings and profile** | The profile and settings pages are grouped into sections. The signed-in header is extracted into `AppHeader` with fixed layout, keyboard handling and ARIA. |
| **Practice hints** | `POST /api/attempts/{id}/items/{position}/hint` gives a non-spoiling nudge on an open practice item, with a Hint panel above Ask in the drill sidecar. Replies that leak the answer are retried once and then refused. |

---

## Performance

| Change | Effect |
| --- | --- |
| API gzips JSON of 1 kB and up | The OpenAPI document goes from about 159 KB to 22 KB. The notification stream is deliberately never compressed. |
| Stable `vendor-framework` chunk and a lazy English locale | Vue, vue-router, Pinia and vue-i18n no longer re-download on every deploy; Vietnamese visitors never fetch the English messages. |
| Logo | A 115 KB traced logo replaced by a 10 KB single-path version. |
| Study queue | Selected in one query, backed by the new `(user_id, srs_next_review)` index on `card_progress`. |
| Exam sitting | Queries batched. |

---

## Fixes

| Area | What changed |
| --- | --- |
| **Login rate limit** | `bcrypt` no longer blocks the event loop, and a spoofed left-most `X-Forwarded-For` hop is ignored. The limiter keys on the right-most `TRUSTED_PROXY_COUNT` hops. |
| **Database connections** | The connection is released before AI and TTS calls instead of being held while the vendor answers. |
| **Exam sections** | A section is closed when its clock lapses (server side), without submitting the whole paper. |
| **Practice** | An answer is locked once immediate feedback has revealed it (the known issue #134 listed under v2.0.1). |
| **Theme exam lock** | The lock no longer leaks into other pages or sticks after the exam. |
| **Notifications** | Singular wording for one due card; a push click that cannot navigate opens a window; streams replay when the first `LISTEN` becomes active. |

---

## Deploy

This release is **not** a drop-in redeploy. In order:

1. **Migrations**, applied by `alembic upgrade head` in `entrypoint.sh` (leave the Railway *Start Command* empty so it runs):
   - `0026_card_progress_user_due`: index `ix_card_progress_user_due`
   - `0027_notifications`: `notifications` table
   - `0028_push_subscriptions`: `push_subscriptions` table

   All three are additive.
2. **VAPID keys**, a **separate pair per environment**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:`) on the API *and* the cron service. Generate with `npx web-push generate-vapid-keys --json`. Without them, push stays off.
3. **Cron service** `due-reminders` from the same repo (root `backend`, Dockerfile builder): start command `python -m app.jobs.send_due_reminders`, schedule `7 * * * *` (hourly, UTC), the API's variables plus the `VAPID_*` ones. It must not run migrations.
4. **Direct Postgres.** The API holds one extra `LISTEN` connection per process; a transaction-pooling proxy cannot carry it.
5. **`TRUSTED_PROXY_COUNT`** (default `1`) is correct when clients reach Railway directly. Behind another proxy hop it may need to be `2`.

Confirm `GET /api/health` reports `version: 2.1.0` and `GET /api/health/ready` is OK. Full steps: [Deployment Guide](../operations/deployment-guide.md).

---

## Verification

Measured on the `staging` branch head before this page was written:

| Gate | Result |
| --- | --- |
| `pytest` (SQLite, Postgres suite skipped) | 887 passed, 9 skipped |
| `npm test` (Vitest) | 1,098 passed in 91 files |
| `vue-tsc -b` | clean |

Staging check: `alembic current` reports `0028_push_subscriptions (head)`; the API gzips `/openapi.json`; the stream answers `200` with `content-encoding: identity` and sends `retry: 5000` immediately; and one manual run of the reminder job logged its summary line and exited 0.

---

## Known issues

Both items below were open on the day of this release and were closed on 2026-10-20, when `frontend/vercel.json` stopped rewriting `/api/*`.

- The SPA now calls the API origin from `VITE_API_BASE_URL`. `VITE_STREAM_BASE_URL` is only an optional override for the notification stream. [v2.2.0](./release-v2.2.0.md) later added a same-origin proxy for `*.vercel.app` pages only. See the [Deployment & DevOps Guide](../operations/deployment-guide.md).
- `TRUSTED_PROXY_COUNT=1` is the setting for Railway's single edge and for the VPS path (browser, then Caddy, then the app). See [VPS deploy](../operations/vps-deploy.md).
