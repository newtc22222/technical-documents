---
id: release-v2.2.0
title: Release v2.2.0
sidebar_label: v2.2.0
sidebar_position: 1
description: FF RESTaurent 2.2.0 release notes — real-time SSE notification stream, FCM push, accent themes, and Cloud Run hardening.
---

# FF RESTaurent 2.2.0

Release date: 2026-08-02

Release tag: `v2.2.0`

## Overview

Version 2.2.0 promotes `develop` to `main`, introducing real-time SSE notification streaming, Firebase Cloud Messaging (FCM) push notifications, dining area media management, custom accent themes, consolidated Settings, application information dialogs, and automated release verification.

## Highlights

- **Real-Time Notification Inbox & FCM Push Delivery**: Added an authenticated Server-Sent Events (SSE) stream for instant in-app notification updates, robust stream lifetime and reconnect backoff, push subscription management (`20260727000000_add_push_subscriptions`), FCM payment reminders and product event notifications (`20260801090000_product_event_notifications`), and notification-click app tab reuse.
- **Dining Area Media & Catalog Improvements**: Added managed dining area images (`20260730100000_add_dining_area_images`), Drinks cuisine seed, and normalized platform-link branding.
- **Consolidated Settings & Accent Preferences**: Centralized language, theme, and accent selection (Saffron, Basil, Chili) under Settings, added the Application Information dialog, and added a login introduction footer.
- **Production Automation & Infrastructure**: Hardened Cloud Run deployment with idempotent Firebase project-ID environment passing (`FIREBASE_PROJECT_ID=ff-restaurent` using Cloud Run ADC), blocking release-job execution ordering (migrations -> popular-cuisine seed -> phone backfill -> root admin bootstrap), and automated pre- and post-promotion backup/restore verification drills.

## Notable Pull Requests

- PR #83: FCM payment reminder notifications.
- PR #84: Product event notifications schema and triggers.
- PR #85: Notification reliability and web scroll layouts.
- PR #86 & PR #87: Staging Firebase push delivery configuration and Cloud Run environment variable integration.
- PR #88: Reuse application tabs on push notification clicks.
- PR #89: Idempotent Firebase project-ID transition and release-job popular cuisine seed inclusion.
- PR #90: Real-time SSE notification stream with reconnect backoff.
- PR #91: Saffron, Basil, and Chili accent theme preference selection.
- PR #93: Consolidated Settings experience, Application Info dialog, and login footer.

## Migrations

- `20260727000000_add_push_subscriptions`
- `20260730100000_add_dining_area_images`
- `20260801090000_product_event_notifications`

## Verification Evidence

Local release candidate gates passed:
- `npm run agents:verify` passed cleanly.
- `npm run prettier:check` formatted cleanly.
- `npm run lint` passed cleanly across workspaces.
- `npm run typecheck` (`tsc -b`) compiled cleanly.
- `npm run openapi:check` verified transport contracts.
- `bash scripts/verify-phase2-contract-migration.sh` passed.
- Production baseline and GCP migration rehearsals (`rehearse-gcp-migration.test.sh` and `rehearse-gcp-migration.integration.test.sh`) passed on disposable local PostgreSQL database.
- `npm run prisma:phase2:contract:verify` and `npm run prisma:indexes:verify` passed.
- `bash scripts/run-release-job.test.sh` passed.
- `bash scripts/verify-cloud-run-containers.sh` passed.
- Unit and integration tests (`npm test`) passed.
- Frontend build (`npm run build`) succeeded.
- Playwright end-to-end tests (`npm run test:e2e`) passed.

Production deployment evidence:
- **Production Merge SHA**: `3037c2c8a3481914e9e2a6ee1e8484f3d2e10902` on `main`
- **GCP Deploy Workflow**: Passed in 3m43s (run `30755107802`), executing one-shot release job (`migrations` -> `popular-cuisine seed` -> `phone normalization` -> `ROOT_ADMIN bootstrap`).
- **Post-Deployment Phase 2 Contract Verification**: Passed (run `30756080811`).
- **Post-Deployment Backup Restore Drill**: Passed (run `30755342719`).
- **Live Health & Readiness**: `/health` & `/ready` returning 200 OK (`{"ok":true,"database":"ready"}`).
- **Deployed Cloud Run Services**:
  - API: `ff-restaurent-api-00015-xx2` ([https://ff-restaurent-api-sglcycpgla-de.a.run.app](https://ff-restaurent-api-sglcycpgla-de.a.run.app))
  - Web: `ff-restaurent-web-00005-l76` ([https://ff-restaurent-web-sglcycpgla-de.a.run.app](https://ff-restaurent-web-sglcycpgla-de.a.run.app))

## Rollback Boundary & Prior Revisions

In the event of an unhealthy production deployment, traffic can be instantly rolled back to prior stable revisions:

- Prior API revision: `ff-restaurent-api-00014-pvt`
- Prior Web revision: `ff-restaurent-web-00004-8mf`

Rollback command:
```bash
gcloud run services update-traffic ff-restaurent-api --project ff-restaurent --region asia-east1 --to-revisions ff-restaurent-api-00014-pvt=100
gcloud run services update-traffic ff-restaurent-web --project ff-restaurent --region asia-east1 --to-revisions ff-restaurent-web-00004-8mf=100
```
