---
id: release-v2.2.2
title: Release v2.2.2
sidebar_label: v2.2.2
sidebar_position: 2
description: FF RESTaurent 2.2.2 release notes, with member cost formulas, mobile responsiveness, and Docker Compose standardization.
---

# FF RESTaurent 2.2.2

Release date: 2026-08-20

Release tag: `v2.2.2`

## Overview

Version 2.2.2 promotes `develop` to `main`, introducing member cost formulas for dynamic bill splitting, comprehensive mobile ergonomics and UI responsiveness enhancements across the application, and Docker Compose standardization.

## Highlights

- **Member Cost Formulas**: Added mathematical expression and formula evaluation support for member bill-splitting calculations, evaluating arithmetic expressions with live expression preservation and validation (`20260813100000_add_bill_participant_formula`).
- **Mobile Ergonomics & UI Responsiveness**:
  - Upgraded header navigation with a backdrop overlay and mobile drawer interactions.
  - Optimized bill creation and bill detail workflows for mobile screens.
  - Refined restaurant catalogs, collections, cuisine lists, and filter bars for compact viewports.
  - Enhanced dialogs, date pickers, modals, profile, and admin panels on touch devices.
- **Docker Compose Standardization**:
  - Prefixed image names (`ff-postgres`, `ff-api`, `ff-web`) with tag version `2.2.2`.
  - Added `restart: unless-stopped` auto-start policy for PostgreSQL.
  - Set default local host PostgreSQL port to `5433` and migrated volume to `ff-postgres-data`.

## Notable Pull Requests

- PR #113: Support member cost formulas.
- PR #114: Enhance mobile responsiveness across application.
- PR #115: Configure `ff-` image prefixes, version tags, and local port in docker compose.
- PR #116: Release v2.2.2: member cost formulas and mobile responsiveness.

## Migrations

- `20260813100000_add_bill_participant_formula`

## Verification Evidence

Local release candidate gates passed:
- `npm run prettier:check` formatted cleanly.
- `npm run lint` passed cleanly across workspaces.
- `npm run typecheck` (`tsc -b`) compiled cleanly.
- Unit and integration tests (`npm test`) passed (all 240 web tests across 52 test files, 32 shared tests, 92 API unit tests, and 19 staging smoke/contract tests).
- Production build (`npm run build`) succeeded across all workspaces.

Production deployment evidence:
- **Production Merge SHA**: `c5901d1` on `main`
- **GCP Deploy Workflow**: Passed (run `32374728305`).
- **CI Workflow**: Passed (run `32374728382`).
- **Staging Smoke Verification**: Passed (run `32375425434`).
- **Live Health & Readiness**: `/health` & `/ready` returning 200 OK.
