---
id: triage-and-inbox
title: Daily Triage, Global Inbox & Collaboration
sidebar_label: Triage & Global Inbox
sidebar_position: 1
description: Global /feedback inbox, search/filter/sort/pagination, inline triage, internal notes, status history, and exports.
---

# Daily Triage, Global Inbox & Collaboration

The admin interface prioritizes fast daily triage across all projects without leaving the inbox or introducing heavy UI libraries.

---

## Global Inbox & Project Feedback Views

- **Global Inbox (`/feedback`):** Aggregates feedback across all projects via `app/feedback/page.tsx` and `components/feedback-list-view.tsx`, displaying project link pills, type badges, source badges (`Manual`, `Public form`, `Extension`, `API`), reporter metadata, and dates.
- **Project Dashboard (`/projects`):** Lists every project with its live-site `domain`, slug, and open feedback item count (`_count.feedbackItems` where `status = 'open'`).
- **Project Feedback List (`/projects/[id]/feedback`):** Shares the same `FeedbackListView` query, inline triage, pagination, and export controls scoped to a single project.

---

## Search, Filtering, Sorting & Pagination (`lib/feedback-query.ts`)

Both SSR pages and API endpoints (`GET /api/feedback`, `GET /api/projects/[id]/feedback`, `GET /api/feedback/export`) share `parseFeedbackQueryParams()`:

| Parameter | Behavior | Validation |
| --- | --- | --- |
| `q` | Case-insensitive `OR` substring search across `title`, `description`, `reporterName`, and `reporterEmail` | Trimmed string |
| `projectId` | Scopes results to a single project (fixed by route param in `/projects/[id]/feedback`) | Optional string |
| `status` | Filters by `open`, `in_progress`, `resolved`, or `closed` | `400` on invalid enum |
| `type` | Filters by `bug`, `improvement`, `feature`, or `question` | `400` on invalid enum |
| `priority` | Filters by `low`, `medium`, `high`, or `none` (`priority IS NULL`) | `400` on invalid value |
| `source` | Filters by `manual`, `public_form`, `extension`, or `api` | `400` on invalid enum |
| `sort` | `newest` (`createdAt desc`), `oldest` (`createdAt asc`), `updated` (`updatedAt desc`), `priority_desc` (`nulls: "last"`), `priority_asc` (`nulls: "last"`) | `400` on invalid option |
| `page` / `pageSize` | Defaults to `page=1`, `pageSize=20`; `pageSize` is clamped to `100` | Positive integers only (`400` otherwise) |

---

## Inline Triage Controls (`components/inline-triage-controls.tsx`)

Each row in `FeedbackListView` renders compact `<select>` controls for `status` and `priority`:

1. Changing either dropdown optimistically updates local React state and sends `PATCH /api/feedback/[id]`.
2. On failure, local state rolls back and displays an inline `role="alert"` error message.
3. On success, `router.refresh()` keeps server-rendered counts and filtered lists synchronized.

---

## Internal Notes & Status History

Inside the detail view (`/feedback/[id]`):

- **Automatic Status Audit Trail:** Whenever `PUT` or `PATCH /api/feedback/[id]` updates `status` to a different value, the backend reads the prior status and creates a `FeedbackStatusEvent` (`fromStatus`, `toStatus`, `actorEmail`).
- **Private Admin Notes:** `components/feedback-notes-panel.tsx` fetches `GET /api/feedback/[id]/notes` (returning both `notes` and `statusEvents`) and posts new internal notes (`1..5000` chars) via `POST /api/feedback/[id]/notes`.
- **Client Bundle Safety:** Shared enum constants and Tailwind badge styles live in `lib/feedback-display.ts` using `import type` from `@prisma/client` so client components never pull runtime Prisma code into browser bundles.

---

## Filtered CSV & JSON Export

The filter bar in `FeedbackListView` provides **Export CSV** and **Export JSON** links pointing to `GET /api/feedback/export` with the active filters preserved:

- Fetches up to `5,000` matching items ordered by the active sort option.
- **CSV (`format=csv`):** Emits RFC-4180 escaped CSV (`text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="feedback-export.csv"`) covering `id`, `projectName`, `projectSlug`, `title`, `description`, `type`, `status`, `priority`, `source`, `reporterName`, `reporterEmail`, `pageUrl`, `browserInfo`, `githubIssueUrl`, `createdAt`, and `updatedAt`.
- **JSON (`format=json`):** Returns `{ exportedAt, items }` as a downloadable `feedback-export.json` attachment.
