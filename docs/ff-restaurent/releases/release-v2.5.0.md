---
id: release-v2.5.0
title: Release v2.5.0
sidebar_label: v2.5.0
sidebar_position: 1
description: FF RESTaurent 2.5.0 release notes, with the design pass, meal-vote veto and dietary tags, the catalog food map, offset pagination, VPS and Vercel hosting, and Zod 4.
---

# FF RESTaurent 2.5.0

Release date: 2026-11-20 (`main`, tag `v2.5.0`)

Release tag: `v2.5.0` (`4ae7835`, merge of [#201](https://github.com/newtc22222/ff-restaurent/pull/201))

> **Status:** Tag `v2.5.0` is on `main`; the version bump is `package.json` 2.4.5 to 2.5.0 with `@ff-restaurent/shared` pinned to 2.5.0 in `apps/api` and `apps/web`. No staging or production smoke run for this release is recorded in this wiki yet.
> **Hosting:** the API runs on a VPS and the web app on Vercel. See [VPS and Vercel Hosting](../runbooks-operations/vps-and-vercel-hosting.md). Cloud Run notes in [v2.4.5](./release-v2.4.5.md) are historical.

## Overview

Version 2.5.0 rolls up everything merged to `develop` after [v2.4.5](./release-v2.4.5.md), PRs [#176](https://github.com/newtc22222/ff-restaurent/pull/176) to [#201](https://github.com/newtc22222/ff-restaurent/pull/201): a design pass over the web app (Bills, meal votes, catalog, pagination), meal-vote veto and dietary tags, the catalog food map, GCP removal in favour of a VPS and Vercel, and a major dependency refresh (Zod 4, Prisma 7, Vite 8). It includes **one additive migration**. The meal tracking and AI milestones that the [Roadmap](../planning/roadmap.md) had pencilled in for 2.5.0 did not ship in this release.

## Highlights

- **Design pass (#197 to #200)**
  - **Bills** page, create-bill form and bill detail redesigned. The create form is split into numbered steps and merges discounts and vouchers into one **Promotions** step (the API, database and bill detail still carry vouchers separately). The bill activity history opens in a dialog, toolbar labels are shorter (**Archive** / **Restore**), and statistics now include archived bills.
  - Meal votes, restaurants, cuisines, recipes, collections and groups take the new design. The create-meal-vote dialog has two columns with a restaurant checklist. Destructive buttons use a muted, then a clearer, red.
  - A `DateTimePicker` replaces `react-datepicker` (dependency removed); the calendar stays inside the viewport.
  - The user's honor badge shows in the header. A plan for showing badges to other members is in the repository under `docs/plans`.
- **Pagination (#198):** list endpoints accept `offset` (0 to 100000) beside the cursor, so the web pagination control can jump to any page; it is ignored for backward pages. The control shows a range and keeps working on an empty later page. The OpenAPI contract and generated web types were regenerated.
- **Seeds (#198):** the separate seed scripts are one CLI, `apps/api/prisma/seed/seed.ts`. `prisma:seed` stays idempotent and additive; `prisma:seed:all` adds extra cuisines, demo users, bills, recipes (20) and a demo catalog (`--users`, `--restaurants`, `--bills` size it); `prisma:seed:bulk` and `prisma:seed:reset` also exist; `prisma:cuisines:seed` and `prisma:badges:seed` now call it with `--only`.
- **Domains and proxy (#195, #196):** the web app calls the `phivo.dev` API from `phivo.dev` hosts, and uses the same-origin `/api` proxy on `vercel.app` hosts (staging through `/api-staging`). The API CORS allow list must include the `phivo.dev` origins.
- **Dependencies:** Zod 4 with `fastify-type-provider-zod` 7, `lucide-react` 1.72, plus in-range updates; the Vite config uses `import.meta.dirname`.
- **Design sync:** Claude Design sync config, previews and notes for the UI components; `graphify-out` is git-ignored.
- **Meal votes**
  - Race-lane option bars, a photo-finish banner for tied leaders (with an inline tie-break wheel that shows only the tied options; its result is unofficial and the recorded tally is untouched), a winner confetti burst, a closes-in countdown chip, and an order sheet (pick, headcount, price-per-head estimate from the cuisine price range, copy summary, ordering links, prefilled create-bill link). `/bills/new` accepts `?restaurantId=`.
  - **Veto** (`PUT`/`DELETE /meal-votes/:id/veto`): one per member per vote. It withdraws the caller's own ballot on that option, blocks new ballots on it, drops it from the winner at close, and cannot remove the last remaining option. The veto check runs after the vote row lock, so a concurrent veto cannot be bypassed.
  - **Dietary tags** (`PUT /meal-votes/:id/preferences`): `NO_SPICY`, `VEGETARIAN`, `LIGHT`, `BUDGET`, served as counts among members who are eating; names only for the vote's creator or a Head Chef. They feed the order sheet's special requests.
  - Restaurant list rows now include the cuisine `priceMin` / `priceMax`, which the order estimate reads.
- **Catalog food map** at `/catalog/map`: cuisines, restaurants, dining areas and collections as one graph. Backed by the single endpoint `GET /catalog/map` (busiest active restaurants first, `?limit` default 300, max 500; reports `totalRestaurants` and `truncated`; collections follow the usual visibility rules and system collections always survive the cut).
- **Bills**
  - Create-bill form: three numbered steps with a sticky live receipt (count-up total, per-person share bars, an "adds up" check, a still-needed list); VAT chips (0, 8, 10%) and shipping chips; an optional payment-QR switch that is off by default.
  - Bill card: animated payment ring, Split panel (loads the full bill on first open), **I have paid** (member with an unpaid share on an active bill; confirmed and audited) and **Nudge N unpaid** (bill managers; sends the existing reminders once). The payment intent accepts an explicit `billId`.
  - Restaurant search with recents and a member search picker replace the old dropdowns.
- **Performance and load** (2026-10-30/31): slimmer bill lists, page pickers and brands, faster cuisine spend, `/stats/me` reads only the fields it uses, only the active locale loads on first visit (and a stale locale load is ignored), login limits are keyed by identifier in production with an IP ceiling, CORS preflights are cached for two hours, the notification stream sends CORS headers, and payment-QR images over the byte limit are scaled to 1600 px. The k6 load scripts were fixed (login-burst 429s count as expected). Results of the 2026-10-31 VPS check are in the repository's `docs/vps-performance-checks.md`.
- **Rate limiting behind Vercel:** limits count the real client when requests pass through the Vercel proxy, using signed `x-ff-client-ip` headers (see [VPS and Vercel Hosting](../runbooks-operations/vps-and-vercel-hosting.md)).
- **Dependencies:** Vite 8, `@vitejs/plugin-react` 6, Prisma 7 (driver adapter; the API loads the root `.env`), refreshed Fastify plugins, `dotenv`, `lint-staged` and `openapi-fetch`.

## Migration

One, additive; the release step applies it with `prisma migrate deploy`:

- `20261104090000_add_meal_vote_veto_and_dietary_tags`: `MealVoteVeto` and `MealVotePreference`.

## Hosting and CI changes

- GCP Cloud Run, Cloud SQL and the load balancer were removed (cutover 2026-10-17; code and workflow removal 2026-10-20). Removed: `gcp-deploy.yml`, the Render workflow files, the `cloud-run` and `render` Docker stages, the GCP provisioning, cutover and rehearsal scripts, and the Cloud SQL backup-restore drill.
- New `vps-deploy.yml` builds the `vps` image to GHCR and deploys over SSH with per-environment forced-command keys; deploy actions are pinned to commit SHAs. Staging smoke runs only for `develop` and `main` deployments, and CI pins `ubuntu-24.04`.
- `apps/web` is deployed by Vercel (`apps/web/vercel.json`, `/api` proxied through Vercel).

## Deployment notes

- Apply the migration with `prisma migrate deploy`; it only adds tables and an enum, so rolling the API back leaves it unused.
- Add the `phivo.dev` origins to the API CORS allow list before the web app is served from those hosts.
- Seed scripts now live behind `seed.ts`; anything that ran `seed-popular-cuisines.ts` or `seed-honor-badge-levels.ts` directly should use the `prisma:cuisines:seed` and `prisma:badges:seed` scripts.

## Verification

Not recorded here. Add the staging and production smoke run IDs when they are available.
