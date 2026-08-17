---
id: intro
title: FF RESTaurent Documentation
sidebar_label: Overview
sidebar_position: 0
description: Complete operational and development reference for FF RESTaurent.
---

# FF RESTaurent Wiki

FF RESTaurent is a group bill-splitting and restaurant tracker: it helps a group
manage shared bills from restaurants, split costs fairly between members, track
who has paid, and surface spending statistics. This documentation is the operational and
development reference for the platform — how to build on it, how to deploy it,
and how to run it in production.

**Start here:** [Backend Development](./development/backend-development.md) and
[Frontend Development](./development/frontend-development.md) for working on the code, or the
[Production Runbook](./runbooks-operations/production-runbook.md) for operating the live service.

> [!NOTE]
> **Current state.** The latest release is [v2.2.0](./releases/release-v2.2.0.md)
> (2026-08-02). The platform includes real-time SSE notification streaming,
> FCM push notifications, managed dining area images, custom accent themes,
> consolidated Settings, application information dialogs, and automated release
> verification.

---

## Development

| Document | What it covers |
| --- | --- |
| [Backend Development](./development/backend-development.md) | Working on the API in `apps/api` — Fastify 5, Prisma 6, PostgreSQL, request flow, validation, authorization, money rules, local setup, and checklist. |
| [Frontend Development](./development/frontend-development.md) | Working on the web app in `apps/web` — React 19, React Router 7 loaders/actions, Vite 7, Tailwind, API client, session handling, and checklist. |
| [OpenAPI Development](./development/openapi-development.md) | Updating and validating the runtime OpenAPI contract, generated web transport types, local Swagger interface, and CI drift gate. |
| [Folder Structure Review](./development/folder-structure-review.md) | A review of the monorepo layout with a proposed target structure and migration order. |

## Domain Contracts

| Document | What it covers |
| --- | --- |
| [Password and Session Contract](./domain-contracts/password-and-session-contract.md) | `PATCH /me/password` rules and how `User.sessionVersion` invalidates previously issued tokens with `401 SESSION_INVALIDATED`. |
| [Phone Number Contract](./domain-contracts/phone-number-contract.md) | Canonical E.164 storage for Vietnamese mobile numbers — input forms, normalization, persistence, and backfill. |

## Deployment & Infrastructure

| Document | What it covers |
| --- | --- |
| [Deployment Guide](./deployment-infrastructure/deployment-guide.md) | Preparation and deployment steps — deployment targets, pre-deployment checklist, CI/CD pipelines, and production readiness. |
| [FF-71 Supabase Storage Decision](./deployment-infrastructure/ff-71-supabase-storage-decision.md) | Decision to keep Supabase Storage as the active media provider and defer GCS migration. |
| [GCP Foundation](./deployment-infrastructure/gcp-foundation.md) | Recovery-ready GCP foundation: resource inventory, secure apply procedure, workload identity federation, and boundaries. |
| [GCP Migration Plan](./deployment-infrastructure/gcp-migration-plan.md) | End-to-end plan for moving from Render to GCP: architecture, provisioning, phases, rollback, and cost estimates. |
| [GCP Migration Timeline](./deployment-infrastructure/gcp-migration-timeline.md) | Record of how the Phase 2.5 migration was executed, provisioning script, load balancing, container build fixes, and future deploy steps. |
| [Database Migration Playbook](./deployment-infrastructure/database-migration-playbook.md) | Render PostgreSQL → Cloud SQL for PostgreSQL: strategy, provisioning, execution, verification, cutover, rollback, and ongoing operations. |

## Runbooks & Operations

| Document | What it covers |
| --- | --- |
| [Production Runbook](./runbooks-operations/production-runbook.md) | Release gates, required configuration, session/token policy, deployment, launch telemetry, backups, and rollback rehearsal. |
| [Push Notifications](./runbooks-operations/push-notifications.md) | Configuring Firebase Cloud Messaging, testing browser delivery, Cloud Run runtime preparation, and troubleshooting. |
| [Real-Time Notification Inbox](./runbooks-operations/real-time-notification-inbox.md) | Operating the authenticated SSE stream that refreshes the in-app notification list and unread badge in real time. |
| [Root Admin Operations](./runbooks-operations/root-admin-operations.md) | Singleton `ROOT_ADMIN` — bootstrap, in-app ownership transfer, and emergency operator recovery. |
| [Password Recovery Operations](./runbooks-operations/password-recovery-operations.md) | Root-Admin-assisted password recovery via out-of-band identity checks without SMS/email. |
| [Phase 2 Migration Runbook](./runbooks-operations/phase-2-migration-runbook.md) | Phase 2 contract verification gate — deployment gate, post-deployment verification, and failure response. |

## Performance

| Document | What it covers |
| --- | --- |
| [FF-27 Optimization Evidence](./performance/ff-27-optimization.md) | Database index coverage across four query shapes, and web bundle delivery before and after chunk splitting. |

## Releases

| Release | Date | Summary |
| --- | --- | --- |
| [v2.2.0](./releases/release-v2.2.0.md) | 2026-08-02 | Real-time SSE notification stream, FCM push delivery, dining area media, custom accent themes, consolidated Settings, and automated verification. |
| [v2.1.0](./releases/release-v2.1.0.md) | 2026-07-30 | Phase 2.5/2B hardening: staging CI/CD, OpenAPI transport generation, filter/date improvements, avatars, and agent tooling. |
| [v2.0.0](./releases/release-v2.0.0.md) | 2026-07-26 | Major infrastructure shift — migration from Render to GCP (Cloud Run, Cloud SQL) and Cloudflare. |
| [v1.1.0](./releases/release-v1.1.0.md) | 2026-07-21 | Phase 2 implementation, FF-38 contract migration, Supabase media storage, and production evidence. |
| [v1.1.0-RC](./releases/release-v1.1.0-rc.md) | — | Release candidate procedure that preceded v1.1.0. |
| [v1.0.0](./releases/release-v1.0.0.md) | 2026-07-14 | Phase 1 launch scope — hardened auth/RBAC, settlement integrity, and payment workflows. |

## Archive

| Document | What it covers |
| --- | --- |
| [Original App Spec](./archive/original-app-spec.md) | Pre-implementation product brief: roles, permissions, data model, bill-splitting logic, and proposed build order. |
