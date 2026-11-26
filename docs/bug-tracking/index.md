---
id: intro
title: Bug Tracking Documentation
sidebar_label: Overview
sidebar_position: 0
description: Technical reference for the self-hosted Bug Tracking web application, Chrome MV3 extension, and API integrations.
---

# Bug Tracking — Self-Hosted Issue & Feedback Workbench

Welcome to the **Bug Tracking** technical documentation. This doc set covers the **v0.2.0 (Workbench Platform)** architecture, PostgreSQL/Prisma data model, strict 6-state workflow and daily triage workbench, Chrome Manifest V3 extension, repo-aware multimodal AI triage & investigation, multi-platform Git/tracker integrations, built-in MCP server, REST API endpoints, and Docker deployment runbook.

:::note Current state (`v0.2.0` — Workbench Platform · Not in production)
The repository (`newtc22222/bug-tracking`, `v0.2.0` defined in `lib/version.ts` and `package.json`) is **not yet deployed to production** (currently in local/self-hosted development). It runs **Next.js 16.4.6** (App Router, `proxy.ts` auth boundary, `output: "standalone"`), **React 19.3.1**, **TypeScript 5**, **Tailwind CSS v4**, **PostgreSQL 16**, **Prisma 6.19.3** (configured via `prisma.config.ts`), **Auth.js v5** (single-admin Credentials + JWT), and a zero-build **Chrome Manifest V3 extension (`v0.2.0`)** under `extension/`.
:::

---

## Executive Summary

Bug Tracking is a self-hosted, Linear/Jira-inspired multi-project bug tracking and triage workbench built to keep rapid issue capture effortless across private repositories, public links, programmatic APIs, AI coding assistants (MCP), and browsers:

1. **Multi-Channel Capture:** Collect feedback from public project forms (`/submit/[slug]`), a zero-build Chrome MV3 extension (`v0.2.0`) with domain auto-lookup, viewport/DPR/failed-HTTP diagnostics, screenshot capture, and full-page editor handoff, project-scoped API keys (`POST /api/v1/feedback`), or the built-in MCP server (`/api/mcp`).
2. **Workbench Triage & Collaboration:** Work inside a collapsible Linear-style `AdminShell` with configurable layout width (`Full 100%` / `Wide 1280px` / `Narrow 1024px`), Dark/Light/System + 5 Accent Themes, flexible Page/Modal/Drawer surfaces (`?ticket=` URL sync, `Cmd/Ctrl+K`, `C`, `J`/`K`), strict 6-state workflow enforcement with an orthogonal SVG graph, sequential ticket keys (`PROJ-1`), `Urgent` priority, 4 ticket views (Full List, Fixed List, Card Grid, Kanban), Bulk Actions, Linked Tickets, Labels, Saved Views, Tiptap v3 WYSIWYG Markdown editing, Global & Project Dashboards, `driver.js` tours, and type-to-confirm Danger Zone modals.
3. **Repo-Aware AI, Multi-Tracker Sync & MCP:** Clean up, auto-triage, and detect duplicates (`POST /api/feedback/ai-triage`), run multimodal screenshot + live GitHub repo-aware root-cause investigations with copyable coding-agent prompts (`POST /api/feedback/[id]/investigate`), sync across GitHub/GitLab/Linear/Jira/Bitbucket with incoming two-way webhooks (`/api/webhooks/trackers/[provider]`), and connect IDEs/agents via the 8-tool MCP server (`/api/mcp` + `scripts/mcp-server.ts`).

---

## Delivered Milestones

| Milestone | Scope | Key Deliverables |
| --- | --- | --- |
| **Milestone 0 (`v0.1.0`)** | MVP Stabilization | Standalone `Dockerfile`, `docker-compose.yml` (`db` + `app`), `GET /api/health`, `requireAdminSession()` / `requireAdminApiSession()` guards, Vitest suite, `README.md`. |
| **Milestone 1 (`v0.1.0`)** | Daily Triage & UX | Global `/feedback` inbox, `lib/feedback-query.ts` search/filter/sort/pagination, inline `PATCH` triage controls, source badges, project open-item counts. |
| **Milestone 2 (`v0.1.0`)** | Phase 6 AI Assistance | `lib/ai-triage.ts`, `POST /api/feedback/ai-triage`, `AiTriagePanel` for text cleanup, type/priority suggestions, and duplicate detection (`openai` / `gemini` / `heuristic`). |
| **Milestone 3 (`v0.1.0`)** | Capture & Integrations | `pageUrl`, `browserInfo`, `screenshotDataUrl`, `githubIssueUrl` columns, extension screenshot capture, Slack/Discord/JSON webhooks, GitHub issue promotion. |
| **Milestone 4 (`v0.1.0`)** | Collaboration & Ops | `FeedbackNote` & `FeedbackStatusEvent`, `ProjectApiKey` + `POST /api/v1/feedback`, persistent `RateLimitBucket`, CSV/JSON export, `npm run db:backup`. |
| **Milestone 5 (`v0.2.0`)** | **Workbench Platform** | Collapsible Linear-style `AdminShell`, `WorkspaceProvider` Surface Engine (Page/Modal/Drawer + `?ticket=` sync + `Cmd+K`/`C`/`J`/`K`), Dark/Light/System + 5 Accent Themes, configurable layout width, strict 6-state workflow + linear SVG graph, `Urgent` priority, `Type -> Priority -> Status` triage order, sequential ticket keys (`PROJ-1`), Linked Tickets, Labels, Saved Views, Bulk Actions, 4 views (Full/Fixed/Grid/Kanban), Tiptap v3 WYSIWYG Markdown, Global & Project Dashboards (`recharts`), Multi-platform Git & Trackers + two-way webhooks, Repo-aware Multimodal AI Investigate, Built-in MCP Server (8 tools + stdio bridge), `driver.js` guided tours, `/settings`, `/guide`, Type-to-Confirm Danger Zone modal, Chrome Extension `v0.2.0`, Next.js 16 `proxy.ts`, Prisma `prisma.config.ts`. |

---

## Documentation Sections

| Section | What it covers |
| --- | --- |
| [System Overview](./architecture/system-overview.md) | Next.js 16 `proxy.ts` auth boundary, `AdminShell` & `WorkspaceProvider` Surface Engine, themes, layout widths, Tiptap Markdown pipeline, and system topology. |
| [Data Model](./architecture/data-model.md) | PostgreSQL 16 ERD, all 12 Prisma enums, all 13 models (`FeedbackLink`, `ExternalIssueLink`, `Label`, `SavedView`, `WorkspaceSettings`, etc.), and 8 migrations. |
| [Triage & Global Inbox](./features/triage-and-inbox.md) | Strict 6-state workflow, `Type -> Priority -> Status` triage order, ticket keys, 4 views (Full/Fixed/Grid/Kanban), URL-synced Review Drawer, Bulk Actions, Links, Labels, Saved Views, Dashboards, Tiptap editor, tours, `/settings`, `/guide`, and Danger Zone safety. |
| [Chrome MV3 Extension](./features/chrome-extension.md) | Extension `v0.2.0` permissions (`activeTab`, `scripting`, `storage`), automatic viewport/DPR/failed-HTTP diagnostics, screenshot capture, and public/admin full-page form handoff. |
| [AI & Integrations](./features/ai-and-integrations.md) | AI Triage (`urgent` support), Repo-Aware Multimodal AI Investigate, multi-platform Git & External Trackers with two-way webhooks, outgoing notifications, API keys, and the 8-tool Built-In MCP Server. |
| [API Reference](./api-reference/endpoints.md) | Complete v0.2.0 REST, MCP, webhook, and public endpoint contracts including strict workflow `400` responses and bulk action semantics. |
| [Deployment & Runbook](./operations/deployment-and-runbook.md) | Full `.env` reference, `prisma.config.ts`, `seed-demo.ts`, Docker Compose standalone deployment, `db:backup`, Vitest suite (9 files / 55 tests), and extension production checklist. |
