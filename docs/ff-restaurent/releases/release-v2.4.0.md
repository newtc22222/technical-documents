---
id: release-v2.4.0
title: Release v2.4.0
sidebar_label: v2.4.0
sidebar_position: 2
description: FF RESTaurent 2.4.0 release notes, with the card redesign across list pages, reworked filters and restaurant form, and the Stats, Profile and Honor Badge redesign.
---

# FF RESTaurent 2.4.0

Release date: 2026-09-29

Release tag: `v2.4.0` (production release: `develop` promoted to `main`)

## Overview

Version 2.4.0 follows [v2.3.0](./release-v2.3.0.md). It redesigns every list page as a set of cards that lead with the one fact people scan for before opening an item. It also reworks filters and the restaurant form and detail pages, redesigns the Stats and Profile pages (including the Honor Badge), adds restaurant counts to the cuisine and dining-area directories, and ships the post-2.3.0 rate-limit and wording fixes.

## Highlights

- **Card redesign across all list pages**
  - **Bills:** your own position is the headline ("You owe" / "You paid" / bill total when you are not in the bill), with a paid/unpaid status chip, payment progress, participant avatars ringed by payment state, and the host. Remind / Archive / Restore moved into a chef-only ⋯ menu; the whole card opens the bill.
  - **Restaurants:** banner with overlapping logo, favorite and recommended markers, location, food/service ratings with review count, primary-first cuisine chips, and delivery platforms. Shared by the Restaurants, Collection detail, Cuisine detail and Dining Area detail pages.
  - **Cuisines** and **Dining Areas:** cover image with fallback, type chip or location, short description, and how many active restaurants are listed.
  - **Collections:** cuisine-theme cover or a Favorites / Recommended / custom band, visibility pill, place count, cuisine chip, and owner.
  - **Meal Votes:** the winner (closed) or the leading option with its ballot share (open), your pick or "You haven't voted", vote and option counts, deadline, and creator.
  - **Participant Groups:** card grid with member count, avatar stack and names; Edit / Remove in the ⋯ menu.
- **Detail pages**
  - **Collection detail:** a hero with the cuisine-theme cover or Collection-type band, visibility, place count, cuisine, owner (for viewers) and share count (for owners); a Places heading with count; sharing list with avatars.
  - **Meal Vote detail:** the hero leads with the winner (closed) or the leading option and its share (open), then your pick or a prompt to vote, and a stats strip (votes, options, deadline, creator). Survey options become ranked ballot cards with share %, vote count and "Your pick" / winner markers. The Wheels tab is unchanged.
- **Filters, forms and detail pages (#148)**
  - Every filter has a visible label; `FilterBar` gains a collapsible **Advanced filters** section (Bills: date range; Restaurants: sort, platform, archive status).
  - Multi-select redesign: pinned "Selected" group, checkboxes, "N selected" footer with Done, and "first +N" trigger text.
  - Layouts are remembered per page, and page size is offered on every paginated list.
  - Restaurant create is a guided step-by-step form; restaurant detail is regrouped into blocks with direct cover/logo upload and an Edit modal that can change name and type.
  - Cuisine names and descriptions follow the app language everywhere; Collection sharing is visible to everyone who can view the collection.
- **Stats (#149)**
  - Figures (an itemized statement: paid, waiting, total, bills joined, average and largest share, most visited) are split from Charts.
  - New filters: payment status, plus restaurant, cuisine and dining area under Advanced filters.
  - Short ranges chart day by day; restaurant spend is a pie with a labelled legend (top five plus "Other places").
- **Profile and Honor Badge (#149)**
  - Profile is grouped into **Your account** (details, notifications, password) and **App features** (Honor Badge, payment QR), with avatar upload on the header avatar and a single In app / Push notification table.
  - Honor Badge is a stamp card: stamped / ready / locked levels, progress to the next level, the points rules stated plainly, and a named Claim action.
- **Fixes (#149):** Advanced filters now actually collapse; switching an address between structured and manual no longer loses it.
- **API:** `GET /cuisines` and `GET /dining-areas` list items include `restaurantCount` (active restaurants only). `GET /stats/me` accepts `restaurantId`, `cuisineId`, `diningAreaId` and `paymentStatus`, and returns `billCount`, `averageShare`, `largestShare` and `periodUnit`. `GET /collections/:id/shares` checks visibility instead of ownership. All changes are additive; no migrations.
- **Shared UI:** new `ActionMenu` (accessible ⋯ overflow menu), `CountLabel` (pluralized "**N** things"), `RestaurantForm`, `HonorSeal` / `HonorBadgePill`, and categorical chart colour tokens, registered in `.context/COMPONENTS.md` and `.context/design-tokens.json`.
- **Fixes since 2.3.0 (#146):** clear, pluralized countdown messages when login or registration is rate limited, mapped on every page; Meal Votes search box hidden until the API supports search; "Xem nhà hàng" wording.

## Notable changes

- `d3e88d4`: card redesign round 1 (Bills, Restaurants, Cuisines; `restaurantCount` on `/cuisines`).
- PR [#146](https://github.com/newtc22222/ff-restaurent/pull/146): post-2.3.0 web follow-ups (rate-limit messaging, wording).
- PR [#147](https://github.com/newtc22222/ff-restaurent/pull/147): card redesign round 2 (Dining Areas, Collections, Meal Votes, Participant Groups; `restaurantCount` on `/dining-areas`), round 3 (Collection and Meal Vote detail pages), and the 2.4.0 version bump.
- PR [#148](https://github.com/newtc22222/ff-restaurent/pull/148): round 4 UX (filters, multi-select, layouts, cuisine i18n, restaurant form and detail, Collection sharing visibility).
- PR [#149](https://github.com/newtc22222/ff-restaurent/pull/149): filter and address fixes, Stats redesign with new filters, restaurant spend pie, Profile and Honor Badge redesign, Stats filter-option caching.

## Migrations

None.

## Verification

- PR #149: CI `verify` (typecheck, lint, unit tests, API integration tests against PostgreSQL, Playwright e2e) passed; web 409 and API 157 unit tests pass locally.
- Local performance check on seeded data: common GET endpoints answer in 6–31 ms median (73 ms worst); catalog reads revalidate with `ETag` / 304; charts stay lazy-loaded; the web bundle is 468 KB gzipped.

## Production

Release notes finalized in [#150](https://github.com/newtc22222/ff-restaurent/pull/150) (merged to `develop` 2026-09-29 00:26 ICT). Promoted by [#151](https://github.com/newtc22222/ff-restaurent/pull/151) ("Release 2.4.0", `develop` -> `main`), merged 2026-09-29 02:07 ICT.

Production deployment evidence:
- **Production merge SHA**: `741a47a` on `main` (tag `v2.4.0`).
- **GCP Deploy Workflow**: Passed (run [36470083174](https://github.com/newtc22222/ff-restaurent/actions/runs/36470083174), finished 02:15 ICT).
- **CI Workflow**: Passed (run [36470083095](https://github.com/newtc22222/ff-restaurent/actions/runs/36470083095)).
- **Smoke Verification**: `Staging smoke` workflow on the `main` deployment passed (run [36470949072](https://github.com/newtc22222/ff-restaurent/actions/runs/36470949072), 02:16 ICT).
- **GitHub release**: "FF RESTaurent 2.4.0" published 2026-09-29 02:16 ICT (marked Latest).

As of 2026-10-11, `main` is still at `741a47a`, so 2.4.0 is the current production release.
