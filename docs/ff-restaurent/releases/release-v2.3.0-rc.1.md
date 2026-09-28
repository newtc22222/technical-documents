---
id: release-v2.3.0-rc.1
title: Release v2.3.0-rc.1 (Staging)
sidebar_label: v2.3.0-rc.1 (Staging)
sidebar_position: 1
description: FF RESTaurent 2.3.0-rc.1 Staging release candidate, with bill notifications and auto-archive, cuisine images, cookbooks, meal votes, and Honor Badges.
---

# Release v2.3.0-rc.1 (Staging)

> **Environment:** Staging (`develop`) — **Release Candidate**  
> **Production (`main`):** **not released** for this set yet.  
> Document only shipped behavior. Gaps are marked.

## Feature map

| # | Feature | Staging RC | Production | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Bill created notify + auto-archive when all paid | Yes | Not yet | PR [#120](https://github.com/newtc22222/ff-restaurent/pull/120) |
| 2 | Dining area edit on detail | Yes | Not yet | PR [#119](https://github.com/newtc22222/ff-restaurent/pull/119) |
| 3 | Cuisine images + EN/VI | Yes | Not yet | PR #123 |
| 4 | Cookbook = Collection + `cuisineId` | Yes | Not yet | Schema on `develop` + PRs [#129](https://github.com/newtc22222/ff-restaurent/pull/129) (API), [#133](https://github.com/newtc22222/ff-restaurent/pull/133) (web) |
| 5 | Meal voting survey (+ wheels) | Yes (API + web) | Not yet | API [#130](https://github.com/newtc22222/ff-restaurent/pull/130); web [#127](https://github.com/newtc22222/ff-restaurent/pull/127) |
| 6 | Honor Badge API + UI | Yes (API + UI) | Not yet | API [#130](https://github.com/newtc22222/ff-restaurent/pull/130); UI [#136](https://github.com/newtc22222/ff-restaurent/pull/136) (merged → `develop`) |

---

## 1. Bill created notify + auto-archive when all paid

**PR:** [#120](https://github.com/newtc22222/ff-restaurent/pull/120) → `develop`

### Notify
- Category: **`BILL_CREATED`**
- Fired when a bill is created.
- Audience: other bill participants (actor excluded). Empty audience does not broadcast to everyone.
- Localized copy (from PR tests):
  - VI: title `Hóa đơn mới`; body `{actor} đã tạo hóa đơn tại {restaurant}.`
  - EN: title `New bill`; body `{actor} created a bill at {restaurant}.`
- Dedup pattern observed: `bill-created:{billId}`
- Security review notes: in-app default on; push default off (preferences apply).

### Auto-archive
- Helper: `archiveBillWhenFullyPaid` (name as in PR #120 service).
- When participant payment updates leave **no unpaid participants** and the bill has **at least one** participant, an **ACTIVE** bill is archived with audit reason for all-paid.
- Payment / participant update responses may include **`autoArchived`**.
- Already-archived bills are left untouched; zero-participant bills are not archived by the unpaid==0 check alone.

---

## 2. Dining area edit on detail

**PR:** [#119](https://github.com/newtc22222/ff-restaurent/pull/119) → `develop` (web only)

- Chefs (sous / head path via existing `canChef` / manageable gate) edit **inline on the dining-area detail page** (not a modal).
- Reuses existing **`update-dining-area`** mutation and **`VietnamAddressFields`** (name, structured address, description).
- Customers: read-only (no Edit).
- Cancel discards draft; save toasts and revalidates loader.
- Layout follows Collection/Restaurant detail inline-edit pattern.

---

## 3. Cuisine images + EN/VI

**PR:** #123

### Model
- Nullable **`nameEn`**, **`nameVi`**, **`descriptionEn`**, **`descriptionVi`** beside existing `name` / `description`.
- `name` remains the canonical key for `nameKey`; locale fields do not rewrite it.
- Search trigger includes locale columns.
- **`CuisineImage`** gallery (ordered; unique storage path; unique `(cuisineId, sortOrder)`); optional default image on `Cuisine` (mirrors dining-area images).

### HTTP (as registered in PR)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/cuisines/:id` | Detail (added) |
| POST | `/cuisines/:id/images` | Chef manage |
| PATCH | `/cuisines/:id/images/:imageId/default` | Set default |
| DELETE | `/cuisines/:id/images/:imageId` | **204** |

List/create/update cuisine routes remain; body/response schemas accept the new locale fields.

---

## 4. Cookbook = Collection + `cuisineId`

**Status: verified on `develop`.** There is no separate `Cookbook` model. A cookbook is a **`Collection` with optional `cuisineId`** (FK → `Cuisine`, `ON DELETE SET NULL`) plus existing `CollectionRestaurant` links.

**PRs:** API [#129](https://github.com/newtc22222/ff-restaurent/pull/129); web [#133](https://github.com/newtc22222/ff-restaurent/pull/133) (supersedes draft #122).

### Schema / API (on `develop`)
- `Collection.cuisineId` nullable; responses may include compact nested `cuisine`.
- `POST /collections` and `PUT /collections/:id` accept optional `cuisineId`; `null` on update clears the theme; omit leaves unchanged.
- `GET /collections?cuisineId=` filters by theme.
- System collections still reject metadata edits (unchanged rules).

### Web UI (PR #133)
- Collections list/detail: cuisine theme on cards/detail; filter by cuisine; pick/clear on create/edit (`CollectionCuisineField`).

---

## 5. Meal voting survey (+ wheels)

**PR:** #130

### API (final shape in PR)
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/meal-votes` | authenticated |
| GET | `/meal-votes/:id` | authenticated |
| POST | `/meal-votes` | chef |
| POST | `/meal-votes/:id/options` | chef |
| PUT | `/meal-votes/:id/ballot` | authenticated (cast/change; singular path is final) |
| POST | `/meal-votes/:id/close` | chef |

### Rules present in service/schema
- Options: min 2, max 20; distinct labels (case-insensitive).
- Optional future `closesAt` when set.
- Responses expose tallies + caller’s choice; not other voters’ identities.
- Winner: highest count; ties by lower `sortOrder`; no ballots → no winner.
- Notifications: **`MEAL_VOTE_CREATED`**, **`MEAL_VOTE_RESULT`**. **`MEAL_VOTE_CLOSING`** not emitted (no scheduler in PR).

### Wheels + Web UI — PR [#127](https://github.com/newtc22222/ff-restaurent/pull/127) (merged → `develop`)

- Routes: **`/meal-votes`** (list), **`/meal-votes/:mealVoteId`** (detail).
- Detail tabs: **`survey`** | **`wheels`**.
- Wheels: client-side weighted spin over option pool (`all` or `top` by `voteCount`); not a separate backend wheel API.
- Aligns to OpenAPI from #130 (`PUT .../ballot` with `{ optionId }`, `OPEN|CLOSED`, tallies / `myOptionId`).

---

## 6. Honor Badge (API + UI)

### API — PR #130 (verified)

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/honor-badges/levels` | authenticated |
| GET | `/me/honor-badge` | authenticated (self only) |
| POST | `/me/honor-badge/claim` | authenticated → **201** |

**Scoring:** `points = 10 × paidParticipations + 5 × hostedBills` (ACTIVE bills only; archived bills stop counting).

**Seeded levels (code / English name / minPoints):**

| code | name | minPoints |
| --- | --- | --- |
| `NEWCOMER` | Newcomer | 0 |
| `REGULAR` | Regular | 50 |
| `GOURMET` | Gourmet | 150 |
| `CONNOISSEUR` | Connoisseur | 400 |
| `LEGEND` | Legend | 1000 |

**`nameVi` (from `honor-badge-seed.ts` on `develop`):** `Thực khách mới`, `Khách quen`, `Sành ăn`, `Tinh hoa ẩm thực`, `Huyền thoại`.

Claim walks one unclaimed reached tier at a time (`(userId, levelCode)` unique).

### UI — PR [#136](https://github.com/newtc22222/ff-restaurent/pull/136) (`feat/honor-badge-ui` → `develop`, **merged**)

Per **Senior Engineering Lead**, Honor Badge **UI is in Staging RC scope** (not API-only). PR #136 is **merged into `develop`**. Facts below are from the #136 diff (and now on Staging track).

**Entry**
- Route: **`/profile`** (`ProfilePage`).
- Renders **`HonorBadgeSection`** (`data-testid="honor-badge"`) on the profile page (between existing profile content and notification preferences).

**Components / hooks**
- `apps/web/src/features/profile/HonorBadgeSection.tsx`
- `apps/web/src/features/profile/honor-badge.queries.ts` — `useHonorBadgeSummary`, `useHonorBadgeLevels`, `useClaimHonorBadge`
- `honorBadgeEndpoints` in `apps/web/src/api/endpoints.ts`
- i18n: `en/honorBadge.json`, `vi/honorBadge.json` (level display uses `nameVi` when locale is VI)

**UI behavior (from component + tests)**
- Loads summary + levels; shows points, current badge, next badge / points-to-next, hosted-bill and paid-participation counts.
- Level ladder with claimed / ready / locked; claim history.
- When `claimableLevel` is present: **Claim badge** → `POST /me/honor-badge/claim`; success toast; summary refresh.
- Loading / error / empty (nothing to claim) states.

**API calls the UI makes**
| Call | Path |
| --- | --- |
| Levels | `GET /honor-badges/levels` |
| Summary | `GET /me/honor-badge` |
| Claim | `POST /me/honor-badge/claim` (empty JSON body) |

**Visibility**
- Own profile only (same authenticated `/profile` session as other profile panels). No separate public badge page in this PR.

---

## Migrations / Staging ops

Apply Prisma migrations from the feature PRs on Staging (notification enum `BILL_CREATED`, cuisine locale + images, meal-vote + honor-badge tables/seeds). Use the existing Staging migrate path in the Deployment wiki — do not invent a new procedure.

## Production

No production promote for this RC until Staging checklist sign-off and the normal `develop` → `main` path.
