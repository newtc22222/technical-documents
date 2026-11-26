---
id: deployment-and-runbook
title: Deployment, Configuration & Verification Runbook
sidebar_label: Deployment & Runbook
sidebar_position: 1
description: Environment variables, local development, standalone Docker deployment, backups, and Vitest test coverage.
---

# Deployment, Configuration & Verification Runbook (`v0.2.0`)

:::note Deployment status
Bug Tracking is **not yet deployed to production** (currently operated locally for development and verification). The Docker Compose and Chrome Extension production host checklists below document the deployment procedure for when the service is promoted to a hosted environment.
:::

---

## Environment Variables (`.env.example`)

Configure `.env` from `.env.example` before starting local development or Docker Compose:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL 16 connection string (for host dev: `postgresql://bugtrack:bugtrack@localhost:5432/bugtrack`) |
| `ADMIN_EMAIL` | Yes | Admin login email seeded by `prisma/seed.ts` |
| `ADMIN_PASSWORD` | Yes | Admin password hashed with `bcryptjs` (12 salt rounds) on seed |
| `AUTH_SECRET` | Yes | Auth.js v5 JWT signing secret (generate with `openssl rand -base64 32`) |
| `AI_PROVIDER` | No | `gemini`, `openai`, or `heuristic` (defaults to configured key, or deterministic `heuristic` if unset) |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI Triage and multimodal AI Investigate |
| `GEMINI_MODEL` | No | Gemini model override (defaults to `gemini-2.5-flash`) |
| `OPENAI_API_KEY` | No | OpenAI API key for AI Triage and multimodal AI Investigate |
| `OPENAI_MODEL` | No | OpenAI model override (defaults to `gpt-4o-mini`) |
| `GITHUB_TOKEN` | No | GitHub PAT for GitHub Issues promotion/sync and live GitHub repo context in AI Investigate |
| `GITLAB_TOKEN` | No | GitLab Personal Access Token (`PRIVATE-TOKEN`) for GitLab Issues promotion/sync |
| `LINEAR_API_KEY` | No | Linear GraphQL API key for Linear issue promotion/sync |
| `JIRA_EMAIL` | No | Atlassian account email for Jira Cloud Basic auth |
| `JIRA_API_TOKEN` | No | Atlassian API token paired with `JIRA_EMAIL` |
| `BITBUCKET_TOKEN` | No | Bitbucket Bearer token for Bitbucket Issues promotion/sync |
| `TRACKER_WEBHOOK_SECRET` | No | Shared secret verifying incoming `POST /api/webhooks/trackers/[provider]` signatures/tokens |

---

## Prisma Configuration (`prisma.config.ts`)

In `v0.2.0`, Prisma configuration moved from the deprecated `package.json#prisma` field into `prisma.config.ts`:

- Automatically loads `.env` via `process.loadEnvFile()` when present.
- Points Prisma CLI to `prisma/schema.prisma`, `prisma/migrations` (8 migrations), and the seed command `tsx prisma/seed.ts` (invoked by `npm run db:seed`).

---

## Local Development & Optional Demo Data

```bash
cp .env.example .env
npm install
docker compose up -d db
npx prisma migrate deploy
npm run db:seed
# Optional: populate rich v0.2.0 demo data (projects, urgent/blocked tickets, links, labels, saved views)
npx tsx scripts/seed-demo.ts
npm run dev
```

Open `http://localhost:3000` and sign in at `/login` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`. To run the local stdio MCP bridge for IDE AI agents:

```bash
BUG_TRACKER_URL="http://localhost:3000" BUG_TRACKER_API_KEY="btk_..." npx tsx scripts/mcp-server.ts
```

:::warning Demo vs. Production Data
`scripts/seed-demo.ts` is strictly for local testing and UI previews. Production deployments must run only `npx prisma migrate deploy` and `npm run db:seed`.
:::

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

## Chrome Extension (`v0.2.0`) Production Host Checklist

Before distributing or loading `extension/` against a deployed workspace:

1. Replace the placeholder `"https://your-bug-tracker-domain.com/*"` in `extension/manifest.json` `host_permissions` with your deployed Bug Tracking origin (`http://localhost:3000/*` is already included for local development).
2. Update `DEFAULT_API_ORIGIN` in both `extension/popup.js` and `extension/options.js` to match your production origin.
3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `extension/`.
4. Open the extension's **Options** page (`options.html`), verify the saved **API origin**, and choose your preferred **Full-page form target** (`public` `/submit/[slug]` vs. `admin` `/projects/by-slug/[slug]/feedback/new`).

---

## Backup & Verification Commands

| Command | Purpose |
| --- | --- |
| `npm run db:backup` | Runs `scripts/backup-data.ts` via `tsx` and exports `projects`, `feedbackItems`, `feedbackNotes`, `feedbackStatusEvents`, `feedbackLinks`, `externalIssueLinks`, `workspaceSettings`, and non-secret `projectApiKeys` metadata into `backups/backup-*.json` |
| `npm test` | Runs Vitest (`vitest run`) across **9 test files / 55 tests** |
| `npx tsc --noEmit` | Runs strict TypeScript type-checking (`0` errors) |
| `npm run lint` | Runs ESLint 9 (`eslint-config-next 16.4.6` + React hooks rules) |
| `npm run build` | Compiles production Next.js 16 standalone build (`0` warnings/errors) |

### Automated Test Suites (`tests/` — 9 Files / 55 Tests)

- `domain-and-slug.test.ts` (5 tests) — domain normalization and slug sanitization
- `admin-routes-auth.test.ts` (3 tests) — `401` protection across admin endpoints + slug collision handling
- `public-submit.test.ts` (6 tests) — `404`, honeypot, field validation, extension context block, rate limiting
- `public-endpoints.test.ts` (4 tests) — `/api/lookup`, `/api/projects/public-list`, `/api/health`
- `feedback-triage.test.ts` (9 tests) — query parser, `GET /api/feedback`, inline `PATCH /api/feedback/[id]`
- `ai-triage.test.ts` (7 tests) — heuristic classification, provider fallback, duplicate ranking, `POST /api/feedback/ai-triage`
- `capture-and-integrations.test.ts` (5 tests) — screenshot validation, webhooks (Slack/Discord/JSON), GitHub promotion
- `collaboration-and-ops.test.ts` (7 tests) — internal notes, status history events, `btk_` API keys, `POST /api/v1/feedback`, CSV/JSON export, persistent rate limiting
- `workspace-platform.test.ts` (9 tests) — strict 6-state workflow engine & `PATCH /api/feedback/[id]` enforcement, sequential ticket key derivation & Git platform auto-detection, canonical ticket links & self-link rejection, `WorkspaceSettings` (layout width, surfaces, Dark Mode & accent themes), heuristic AI investigation & coding-agent fix prompt, MCP discovery & JSON-RPC `initialize`/`tools/list`, workflow-safe bulk actions, two-way GitHub tracker webhook sync, and `APP_VERSION_LABEL`
