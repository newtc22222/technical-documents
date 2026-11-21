---
id: intro
title: Bug Tracking Documentation
sidebar_label: Overview
sidebar_position: 0
description: Technical reference for the self-hosted Bug Tracking web application, Chrome MV3 extension, and API integrations.
---

# Bug Tracking — Self-Hosted Issue & Feedback Tracker

Welcome to the **Bug Tracking** technical documentation. This doc set covers the architecture, PostgreSQL/Prisma data model, daily triage workflows, Chrome Manifest V3 extension, AI cleanup & duplicate detection, webhook/GitHub integrations, REST API endpoints, and Docker deployment runbook.

:::note Current state (Milestones 0–4 complete)
The repository (`newtc22222/bug-tracking`, `main` at commit `1d6724b`) runs **Next.js 16.3.1** (App Router, TypeScript, Tailwind CSS v4), **PostgreSQL 16**, **Prisma 6.19.3**, **Auth.js v5** (single-admin Credentials + JWT), and a plain **Chrome Manifest V3** extension under `extension/`.
:::

---

## Executive Summary

Bug Tracking is designed for a private, single-admin workflow that collects feedback from external users and internal tools while keeping administrative triage fast and self-hosted:

1. **Multi-Channel Capture:** Collect feedback from public project forms (`/submit/[slug]`), a zero-build Chrome MV3 extension with domain auto-detection and screenshot capture, or project-scoped API keys (`POST /api/v1/feedback`).
2. **Daily Triage Inbox:** Search, filter, sort, and paginate across all projects at `/feedback` or inside a single project at `/projects/[id]/feedback`, with inline status/priority updates (`PATCH /api/feedback/[id]`), internal admin notes, automatic status transition history, and CSV/JSON export.
3. **AI Assistance & Integrations:** Clean up raw feedback text, classify type/priority, and check for duplicate items via OpenAI, Gemini, or a deterministic heuristic fallback; notify Slack/Discord/generic webhooks; and promote items to GitHub Issues in one click.

---

## Delivered Milestones

| Milestone | Scope | Key Deliverables |
| --- | --- | --- |
| **Milestone 0** | MVP Stabilization | Standalone `Dockerfile`, `docker-compose.yml` (`db` + `app`), `GET /api/health`, `requireAdminApiSession()` guards, Vitest suite, `README.md`. |
| **Milestone 1** | Daily Triage & UX | Global `/feedback` inbox, `lib/feedback-query.ts` search/filter/sort/pagination, inline `PATCH` triage controls, source badges, project open-item counts. |
| **Milestone 2** | Phase 6 AI Assistance | `lib/ai-triage.ts`, `POST /api/feedback/ai-triage`, `AiTriagePanel` for text cleanup, type/priority suggestions, and duplicate detection. |
| **Milestone 3** | Capture & Integrations | `pageUrl`, `browserInfo`, `screenshotDataUrl`, `githubIssueUrl` columns, extension screenshot capture, Slack/Discord/JSON webhooks, GitHub issue promotion. |
| **Milestone 4** | Collaboration & Ops | `FeedbackNote` & `FeedbackStatusEvent`, `ProjectApiKey` + `POST /api/v1/feedback`, persistent `RateLimitBucket`, CSV/JSON export, `npm run db:backup`. |

---

## Documentation Sections

| Section | What it covers |
| --- | --- |
| [System Overview](./architecture/system-overview.md) | Next.js 16 architecture, request flow, Auth.js + API key security boundaries, and rate-limiting layers. |
| [Data Model](./architecture/data-model.md) | PostgreSQL ERD, Prisma models (`Project`, `FeedbackItem`, `FeedbackNote`, `FeedbackStatusEvent`, `ProjectApiKey`, `RateLimitBucket`, `AdminUser`), enums, and migrations. |
| [Triage & Global Inbox](./features/triage-and-inbox.md) | Global `/feedback` inbox, query parser, inline triage, internal notes, status history, and CSV/JSON exports. |
| [Chrome MV3 Extension](./features/chrome-extension.md) | Manifest V3 extension architecture, domain lookup + fallback picker, and visible-tab screenshot capture. |
| [AI & Integrations](./features/ai-and-integrations.md) | AI cleanup/duplicate detection (`openai`, `gemini`, `heuristic`), Slack/Discord/generic webhooks, GitHub issue promotion, and `btk_` API keys. |
| [API Reference](./api-reference/endpoints.md) | Public, API-key, and admin REST endpoints with request/response contracts. |
| [Deployment & Runbook](./operations/deployment-and-runbook.md) | Environment variables, local development, Docker Compose deployment, health checks, backups, and Vitest verification. |
