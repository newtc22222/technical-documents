---
id: release-v1.0.0
title: LinguFlow 1.0.0 — Official release
sidebar_label: v1.0.0
sidebar_position: 4
description: Release notes for LinguFlow v1.0.0, the first official production release following Horizon A & B hardening.
---

# LinguFlow 1.0.0 — Official release

**Release version:** `v1.0.0`  
**Status:** Official (not pre-release)  
**GitHub Release:** https://github.com/newtc22222/lingu-flow/releases/tag/v1.0.0  
**Previous:** [v0.1.0](./release-v0.1.0.md)

This is the first **official** production release after the Horizon A (secure & correct) and Horizon B (fast & operable) programs. The product brand is **LinguFlow** — the browser title no longer says “MVP”.

---

## Product highlights

| Area | What’s in 1.0.0 |
|------|------------------|
| Flashcards | SM-2 spaced repetition, decks, Learn / Match modes, keyboard-first arcade UI |
| Exams | Certification simulator (TOEIC, IELTS, HSK, JLPT), shared question bank, timed sessions, results review |
| Accounts | Register / login, Google OAuth, guest sessions with lifecycle cleanup, user settings |
| Media | Cloudflare R2 presigned upload/download |
| Deploy | **Production:** Vercel (SPA) + Railway (FastAPI + Postgres) + R2 · **Local:** `docker compose` |

---

## New since v0.1.0 — Security & correctness (Horizon A)

These closed the trust boundaries before treating the app as production-official:

- **JWT production guard** — production never boots with a weak or missing secret from `.env` alone.
- **Exam visibility** — private templates resolve only for public or owner; strangers get **404** (not 403).
- **Answer keys** — session details reveal keys/explanations only when the session is **completed**.
- **Transaction ownership** — HTTP requests commit only in `get_db()`; services `flush`, they do not dual-commit mid-request.
- **Postgres integrity harness** — `@pytest.mark.postgres` cascade/transaction tests in CI.
- **Seed ownership** — built-in exams seed from `entrypoint` after migrate, with `pg_advisory_lock`; not on every API worker lifespan.
- **SSE removal** — unused `/api/events` JWT-in-query path removed.

---

## New since v0.1.0 — Performance & operations (Horizon B)

- **Dashboard scale** — progress uses SQL aggregates / column projections.
- **UTC streaks** — consecutive study days use UTC calendar boundaries.
- **Server exam timer** — wall-clock limit + 30s grace; post-expiry answers rejected; finish remains allowed and **idempotent**.
- **Health** — Postgres `healthcheck` in compose; backend waits until healthy; `GET /api/health/ready` probes the DB; `GET /api/health` stays pure liveness.
- **Auth rate limits** — login / register / guest throttled per IP.
- **Observability** — structured request logs (`method`, `path`, `status`, `latency_ms`); optional `SENTRY_DSN`.
- **Config honesty** — `REDIS_URL` and AI API keys marked **reserved** until Phase 2.
- **Frontend quality** — data-access convention documented (`apiFetch` + Pinia / feature `api.ts`); **Vitest** + CI for pure helpers and critical store paths.

---

## Branding

- Browser document title: **`LinguFlow`** (MVP label removed in this release).

---

## Quality gates (as of release)

| Suite | Notes |
|-------|--------|
| Backend pytest | SQLite default suite + Postgres integrity job on CI |
| Frontend | `vue-tsc` + Vite build, ESLint, stylelint, Prettier, **`npm test` (Vitest)** |

---

## What is not in 1.0.0 (planned later)

**Next:** [v1.1.1](./release-v1.1.1.md) — TOEIC Listening (manual track) and exam-integrity sitting lock.

See also: [Architecture & Database Schema](../architecture/architecture-and-database-schema.md), [Deployment Guide](../operations/deployment-guide.md), [API Documentation](../architecture/api-documentation.md).
