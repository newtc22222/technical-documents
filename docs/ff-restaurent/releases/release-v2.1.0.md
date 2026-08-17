---
id: release-v2.1.0
title: Release v2.1.0
sidebar_label: v2.1.0
sidebar_position: 2
description: FF RESTaurent 2.1.0 release notes — OpenAPI transport, staging CI/CD, feature architecture, and avatar identity.
---

# FF RESTaurent 2.1.0

Release date: 2026-07-30

Release tag: `v2.1.0`

## Overview

Version 2.1.0 promotes the current `develop` branch to `main` after the
post-2.0.0 Phase 2.5 and Phase 2B work. It combines architecture hardening,
generated API contracts, web data-access cleanup, staging CI/CD foundations,
user and bill workflow improvements, avatar identity polish, and agent-tooling
standardization.

## Highlights

- **Staging and GCP automation**: Added the zero-cost staging CI/CD foundation,
  Cloud Run deployment boundaries, release-job ordering checks, Workload
  Identity fixes, and GCP provisioning hardening.
- **API architecture and contracts**: Split the API source root into explicit
  layers, moved validation into domain schemas, added service modules for
  bills, collections, feedback, media, password reset, restaurant catalogs, and
  user accounts, and generated the OpenAPI transport contract used by the web
  client.
- **Web feature architecture**: Decomposed the route tree into feature slices,
  standardized route loaders/actions and TanStack Query usage, introduced typed
  route mutation helpers, and preserved shared domain contracts through
  `@ff-restaurent/shared`.
- **Bills, filters, and identity UX**: Added bill occurrence dates, restored
  Bills list state through detail/edit flows, standardized debounced route
  filters, fixed canonical Cuisine filtering, blocked/restored user accounts,
  and surfaced member avatars plus the localized current-user marker from
  FF-66.
- **Localization and UI systems**: Split translations into typed locale/domain
  JSON files, added shared UI context and lint guidance, improved DatePicker,
  modal, filter bar, dropdown, avatar, and responsive member surfaces.
- **Agent and formatting workflow**: Migrated the project agent system into the
  tracked `.agents` directory, added verification through
  `npm run agents:verify`, updated Claude guidance, and introduced Prettier
  import sorting as part of the repository workflow.

## Notable Pull Requests

- PR #48: FF-69 staging CI/CD and zero-cost staging environment.
- PR #49: FF-48 shared domain contracts.
- PR #52 and PR #58: FF-53 translation namespaces and extraction.
- PR #54 through PR #57: FF-49, FF-50, and FF-51 API/web architecture
  decomposition.
- PR #59: FF-31 generated OpenAPI transport.
- PR #61 through PR #67: Web data access, filters, bill dates, account
  blocking, participant groups, and navigation fixes.
- PR #70: FF-68 participant-group action alignment.
- PR #72: FF-66 user avatars and current-user identity.
- PR #73: Prettier import sorting and release-integration CI fixes.

## Verification

The v2.1.0 release preparation passed the local release gate before the
develop-to-main pull request:

- `npm run prettier:check`
- `npm run agents:verify`
- `npm run lint` with 65 existing warnings and 0 errors
- `npm run typecheck`
- `npm test`
- `npm run build`

The release pull request must also pass GitHub Actions `verify`, including the
Playwright end-to-end suite, before merging to `main`.

## Operational Notes

- Package metadata for the root workspace, API, web, and shared package is
  aligned at `2.1.0`.
- `@ff-restaurent/shared` internal workspace references are aligned to `2.1.0`.
- The latest runtime remains the GCP and Cloudflare deployment established in
  v2.0.0.
- Database and deployment scripts retain the Phase 2.5 migration and recovery
  gates; production migration or recovery work should still follow the
  dedicated runbooks.
