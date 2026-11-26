---
id: endpoints
title: REST API Reference
sidebar_label: Endpoints
sidebar_position: 1
description: Public, API-key, and admin REST endpoints for Bug Tracking.
---

# REST API Reference (`v0.2.0`)

All routes live under `app/api/` and return JSON (except `GET /api/feedback/export` when `format=csv` and `POST /api/mcp` `notifications/initialized` returning `204`).

---

## Public & Operational Endpoints (No Admin Session Required)

| Method & Path | Purpose | Key Query / Body Fields | Responses |
| --- | --- | --- | --- |
| `GET /api/health` | Liveness & PostgreSQL connectivity check | Executes `SELECT 1` | `200` `{ status: "ok", database: "connected" }` or `503` |
| `GET /api/lookup?domain=...` | Domain lookup for Chrome extension | `domain` query param (normalized via `normalizeDomain()`) | `200` `{ found: true, slug, name }` or `{ found: false }` |
| `GET /api/projects/public-list` | Fallback project list for extension picker | None | `200` array of `{ slug, name }` sorted by `name asc` |
| `POST /api/submit/[slug]` | Public form & Chrome extension feedback intake | `title`, `type`, optional `description`, `reporterName`, `reporterEmail`, `pageUrl`, `browserInfo`, `screenshotDataUrl`, `website` (honeypot) | `201` `{ ok: true, feedback }` (allocates `ticketKey`, fires webhook), `200` on honeypot, `400`, `404`, `429` |

---

## Programmatic API Key, MCP & Tracker Webhook Endpoints

| Method & Path | Auth | Body / Protocol | Responses |
| --- | --- | --- | --- |
| `POST /api/v1/feedback` | `Authorization: Bearer btk_...` or `x-api-key: btk_...` | `title` (1–200 chars), `type`, optional `description` (up to 5,000 chars), `priority` (`low` \| `medium` \| `high` \| `urgent`), `reporterName`, `reporterEmail`, `pageUrl`, `browserInfo` | `201` `{ ok: true, feedback }` (`source: "api"`, allocates `ticketKey`), `400`, `401` |
| `GET /api/mcp` | Public | Discovery metadata for the built-in MCP server | `200` `{ name: "bug-tracking-mcp", version, protocol, auth, tools }` |
| `POST /api/mcp` | `Authorization: Bearer btk_...` / `x-api-key` (project-scoped) or Admin session cookie (workspace-wide) | Streamable HTTP JSON-RPC 2.0 (`initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call` across 8 tools: `list_projects`, `list_tickets`, `get_ticket`, `create_ticket`, `update_ticket`, `add_ticket_note`, `link_tickets`, `investigate_ticket`) | `200` JSON-RPC result, `204` (`notifications/initialized`), `400`, `401` |
| `POST /api/webhooks/trackers/[provider]` | HMAC / token via `TRACKER_WEBHOOK_SECRET` (`x-webhook-secret`, `x-hub-signature-256`, `x-gitlab-token`, or `linear-signature`) | Provider in `github` / `github_issues`, `gitlab` / `gitlab_issues`, `linear`, `jira`; updates matching `ExternalIssueLink.externalStatus` & `lastSyncedAt` and logs a `FeedbackNote` on status change | `200` `{ ok: true, provider, externalId, externalStatus, updatedLinks }` or `{ ok: true, ignored: true }`, `400`, `401` |

### Example Programmatic Intake Request

```bash
curl -X POST http://localhost:3000/api/v1/feedback \
  -H "Authorization: Bearer btk_your_project_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Webhook retry fails on 504",
    "type": "bug",
    "priority": "urgent",
    "description": "Observed during nightly sync job."
  }'
```

---

## Admin Endpoints (Protected by `proxy.ts` + `requireAdminSession()`)

Every admin endpoint below returns HTTP `401` `{ error: "Unauthorized" }` without a valid Auth.js JWT session.

### Dashboard, Settings, Labels & Saved Views

| Method & Path | Purpose | Notes |
| --- | --- | --- |
| `GET /api/dashboard` | Global or per-project analytics | Optional `?projectId=`; returns KPIs, status/priority/type breakdowns, 30-day inflow vs. resolution trend, recent tickets, and project metrics |
| `GET /api/settings` | Read `WorkspaceSettings` | Returns singleton `"default"` workspace preferences (`layoutWidth`, `defaultTicketView`, `newProjectMode`, `newFeedbackMode`, `ticketReviewMode`, `sidebarCollapsed`, `themeMode`, `themeAccent`, `completedTours`) |
| `PATCH /api/settings` | Update `WorkspaceSettings` | Partially updates any subset of workspace settings, upserts `"default"`, and sets zero-FOUC SSR cookies for `layoutWidth`, `themeMode`, and `themeAccent` |
| `GET /api/labels` | List labels | Optional `?projectId=` returns global (`projectId = null`) + project-scoped labels sorted by scope and name |
| `POST /api/labels` | Create label | Body `{ name, color?, projectId? }` (`name` capped at 40 chars, `color` defaults to `"slate"`); returns `201` `{ label }` |
| `DELETE /api/labels?id=...` | Delete label | Removes label and cascades `FeedbackLabel` entries; returns `200` `{ ok: true }` |
| `GET /api/views` | List saved filter views | Ordered by `createdAt asc`; returns `{ views }` |
| `POST /api/views` | Create saved view | Body `{ name, projectId?, filters }` (`name` capped at 60 chars, `filters` object required); returns `201` `{ view }` |
| `DELETE /api/views?id=...` | Delete saved view | Returns `200` `{ ok: true }` |

### Projects & API Keys

| Method & Path | Purpose | Notes |
| --- | --- | --- |
| `GET /api/projects` | List all projects | Ordered by `createdAt desc`; includes `_count.feedbackItems` (`status = 'open'`) |
| `POST /api/projects` | Create project | Validates `name`, optional `keyPrefix`, `domain`, `gitPlatform` (auto-detected from `repoUrl` if omitted), `repoUrl`, `gitDefaultBranch`, `trackerPlatform`, `trackerConfig`, `webhookUrl`, `description`; auto-generates unique `slug` and `keyPrefix`; `409` on duplicate `keyPrefix` or `domain` |
| `GET /api/projects/[id]` | Get single project | Returns `404` if missing |
| `PUT /api/projects/[id]` | Update project | Updates project fields including `keyPrefix`, `gitPlatform`, `gitDefaultBranch`, `trackerPlatform`, `trackerConfig`, `webhookUrl`; `409` on unique conflict |
| `DELETE /api/projects/[id]` | Delete project | Cascades to feedback items, API keys, and project labels |
| `GET /api/projects/[id]/api-keys` | List project API keys | Never returns `keyHash` |
| `POST /api/projects/[id]/api-keys` | Create API key | Body `{ name }`; returns `201` `{ apiKey, rawKey }` (`rawKey` shown once) |
| `DELETE /api/projects/[id]/api-keys?keyId=...` | Revoke API key | Soft-revokes by setting `revokedAt` |

### Feedback Triage, Bulk Actions, Links, Labels, Trackers, AI & Export

| Method & Path | Purpose | Notes |
| --- | --- | --- |
| `GET /api/feedback` | Global paginated inbox | Query params: `q` (matches `ticketKey`, `title`, `description`, `reporterName`, `reporterEmail`), `projectId`, `status`, `type`, `priority` (`low` \| `medium` \| `high` \| `urgent` \| `none`), `source`, `labelId`, `sort`, `page`, `pageSize` (max `100`) |
| `GET /api/projects/[id]/feedback` | Project-scoped ticket list | Supports `q`, `status`, `type`, `priority`, `source`, `labelId`, `sort`; returns array of items |
| `POST /api/projects/[id]/feedback` | Create ticket as admin | Allocates sequential `ticketKey`; supports `title`, `type`, `status`, `priority`, `source`, `description`, `reporterName`, `reporterEmail`, `pageUrl`, `browserInfo` |
| `GET /api/feedback/[id]` | Read full ticket | Includes `project` (with Git/tracker metadata), `externalLinks`, and `labels` |
| `PUT /api/feedback/[id]` | Full ticket update | Updates `title`, `description`, `type`, `status`, `priority`; enforces strict 6-state workflow (`400` on illegal jump) and writes `FeedbackStatusEvent` |
| `PATCH /api/feedback/[id]` | Partial / inline triage update | Updates any subset of `status`, `priority` (nullable), `type`, `title`, `description`; enforces strict 6-state workflow (`400` on illegal jump) and writes `FeedbackStatusEvent` |
| `DELETE /api/feedback/[id]` | Delete ticket | Cascades to notes, status events, links, external links, and label assignments |
| `POST /api/feedback/bulk` | Batch triage actions | Body `{ ids: string[] (max 100), action: "status" \| "priority" \| "add_label" \| "delete", value? }`; returns `400` on invalid payload/action/value and `200` `{ ok: true, updated, skipped }` |
| `GET /api/feedback/[id]/notes` | List internal notes & status history | Returns `{ notes, statusEvents }` |
| `POST /api/feedback/[id]/notes` | Add internal Markdown note | Body `{ body }` (1–5,000 chars); stamps `authorEmail` from admin session |
| `GET /api/feedback/[id]/links` | List linked tickets | Returns `{ links }` with resolved outgoing/inverse `direction`, `label`, `relationType`, and `related` ticket metadata |
| `POST /api/feedback/[id]/links` | Link two tickets | Body `{ targetId, direction }`; normalizes to canonical edge; `400` on self-link or invalid direction, `409` on duplicate link, `201` on create |
| `DELETE /api/feedback/[id]/links?linkId=...` | Remove ticket link | Validates link belongs to `[id]`; returns `200` `{ ok: true }` |
| `PUT /api/feedback/[id]/labels` | Replace ticket labels | Body `{ labelIds: string[] }`; replaces assignments transactionally and returns `{ labels }` |
| `POST /api/feedback/[id]/tracker` | Promote or manually link external issue | API promotion across `github_issues`, `gitlab_issues`, `linear`, `jira`, `bitbucket_issues` (or `{ mode: "manual", provider, externalKey, externalUrl }`); returns `201` `{ ok: true, link }` |
| `PATCH /api/feedback/[id]/tracker` | Pull external tracker status | Body `{ linkId }`; fetches latest remote state and updates `externalStatus` + `lastSyncedAt`; returns `200` `{ ok: true, link }` |
| `DELETE /api/feedback/[id]/tracker?linkId=...` | Unlink external issue | Removes `ExternalIssueLink`; returns `200` `{ ok: true }` |
| `POST /api/feedback/[id]/github` | Legacy GitHub Issue promotion | Uses `project.repoUrl` + `GITHUB_TOKEN`; `409` if already promoted; returns `201` `{ ok: true, githubIssueUrl, githubIssueNumber, feedbackItem }` |
| `POST /api/feedback/[id]/investigate` | Repo-aware multimodal AI investigation | Combines ticket data, notes, linked tickets, attached screenshot, and live GitHub repo context; returns `200` `{ investigation: { rootCauseHypotheses, investigationChecklist, suggestedSolution, agentPrompt, provider, fallbackUsed } }` |
| `POST /api/feedback/ai-triage` | Run AI cleanup & duplicate check | Body `{ title, description?, projectId?, feedbackId?, type?, priority? }`; returns `{ analysis, duplicates }` (`suggestedPriority` includes `urgent`) |
| `GET /api/feedback/export` | Export filtered feedback | Query param `format=csv` (default) or `format=json` plus all inbox filters (`take` up to `5,000`) |

---

## Strict Workflow Validation Responses

### Single-Ticket Transitions (`PUT` & `PATCH /api/feedback/[id]`)
When `canTransitionStatus(currentStatus, nextStatus)` from `lib/workflow.ts` returns `false`, the endpoint rejects the update with HTTP `400` and includes the exact allowed next statuses (from `WORKFLOW_TRANSITIONS` / `getAllowedNextStatuses()`):

```json
{
  "error": "Cannot transition status from \"open\" to \"resolved\". Allowed next statuses: todo, in_progress, blocked, closed."
}
```

### Batch Status Transitions (`POST /api/feedback/bulk`)
- Invalid request payloads (empty `ids`, unsupported `action`, invalid `status`/`priority` enum, or missing `labelId`) return HTTP `400` `{ error: "..." }`.
- For `action: "status"`, each ticket in `ids` is checked individually via `canTransitionStatus(item.status, nextStatus)`. Eligible tickets transition atomically alongside `FeedbackStatusEvent` creation, while tickets whose current status disallows the target status (or already match it) are left untouched and counted in `skipped`:

```json
{
  "ok": true,
  "updated": 1,
  "skipped": 1
}
```
