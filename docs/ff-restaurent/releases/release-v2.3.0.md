---
id: release-v2.3.0
title: Release v2.3.0
sidebar_label: v2.3.0
sidebar_position: 3
description: FF RESTaurent 2.3.0 release notes, with everything from 2.3.0-rc.1 plus pagination totals, per-client rate limiting, and trusted proxies by address.
---

# FF RESTaurent 2.3.0

Release date: 2026-09-28

Release tag: `v2.3.0`

> **Status:** Released. Staging (`develop`) was verified at tip `616c450` (merge of #145).
> **Production (`main`):** promoted by [#144](https://github.com/newtc22222/ff-restaurent/pull/144), merged as `ead6061` on 2026-09-28 17:11 ICT. See [Production](#production).

Release candidate history: [v2.3.0-rc.1 (Staging)](./release-v2.3.0-rc.1.md), 2026-09-19. That page keeps the full per-PR detail for items 1-8 below.

## Overview

Version 2.3.0 promotes `develop` to `main`. It carries everything from 2.3.0-rc.1 (bill-created notifications and auto-archive, dining-area detail edit, cuisine EN/VI and images, Collection cookbooks, meal-vote survey and lucky wheel with per-option chances, Honor Badge) plus the changes merged after the RC: a stricter `BILL_CREATED` audience rule, a wheel review follow-up, pagination controls with page totals on six lists, web caching and fetch fixes, per-client API rate limiting, and address-based trusted-proxy resolution (#145) so both the `run.app` and custom-domain paths see the real client IP.

## Feature map

| # | Feature | Staging | Production | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Bill created notify + auto-archive when all paid | Yes | Yes | [#120](https://github.com/newtc22222/ff-restaurent/pull/120), [#135](https://github.com/newtc22222/ff-restaurent/pull/135) |
| 2 | Dining area edit on detail | Yes | Yes | [#119](https://github.com/newtc22222/ff-restaurent/pull/119) |
| 3 | Cuisine images + EN/VI | Yes | Yes | #123 |
| 4 | Cookbook = Collection + `cuisineId` | Yes | Yes | [#129](https://github.com/newtc22222/ff-restaurent/pull/129) (API), [#133](https://github.com/newtc22222/ff-restaurent/pull/133) (web) |
| 5 | Meal voting survey (+ wheels) | Yes | Yes | [#130](https://github.com/newtc22222/ff-restaurent/pull/130) (API), [#127](https://github.com/newtc22222/ff-restaurent/pull/127) (web) |
| 6 | Honor Badge API + profile UI | Yes | Yes | [#130](https://github.com/newtc22222/ff-restaurent/pull/130) (API), [#136](https://github.com/newtc22222/ff-restaurent/pull/136) (UI) |
| 7 | Cuisines + Meal Votes UI redesign (SVG lucky wheel) | Yes | Yes | [#138](https://github.com/newtc22222/ff-restaurent/pull/138) |
| 8 | Lucky wheel chances (per-option weights) | Yes | Yes | [#140](https://github.com/newtc22222/ff-restaurent/pull/140) (API), [#139](https://github.com/newtc22222/ff-restaurent/pull/139) (UI) |
| 9 | Meal-vote wheel review follow-up | Yes | Yes | [#141](https://github.com/newtc22222/ff-restaurent/pull/141) (`47ad15b`) |
| 10 | Pagination UI, caching / fetch and cross-module fixes | Yes | Yes | [#143](https://github.com/newtc22222/ff-restaurent/pull/143) (`8b41e52`) |
| 11 | Per-client rate limiting + pagination totals (API) | Yes | Yes | [#142](https://github.com/newtc22222/ff-restaurent/pull/142) (`4e4b085`, Security approved) |
| 12 | Trusted-proxy-by-address + rate-limit headers / `RATE_LIMITED` | Yes | Yes | [#145](https://github.com/newtc22222/ff-restaurent/pull/145) (`616c450`, Security approved; Staging verified) |

---

## Carried over from 2.3.0-rc.1

Condensed. See [v2.3.0-rc.1](./release-v2.3.0-rc.1.md) for routes, error codes and seed data.

### 1. Bill created notify + auto-archive when all paid
- New notification category **`BILL_CREATED`**, sent to the other bill participants when a bill is created (the creator is excluded). EN/VI copy.
- An **ACTIVE** bill is archived automatically when a payment or participant update leaves no unpaid participants (at least one participant required). Responses may include `autoArchived`.
- **Since rc.1 ([#135](https://github.com/newtc22222/ff-restaurent/pull/135), fixes #124):** if a `BILL_CREATED` notification is sent without `audienceUserIds`, it no longer falls back to all ACTIVE users. It reaches nobody (`created: 0`, `pushed: 0`) and logs a warning. An empty list was already a no-op. Bill creation still passes the filtered participant ids.

### 2. Dining area edit on detail
- Chefs edit a dining area inline on its detail page (name, structured address, description). Customers stay read-only.

### 3. Cuisine images + EN/VI
- Optional `nameEn`, `nameVi`, `descriptionEn`, `descriptionVi` beside `name` / `description`.
- Cuisine image gallery with a default image; new `GET /cuisines/:id` and image routes.

### 4. Cookbook = Collection + `cuisineId`
- No separate Cookbook model: a cookbook is a `Collection` with an optional `cuisineId` theme.
- Create/update accept `cuisineId` (`null` clears it); `GET /collections?cuisineId=` filters. The web shows the theme and lets you pick, clear and filter by cuisine.

### 5. Meal voting survey (+ wheels)
- `/meal-votes` API: create, add options, cast or change a ballot (`PUT /meal-votes/:id/ballot`), close. 2-20 options, optional `closesAt`.
- Winner: highest count, ties go to the lower `sortOrder`. Notifications `MEAL_VOTE_CREATED` and `MEAL_VOTE_RESULT` (`MEAL_VOTE_CLOSING` is not emitted).
- Web: list and detail pages with **Survey** / **Wheels** tabs. The wheel is a client-side spin over all options or the current leaders.

### 6. Honor Badge (API + profile UI)
- Points = 10 x paid participations + 5 x hosted bills (ACTIVE bills only). Five seeded levels, Newcomer to Legend, with VI names.
- `GET /honor-badges/levels`, `GET /me/honor-badge`, `POST /me/honor-badge/claim`.
- The **Honor badge** section on `/profile` shows points, current and next badge, the level ladder and claim history, with a **Claim badge** button. Own profile only.

### 7. Cuisines + Meal Votes UI redesign
- Cuisines: image-forward cards with a cards / table toggle; detail hero and gallery management.
- Meal Votes: card list with OPEN / CLOSED chips; detail tabs; custom SVG lucky wheel.
- Known gap: the past-deadline ballot lock is client-side only (see [Known issues](#known-issues-and-follow-ups-after-230)).

### 8. Lucky wheel chances
- `MealVoteOption.wheelWeight` (1-100, default 1) and `PUT /meal-votes/:id/wheel-weights` for the vote owner (creator or head chef) on OPEN votes.
- Web: **Edit chances** with live percentage preview, reset to equal, cancel.
- Weights affect only the wheel, never tallies or the official winner.

---

## New since 2.3.0-rc.1

### 9. Meal-vote wheel review follow-up

**PR:** [#141](https://github.com/newtc22222/ff-restaurent/pull/141) -> `develop` (merged `47ad15b`, 2026-09-28 01:25 ICT). Web only; follow-up to #138/#139 from the UI/UX Designer and Technical Writer reviews.

- **Tabs:** keyboard focus moves to the newly selected tab; Home and End are supported.
- **Mobile:** the spin result sits directly under the wheel. The desktop layout is unchanged.
- **Spin** is disabled while the chances editor is open.
- The "custom chances" line only shows after unequal weights are saved.
- **Slice colors** come from design tokens (saffron, basil, chili and two dark neutrals). The pointer is chili. Neighbouring slices, including the last and the first, never share a color family (2-20 options).
- Each row in the chances editor has a color swatch that matches its slice.
- When "current leaders" contains only one option, Spin is disabled and a hint explains why (`wheelSingleLeader`).
- Copy: updated `wheelOddsCustom` and new `wheelSingleLeader` in EN and VI.

### 10. Frontend 2.3.0 pass: pagination, caching and cross-module fixes

**PR:** [#143](https://github.com/newtc22222/ff-restaurent/pull/143) -> `develop` (merged `8b41e52`, 2026-09-28 01:39 ICT). Web only.

**Pagination**
- A shared `Pagination` component is used on six lists: **Bills, Restaurants, Cuisines, Dining areas, Meal votes and Collections**.
- Shows "Page X of Y" when the API returns a total, otherwise "Page X". Bills and Restaurants also have a page-size picker (10 / 25 / 50 / 100).
- Previous, reload and browser back/forward work on all six lists. Changing a filter goes back to the first page.
- Cuisine and Dining area detail pages now page through all their restaurants instead of stopping at 25.

**Caching and fetching**
- The app no longer reloads all bills and restaurants on every filter or page click. Its data only reloads after a change is saved, when you open a different page, or when a refresh is requested.
- Still open (from #143): the app still downloads all bills and restaurants when it starts, and the Restaurants page still refetches all collections and cuisines on each page change.
- Leaving a page cancels its in-flight requests. A 401 on a list page sends you to login instead of the error page.
- nginx caches the hashed `/assets` files for a year (`immutable`). A missing asset returns 404 instead of the app page. `index.html`, `sw.js`, the manifest and app routes are served with `Cache-Control: no-cache`, so users get the new build after a deploy.

**Cross-module fixes**
- The meal-vote option picker loads all active restaurants (it used to load only the first 100).
- Meal-vote options link to their restaurant, and archived restaurants are tagged Archived.
- On restaurant detail, cuisine tags and the dining-area card link to their pages.
- A sous chef opening `/bills/:id/edit` for someone else's bill is redirected to the bill detail page.

**Copy / accessibility**
- Wheel labels meet a contrast ratio of at least 4.5:1: saffron slices use dark labels (7.2:1), and the chili slice is slightly darker with white labels (5.3:1). A unit test checks every palette entry.
- VI strings: four meal-vote strings from the Technical Writer, plus new pagination strings and "Xem quán".

### 11. API: per-client rate limiting + pagination totals

**PR:** [#142](https://github.com/newtc22222/ff-restaurent/pull/142) -> `develop` (merged `4e4b085`, 2026-09-28 01:41 ICT). Approved by Security. No migration, no new routes.

**Why:** On Staging the API saw every request as coming from one Cloud Run proxy address, so all users shared a single 100 requests/minute limit. #142 raised the global limit and keyed signed-in traffic per user. Client-IP resolution for both the `run.app` and custom-domain paths was completed by #145 (address-based trust, section 12).

**Rate limiting** (only active when `NODE_ENV=production`, as before)
- Signed-in requests are limited **per user**, but only when the JWT verifies. Anything else, including forged or expired tokens, is limited **per client IP**.
- **Global limit:** `RATE_LIMIT_MAX`, default **300 requests per minute** per user or IP (was 100/minute, shared by everyone through the proxy address).
- **Login and registration:** `AUTH_RATE_LIMIT_MAX`, default **5 per minute**, always per client IP. This covers login and registration only.
- **Password reset** (`/auth/password-reset-requests`, `/auth/password-reset`): **5 per 15 minutes**, keyed by client IP plus the requested identifier. This limit is fixed in code (not controlled by `AUTH_RATE_LIMIT_MAX`) and was not changed by #142. With #145 it sees the real client IP on both paths.

**Pagination totals**
- Optional `includeTotal=true` on the cuisine, dining area, restaurant, collection, meal vote and bill lists adds `pageInfo.totalCount` (one extra count query). Omitted by default, so existing clients are unaffected.
- Meal-vote and collection lists now support backward cursors (`direction=backward`) and return `startCursor` / `hasPreviousPage`, matching the other lists.
- Note: `GET /cuisines/:id` and `GET /dining-areas/:id` now always run a count query, because their embedded restaurant list includes `totalCount`.
- OpenAPI and the web's generated API types are regenerated.

### 12. API: trusted-proxy-by-address + rate-limit headers

**PR:** [#145](https://github.com/newtc22222/ff-restaurent/pull/145) -> `develop` (merged `616c450`, 2026-09-28 02:17 ICT). Approved by Security. Staging verified. No migration, no new routes.

**Why:** After #142, one proxy hop was correct only for traffic sent straight to the `run.app` URL. Custom-domain traffic (`api.ff-restaurent.com`, `api-staging.ff-restaurent.com`) passes through the global HTTPS load balancer. With hop=1 the API saw the load balancer as the client, so anonymous requests, login and registration through the custom domains all shared one bucket.

**Trusted proxies by address**
- Production default `trustProxy` is `169.254.0.0/16` (Cloud Run's link-local front end) plus the load balancer's address. Fastify walks `X-Forwarded-For` from the right and skips only those addresses, so it finds the real client on both the `run.app` and custom-domain paths. A client-supplied (spoofed) left-most entry is ignored.
- `TRUSTED_PROXIES` (comma-separated IPs/CIDRs) overrides the default; invalid entries fail at boot.
- `TRUST_PROXY_HOPS` still works as an alternative, limited to **0–3**; an empty value is treated as unset. Prefer leaving it unset so the address list applies. (See [Known issues](#known-issues-and-follow-ups-after-230) for the Security MEDIUM follow-up on hops 2–3.)
- No Cloud Run config change is required; defaults are in code.

**CORS and 429 body**
- CORS now exposes `Retry-After` and `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset`, so the web app can show the wait time.
- 429 responses use a stable error code: `{ "code": "RATE_LIMITED", "message": "Too many requests, retry in 1 minute" }`.

**.env.example** documents the rate-limit and proxy variables (`TRUSTED_PROXIES`, `TRUST_PROXY_HOPS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`).

After deploy, check that `jsonPayload.req.remoteAddress` matches `httpRequest.remoteIp` for requests on both `run.app` and the custom domain.

---

## Operations / configuration

Optional API environment variables (from #142 and #145):

| Variable | Default | Meaning |
| --- | --- | --- |
| `TRUSTED_PROXIES` | `169.254.0.0/16` plus the load balancer's address in production | Comma-separated IPs/CIDRs to trust for client IP. Invalid entries fail at boot. Prefer this over hop counts. |
| `TRUST_PROXY_HOPS` | unset (address list applies) | Alternative: number of proxy hops to trust (0–3 only). Empty is treated as unset. Prefer leaving unset so `TRUSTED_PROXIES` / the production default list applies. Whole number only; `true` stops the API from starting. |
| `RATE_LIMIT_MAX` | `300` | Requests per minute per signed-in user, or per client IP when not signed in. |
| `AUTH_RATE_LIMIT_MAX` | `5` | Login and registration attempts per minute per client IP. Does **not** control password reset (fixed 5 per 15 minutes, IP plus account). |

- `.env.example` documents these variables.
- **No Cloud Run config change is needed** because the defaults are in code. Neither `TRUST_PROXY_HOPS` nor `TRUSTED_PROXIES` is set on Staging or Production today, so the production default address list applies.
- Production secrets are unchanged. 2.3.0 adds **no new required settings**: `JWT_SECRET`, `REGISTRATION_INVITE_CODE` and `CORS_ORIGINS` are unchanged.
- After deploy, check in the API logs that `jsonPayload.req.remoteAddress` matches `httpRequest.remoteIp` on both the `run.app` and custom-domain paths (from #142 / #145).

## Migrations

From rc.1 (apply with the existing migrate path in the [Deployment Guide](../deployment-infrastructure/deployment-guide.md)):
- Notification enum `BILL_CREATED` (#120)
- Cuisine locale fields and cuisine images (#123)
- Collection `cuisineId` (#129)
- Meal-vote and Honor Badge tables and seeds (#130)
- `20260926090000_add_meal_vote_option_wheel_weight` (#140), with `rollback.sql`. Rolling back only drops custom weights, so every wheel returns to equal shares.

#141, #142, #143 and #145 add no migrations.

## Notable Pull Requests

- PR #119: Dining area edit inside the detail page.
- PR #120: Bill-created notify + auto-archive when paid (API).
- PR #121: Bill auto-done UI and `BILL_CREATED` notifications (web).
- PR #123: Cuisine images + EN/VI locale fields.
- PR #126: Cuisine detail with images and EN/VI (web).
- PR #127: Meal voting survey + wheels UI.
- PR #128: Prettier README to unblock CI.
- PR #129: Link a cuisine to collections for cookbooks (API).
- PR #130: Meal voting + Honor Badge API.
- PR #131: OpenAPI payment PATCH docs.
- PR #133: Collections cuisine theme (web).
- PR #135: Require `audienceUserIds` for `BILL_CREATED`.
- PR #136: Honor Badge profile UI.
- PR #138: Cuisines + Meal Votes UI redesign.
- PR #139: Meal-vote owner sets lucky wheel chances (web).
- PR #140: Per-option lucky wheel weights (API).
- PR #141: Meal-vote wheel review follow-up.
- PR #142: `includeTotal` pagination + per-client rate limiting.
- PR #143: Pagination controls, fetch/caching and cross-module fixes.
- PR #145: Trust proxies by address, expose rate-limit headers, `RATE_LIMITED` code.

## Known issues and follow-ups (after 2.3.0)

- **(MEDIUM, Security #145)** `TRUST_PROXY_HOPS` values 2–3 override `TRUSTED_PROXIES` and are a limiter bypass on the public `run.app` URL. Keep `TRUST_PROXY_HOPS` **unset** so the address list applies. Neither variable is set on Staging or Production today.
- Rate-limit counters are kept in memory on each Cloud Run instance. With up to 3 instances the effective limits can be about 3x the configured value, and counters reset on cold start.
- If the load balancer IP changes or a CDN is added in front, update `TRUSTED_PROXIES` (or the production default list).
- `PATCH /me/password` should get the strict auth rate limit.
- Validate cursors against the visibility filter.
- Validate the rate-limit environment variables at startup.
- No per-account login lockout (pre-existing).
- Backward cursor pages return the wrong rows on restaurants, cuisines, dining areas, bills, collections and meal votes. The web no longer uses backward mode.
- On login, registration and both password-reset screens, a 429 (`RATE_LIMITED`) still shows the generic "authentication failed" error, which reads like a wrong password. Draft [#146](https://github.com/newtc22222/ff-restaurent/pull/146) adds a proper "Too many attempts right now" message with a countdown and merges after the release. Shipped in [v2.4.0](./release-v2.4.0.md).
- The Meal Votes list search box does nothing until the API supports `search`.
- The first 25 restaurants embedded in cuisine and dining-area detail responses should become optional.
- API JSON responses should send `Cache-Control: private, no-store`.
- Wheel-weight edits after the vote deadline, plus tests. (The past-deadline ballot lock is also client-side only.)
- Bill hardening.

## Verification Evidence

Local checks reported in the PRs:
- #141: web tests 314/314 pass; typecheck, lint and prettier clean.
- #143: web tests 343 pass; typecheck, lint and prettier clean; `nginx -t` OK.
- #142: API tests 146 pass, 0 fail (21 DB-dependent skipped); typecheck, eslint, prettier and `openapi:check` pass.
- #145: API tests 154 pass, 0 fail (21 DB-dependent skipped); typecheck, eslint, prettier and `openapi:check` pass.

### Staging evidence (2026-09-28)

| Item | Value |
| --- | --- |
| `develop` tip commit | `616c450` (merge of #145) |
| Deploy run | [36343816132](https://github.com/newtc22222/ff-restaurent/actions/runs/36343816132) |
| Smoke run | [36344314631](https://github.com/newtc22222/ff-restaurent/actions/runs/36344314631) |
| Cloud Run revisions | API: `00093-wdn`; web: `00090-z5z` |
| Verified at (ICT) | 02:33 ICT |
| Production | Untouched |

rc.1 Staging evidence (wheel chances, 2026-09-26) is on the [rc.1 page](./release-v2.3.0-rc.1.md#staging-evidence---meal-vote-wheel-chances-2026-09-26).

## Production

Promoted by [#144](https://github.com/newtc22222/ff-restaurent/pull/144) ("Release 2.3.0", `develop` -> `main`), merged 2026-09-28 17:11 ICT.

Production deployment evidence:
- **Production merge SHA**: `ead6061` on `main` (tag `v2.3.0`).
- **GCP Deploy Workflow**: Passed (run [36408180247](https://github.com/newtc22222/ff-restaurent/actions/runs/36408180247), finished 17:19 ICT).
- **CI Workflow**: Passed (run [36408180682](https://github.com/newtc22222/ff-restaurent/actions/runs/36408180682)).
- **Smoke Verification**: `Staging smoke` workflow on the `main` deployment passed (run [36408987099](https://github.com/newtc22222/ff-restaurent/actions/runs/36408987099), 17:19 ICT).
- **GitHub release**: "FF RESTaurent 2.3.0" published 2026-09-28 21:18 ICT.
