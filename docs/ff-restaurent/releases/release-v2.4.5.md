---
id: release-v2.4.5
title: Release v2.4.5 (Staging)
sidebar_label: v2.4.5 (Staging)
sidebar_position: 1
description: FF RESTaurent 2.4.5 release notes (Staging, production pending), with the 2.4.0 performance follow-up, cuisine pricing, the Catalog, Recipes, restaurant brands, and cuisine type labels.
---

# FF RESTaurent 2.4.5

Release date: TBD (pending production promote)

Release tag: `v2.4.5` (not yet tagged; production release: `develop` promoted to `main`)

> **Status:** Staging (`develop`) verified at tip `f8c0150` (merge of [#172](https://github.com/newtc22222/ff-restaurent/pull/172)) on 2026-10-11.
> **Production (`main`):** not yet. Production still runs [v2.4.0](./release-v2.4.0.md). See [Production](#production).

## Overview

Version 2.4.5 is numbered well above 2.4.0 because of how much has changed since it; it is larger than a usual patch release. It ships the performance and safety follow-up to [v2.4.0](./release-v2.4.0.md), four new areas of the product (cuisine pricing, a province-grouped Catalog, Recipes, and restaurant brands), cuisine type labels in English and Vietnamese with a Vietnamese-first cuisine form, and a pass over destructive buttons and navigation. It includes **five additive migrations**, so read **Migrations** and **Deployment notes** before promoting.

## Highlights

- **Performance and safety follow-up (#165)**
  - The app shell no longer loads every bill, restaurant and member on each visit. It makes four calls (`GET /me`, `/notifications`, `/participant-groups`, `/me/notification-preferences`); bill detail uses `GET /bills/:id`; filter menus have their own endpoints; mutations invalidate only the affected queries; a 429 is no longer turned into an empty list.
  - JSON, JS, CSS, SVG and HTML are compressed (nginx for static files, `@fastify/compress` for the API; the event stream stays uncompressed).
  - The notification stream pauses while the tab is hidden and reconnects with jitter; the current user is requested once; restaurant collections and cuisines stay cached across filter changes.
  - Payment-QR signing is batched per distinct path with a 1.5 s limit, and a failure becomes `imageUrl: null` instead of failing `GET /bills`.
  - Notification rows are written before the response and push is sent after; FCM sends are chunked at 500.
  - Passwords use native `bcrypt` (existing `$2a`/`$2b` hashes still verify; new hashes use cost 12). The login limiter is now per client IP **and** identifier, default 20 per minute (was 5 per IP).
  - Public image uploads are converted to WebP with neither edge above 1600 px (quality 80). QR images are not recompressed.
  - Prisma pool defaults (`connection_limit=3`, `pool_timeout=10`) when the URL omits them; Cloud Run deploys with `--no-cpu-throttling`, `--cpu-boost`, `--memory 512Mi` and a `/ready` startup probe.
  - A bill creator can create 10 bills and add 30 notification recipients per minute (`BILL_CREATE_RATE_LIMIT_MAX`, `BILL_CREATED_FANOUT_MAX`); over the cap the create is a 429 and is not saved.
  - The API image drops web-only dependencies and the release job deletes notifications older than 90 days. `npm run load:test` adds a load-test suite (it refuses production hosts). The write-ups that went with these changes (production measurements, public image object sizes, the bill-notification risk) are no longer in this repository; they live on the `docs/roadmap-and-wiki` branch and in this wiki: [Production Measurements](../runbooks-operations/production-measurements.md), [Public Image Object Sizes](../runbooks-operations/public-image-object-sizes.md) and [Bill-Created Notification Risk](../runbooks-operations/bill-created-notification-risk.md).
- **Cuisine price range and team average spend (#166)**
  - Chefs can set an optional typical price per person (`priceMin` / `priceMax`, either bound optional). The cuisine page shows it beside the team average (`observedSpend`): the average pre-VAT share at restaurants whose main cuisine it is, over the last 12 months, counting active and archived bills, and `null` below 3 bills. The two figures are never merged.
- **Province-grouped Catalog (#167)**
  - Dining areas appear as a travel-style **Catalog**: `/catalog` shows one card per province, `/catalog/:provinceCode` lists a province's areas (`unassigned` for older areas without a province, `all` for every area), and `/catalog/areas/:id` is an area's page. Old `/dining-areas` URLs redirect and keep their query string. New `GET /dining-areas/provinces`.
- **Recipes (#168)**
  - A recipe says how to make one dish or drink of a cuisine: ordered ingredients and steps, photos, and calories and nutrition per serving entered by hand. Everyone reads active recipes; a Sous Chef manages their own; a Head Chef manages, archives and restores any. Pages: `/recipes`, `/recipes/:id`, `/recipes/new`, `/recipes/:id/edit`; the cuisine page lists the newest recipes. A cuisine that has recipes cannot be deleted.
- **Restaurant brands and branches (#169)**
  - A `RestaurantBrand` groups the branches of one chain. Each branch stays a full restaurant (own address, dining area, links, bills, feedback and collections). The restaurant form has a Brand section that can pick or start a brand; the restaurant page links to the brand and lists other branches; `/brands/:id` shows every branch. Deleting a brand only ungroups its branches.
- **Cuisine type labels and a Vietnamese-first cuisine form (#170)**
  - `Cuisine.type` gains optional `typeEn` and `typeVi`. `type` stays the canonical (Vietnamese) label every reader falls back to. New `GET /cuisines/types` lists the distinct types in use.
  - The cuisine form treats Vietnamese as the default language: Vietnamese name, description and type are required and fill the canonical fields; English is optional. Type (Vietnamese) and Type (English) are selects that can also create a new value. The localized type is shown on cuisine cards and tables, the cuisine page, and the restaurant and collection cuisine pickers.
- **Buttons and navigation (#170)**
  - Delete, archive and remove buttons that were grey (`btn-soft` overrode the red) are now red at rest with a visible hover; delete, archive, block and sign-out confirmations use a red confirm button; every button shows a focus ring.
  - Breadcrumbs replace the back button on Catalog province lists, dining-area pages (`Catalog › province › area`) and cuisine pages (`Cuisines › name`).
- **Shared UI:** new `IconButton`, `Breadcrumbs` and `CreatableDropdown`, plus `.btn-danger` / `.btn-danger-soft`, registered in `.context/COMPONENTS.md` and the UI guidelines.

## Notable changes

- PR [#165](https://github.com/newtc22222/ff-restaurent/pull/165): performance and safety follow-up (issues #125, #152 to #164).
- PR [#166](https://github.com/newtc22222/ff-restaurent/pull/166): cuisine price range and team average spend.
- PR [#167](https://github.com/newtc22222/ff-restaurent/pull/167): province-grouped Catalog.
- PR [#168](https://github.com/newtc22222/ff-restaurent/pull/168): recipes with ingredients, steps and nutrition.
- PR [#169](https://github.com/newtc22222/ff-restaurent/pull/169): restaurant brands and branches.
- PR [#170](https://github.com/newtc22222/ff-restaurent/pull/170): destructive button styles, breadcrumbs, cuisine type labels and the creatable type select.
- PR [#172](https://github.com/newtc22222/ff-restaurent/pull/172): version bump to 2.4.5. `ROADMAP.md` and the three files under `wiki/` were moved off `develop` to the `docs/roadmap-and-wiki` branch (they are not part of this release; see [Roadmap](../planning/roadmap.md) and the pages linked above).

## Migrations

Five, all additive; the release job applies them with `prisma migrate deploy`:

- `20261006090000_add_cuisine_price_range`: `Cuisine.priceMin` / `priceMax` with CHECK constraints (non-negative, `priceMin <= priceMax`).
- `20261006120000_add_bill_list_sort_indexes`: two indexes on `Bill` for the date and total sorts.
- `20261007090000_add_recipes`: `Recipe`, `RecipeIngredient`, `RecipeStep`, `RecipeImage`, with CHECK constraints and a search trigger.
- `20261008090000_add_restaurant_brands`: `RestaurantBrand`, `RestaurantEntry.brandId` and `branchLabel`, with a search trigger.
- `20261011090000_add_cuisine_type_locales`: `Cuisine.typeEn` / `typeVi` (nullable) and a dedicated cuisine search trigger that also indexes them.

## Deployment notes

- **Release job order:** `prisma migrate deploy`, then the popular-cuisine seed (this release also **backfills the new type labels** on existing seeded cuisines, only where a label is empty and the cuisine's type is unchanged, so an admin's edits are never overwritten), the honor-badge seed, and the notification-retention step.
- **Notification retention (behavior change):** the release job now deletes notification rows older than `NOTIFICATION_RETENTION_DAYS` (default 90, `0` disables), including unread ones.
- **Login limit (behavior change):** `AUTH_RATE_LIMIT_MAX` now counts per client IP and identifier and defaults to 20 (was 5 per IP).
- **New optional settings** (defaults apply when unset): `connection_limit` / `pool_timeout` on `DATABASE_URL`, `NOTIFICATION_RETENTION_DAYS`, `BILL_CREATE_RATE_LIMIT_MAX`, `BILL_CREATED_FANOUT_MAX`. See `.env.example`.
- **Image build:** `bcrypt` 6 and `sharp` 0.34 ship prebuilt musl binaries for the alpine API image; the image prune script and boot check run during the build. PR #165 did not build the Docker image locally, so the first build of this image is the CI / deploy build for this release; watch it.
- **Cloud Run:** `gcp-deploy.yml` now sets `--no-cpu-throttling`, `--cpu-boost`, `--memory 512Mi` and the `/ready` startup probe. `--min 1` is **not** enabled: the cold-start P95 has not been measured.
- **Needs an operator, not run by the deploy:** applying the alert-policy changes in `scripts/harden-production-gcp.sh` (requires `ALERT_NOTIFICATION_CHANNEL`); the production measurements (issue #155; the commands are in the issue and in [Production Measurements](../runbooks-operations/production-measurements.md)); and the public image object-size counts ([Public Image Object Sizes](../runbooks-operations/public-image-object-sizes.md)). The `connection_limit` default assumes the database allows about 20 connections; check `max_connections` before adding Cloud Run instances.
- **Cuisine form (behavior change):** saving a cuisine now writes the Vietnamese name to the canonical `name` (and so to its unique key). A cuisine created under the old English-first form with an English `name` and a Vietnamese translation moves to the Vietnamese name the next time it is saved; cuisines with no Vietnamese name keep theirs.

## Verification

- PR #170: CI `verify` (typecheck, lint, unit tests, API integration tests against PostgreSQL, Playwright e2e) passed on the merged head; locally web 529, API 225 unit and 23 integration tests, scripts 35 and Playwright e2e 11 of 11 against a fresh PostgreSQL 16 with all migrations applied (no drift from `schema.prisma`).
- The cuisine seed backfill was run against hand-built rows: it filled old rows, kept an admin-set label, left a cuisine with a changed type alone, and a second run changed nothing.
- The cuisine form, type select and card labels were checked in the running app as a Sous Chef. The release PR's CI repeats the full check on the version bump.

### Staging evidence (2026-10-11)

| Item | Value |
| --- | --- |
| `develop` tip commit | `f8c0150` (merge of #172) |
| Deploy run | [38129007872](https://github.com/newtc22222/ff-restaurent/actions/runs/38129007872) (passed, finished 16:45 ICT) |
| Smoke run | [38129509792](https://github.com/newtc22222/ff-restaurent/actions/runs/38129509792) (passed, 16:45 ICT) |
| Cloud Run revisions | API: `ff-restaurent-api-staging-00111-wch`; web: `ff-restaurent-web-staging-00108-ffh` (100% of traffic) |
| Health | API `/health` and `/ready` return 200 with the database ready; web root returns 200 |
| Production | Untouched |

## Production

Not yet. The earlier release PR [#171](https://github.com/newtc22222/ff-restaurent/pull/171) ("Release 2.4.1") was closed without merging on 2026-10-11 16:24 ICT, and the version was bumped to 2.4.5 by #172. No `develop` -> `main` pull request for 2.4.5 existed when this page was written. `develop` -> `main` promotion runs CI and the GCP production deploy on merge; production merge SHA, deploy and smoke evidence will be added after the promote.
