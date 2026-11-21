---
id: deployment-and-runbook
title: Deployment, Configuration & Verification Runbook
sidebar_label: Deployment & Runbook
sidebar_position: 1
description: Environment variables, local development, standalone Docker deployment, backups, and Vitest test coverage.
---

# Deployment, Configuration & Verification Runbook

---

## Environment Variables

Configure `.env` from `.env.example` before starting local development or Docker Compose:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (for host dev: `postgresql://bugtrack:bugtrack@localhost:5432/bugtrack`) |
| `ADMIN_EMAIL` | Yes | Admin login email seeded by `prisma/seed.ts` |
| `ADMIN_PASSWORD` | Yes | Admin password hashed with `bcrypt` (cost 12) on seed |
| `AUTH_SECRET` | Yes | Auth.js v5 JWT signing secret (generate with `openssl rand -base64 32`) |
| `AI_PROVIDER` | No | `openai`, `gemini`, or `heuristic` (defaults to configured key or `heuristic`) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | No | OpenAI API credentials (`OPENAI_MODEL` defaults to `gpt-4o-mini`) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | No | Gemini API credentials (`GEMINI_MODEL` defaults to `gemini-2.5-flash`) |
| `GITHUB_TOKEN` | No | GitHub PAT with `repo` / `issues` scope for `POST /api/feedback/[id]/github` |

---

## Local Development

```bash
cp .env.example .env
npm install
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000` and sign in at `/login` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## Self-Hosted Docker Deployment

The repository ships a multi-stage standalone `Dockerfile` (`node:20-alpine` with `deps`, `builder`, and `runner` stages) and `docker-compose.yml` running `db` (`postgres:16` with a `pg_isready` healthcheck) and `app` (port `3000`, `AUTH_TRUST_HOST="true"`):

```bash
docker compose up -d --build
npx prisma migrate deploy
npm run db:seed
curl http://localhost:3000/api/health
```

`GET /api/health` returns HTTP `200` with `{"status":"ok","database":"connected"}` when PostgreSQL responds to `SELECT 1`, or HTTP `503` otherwise.

:::note Standalone runtime
Because `next.config.ts` sets `output: "standalone"`, run `node .next/standalone/server.js` (as configured in `Dockerfile`) rather than `next start` for standalone production artifacts.
:::

---

## Chrome Extension Setup

1. Replace the placeholder `"https://your-bug-tracker-domain.com/*"` in `extension/manifest.json` `host_permissions` with your deployed Bug Tracking origin (`http://localhost:3000/*` is already included for local development).
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `extension/`.
3. Open the extension's **Options** page (`options.html`) and save your Bug Tracking origin.

---

## Backup & Verification Commands

| Command | Purpose |
| --- | --- |
| `npm run db:backup` | Runs `scripts/backup-data.ts` via `tsx` and exports `projects`, `feedbackItems`, `feedbackNotes`, `feedbackStatusEvents`, and non-secret `projectApiKeys` metadata into `backups/backup-*.json` |
| `npm test` | Runs Vitest (`vitest run`) across 8 test suites (46 tests) |
| `npx tsc --noEmit` | Runs strict TypeScript type-checking |
| `npm run lint` | Runs ESLint (`eslint-config-next` + React hooks rules) |
| `npm run build` | Compiles production Next.js standalone build |

### Automated Test Suites (`tests/`)

- `domain-and-slug.test.ts` (5 tests) — domain normalization and slug sanitization
- `admin-routes-auth.test.ts` (3 tests) — `401` protection across all admin endpoints + slug collision handling
- `public-submit.test.ts` (6 tests) — `404`, honeypot, field validation, extension context block, rate limiting
- `public-endpoints.test.ts` (4 tests) — `/api/lookup`, `/api/projects/public-list`, `/api/health`
- `feedback-triage.test.ts` (9 tests) — query parser, `GET /api/feedback`, inline `PATCH /api/feedback/[id]`
- `ai-triage.test.ts` (7 tests) — heuristic classification, provider fallback, duplicate ranking, `POST /api/feedback/ai-triage`
- `capture-and-integrations.test.ts` (5 tests) — screenshot validation, webhooks (Slack/Discord/JSON), GitHub promotion
- `collaboration-and-ops.test.ts` (7 tests) — internal notes, status history events, `btk_` API keys, `POST /api/v1/feedback`, CSV/JSON export, persistent rate limiting
