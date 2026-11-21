---
id: endpoints
title: REST API Reference
sidebar_label: Endpoints
sidebar_position: 1
description: Public, API-key, and admin REST endpoints for Bug Tracking.
---

# REST API Reference

All routes live under `app/api/` and return JSON (except `GET /api/feedback/export` when `format=csv`).

---

## Public & Operational Endpoints (No Admin Session Required)

| Method & Path | Purpose | Key Query / Body Fields | Responses |
| --- | --- | --- | --- |
| `GET /api/health` | Liveness & PostgreSQL connectivity check | Executes `SELECT 1` | `200` `{ status: "ok", database: "connected" }` or `503` |
| `GET /api/lookup?domain=...` | Domain lookup for Chrome extension | `domain` query param (normalized via `normalizeDomain`) | `200` `{ found: true, slug, name }` or `{ found: false }` |
| `GET /api/projects/public-list` | Fallback project list for extension picker | None | `200` array of `{ slug, name }` sorted by `name` |
| `POST /api/submit/[slug]` | Public form & Chrome extension feedback intake | `title`, `type`, optional `description`, `reporterName`, `reporterEmail`, `pageUrl`, `browserInfo`, `screenshotDataUrl`, `website` (honeypot) | `201` `{ ok: true, feedback }`, `200` on honeypot, `400`, `404`, `429` |

---

## Programmatic API Key Endpoint

| Method & Path | Auth | Body Fields | Responses |
| --- | --- | --- | --- |
| `POST /api/v1/feedback` | `Authorization: Bearer btk_...` or `x-api-key: btk_...` | `title` (1–200 chars), `type`, optional `description` (up to 5,000 chars), `priority`, `reporterName`, `reporterEmail`, `pageUrl`, `browserInfo` | `201` `{ ok: true, feedback }` (`source: "api"`), `400`, `401` |

### Example Request

```bash
curl -X POST http://localhost:3000/api/v1/feedback \
  -H "Authorization: Bearer btk_your_project_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Webhook retry fails on 504",
    "type": "bug",
    "priority": "high",
    "description": "Observed during nightly sync job."
  }'
```

---

## Admin Endpoints (Protected by Middleware + `requireAdminApiSession()`)

Every admin endpoint below returns `401` `{ error: "Unauthorized" }` without a valid Auth.js JWT session.

### Projects & API Keys

| Method & Path | Purpose | Notes |
| --- | --- | --- |
| `GET /api/projects` | List all projects | Ordered by `createdAt desc`; includes `_count.feedbackItems` (`status = 'open'`) |
| `POST /api/projects` | Create project | Validates `name`, optional `domain` (unique, max 253 chars), `repoUrl`, `webhookUrl` (`http(s)://`), `description`; auto-generates unique `slug` |
| `GET /api/projects/[id]` | Get single project | Returns `404` if missing |
| `PUT /api/projects/[id]` | Update project | Updates `name`, `domain`, `repoUrl`, `webhookUrl`, `description` |
| `DELETE /api/projects/[id]` | Delete project | Cascades to feedback items and API keys |
| `GET /api/projects/[id]/api-keys` | List project API keys | Never returns `keyHash` |
| `POST /api/projects/[id]/api-keys` | Create API key | Body `{ name }`; returns `201` `{ apiKey, rawKey }` (`rawKey` shown once) |
| `DELETE /api/projects/[id]/api-keys?keyId=...` | Revoke API key | Sets `revokedAt` on matching project key |

### Feedback Triage, AI, Export & Integrations

| Method & Path | Purpose | Notes |
| --- | --- | --- |
| `GET /api/feedback` | Global paginated inbox | Query params: `q`, `projectId`, `status`, `type`, `priority`, `source`, `sort`, `page`, `pageSize` (max `100`) |
| `GET /api/projects/[id]/feedback` | Project-scoped feedback list | Supports `q`, `status`, `type`, `priority`, `source`, `sort`; returns array of items |
| `POST /api/projects/[id]/feedback` | Create feedback as admin | Supports `title`, `type`, `status`, `priority`, `source`, `description`, `reporterName`, `reporterEmail` |
| `GET /api/feedback/[id]` | Read single feedback item | Includes `project: { id, name, slug }` |
| `PUT /api/feedback/[id]` | Full feedback update | Updates `title`, `description`, `type`, `status`, `priority`; records `FeedbackStatusEvent` on status change |
| `PATCH /api/feedback/[id]` | Partial / inline triage update | Updates any subset of `status`, `priority` (nullable), `type`, `title`, `description`; records `FeedbackStatusEvent` on status change |
| `DELETE /api/feedback/[id]` | Delete feedback item | Cascades to notes and status events |
| `GET /api/feedback/[id]/notes` | List internal notes & status history | Returns `{ notes, statusEvents }` |
| `POST /api/feedback/[id]/notes` | Add internal admin note | Body `{ body }` (1..5000 chars); stamps `authorEmail` from admin session |
| `POST /api/feedback/ai-triage` | Run AI cleanup & duplicate check | Body `{ title, description?, projectId?, feedbackId?, type?, priority? }`; returns `{ analysis, duplicates }` |
| `POST /api/feedback/[id]/github` | Promote feedback to GitHub Issue | Uses `project.repoUrl` + `GITHUB_TOKEN`; returns `201` `{ ok: true, githubIssueUrl, githubIssueNumber, feedbackItem }` |
| `GET /api/feedback/export` | Export filtered feedback | Query param `format=csv` (default) or `format=json` plus all inbox filters (`take` up to `5000`) |
