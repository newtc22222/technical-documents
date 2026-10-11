---
id: release-v2.3.0-rc.1
title: Release v2.3.0-rc.1 (Staging)
sidebar_label: v2.3.0-rc.1 (Staging)
sidebar_position: 4
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
| 7 | Cuisines + Meal Votes UI redesign (SVG lucky wheel) | Yes (web) | Not yet | PR [#138](https://github.com/newtc22222/ff-restaurent/pull/138) (merged → `develop`) |
| 8 | Meal-vote lucky wheel chances (per-option weights) | Yes (API + UI) | Not yet | API [#140](https://github.com/newtc22222/ff-restaurent/pull/140) + migration `20260926090000_add_meal_vote_option_wheel_weight`; UI [#139](https://github.com/newtc22222/ff-restaurent/pull/139) (merged → `develop`) |

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
- Later on Staging: UI redesign with a custom SVG wheel (see [7](#7-cuisines--meal-votes-ui-redesign)) and persisted per-option wheel weights (see [8](#8-lucky-wheel-chances-api--ui)).
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

## 7. Cuisines + Meal Votes UI redesign

**PR:** [#138](https://github.com/newtc22222/ff-restaurent/pull/138) (`feat/cuisines-meal-votes-ui-redesign` → `develop`, **merged** 2026-09-26) - web only; no API or schema changes.

**Cuisines**
- Image-forward 4:3 cards; cards / table toggle (md+, persisted as `ff-cuisines-layout`).
- Detail hero with `RestaurantBanner`; gallery with multi-upload, default star, confirm dialogs, and image preview.

**Meal Votes**
- Card list with OPEN / CLOSED chips; create-modal polish.
- Detail with **Survey** / **Wheels** tabs (`role=tablist`); saffron progress bars with `aria-pressed`; past-deadline lock; Close confirm.
- **Wheels** tab: custom SVG lucky wheel (`apps/web/src/features/meal-votes/LuckyWheel.tsx`).
- EN/VI strings, including VI `wheelsTab` / `wheelsTitle` / `wheelTop`.

**Known gaps (from PR)**
- The past-deadline ballot lock is client-side only. The API still accepts votes until a manager closes the vote.
- Dining-area cards still use the old faded overlay (out of scope).

---

## 8. Lucky wheel chances (API + UI)

### API - PR [#140](https://github.com/newtc22222/ff-restaurent/pull/140) (`feat/meal-vote-wheel-weights` → `develop`, **merged** 2026-09-26)

**Schema**
- `MealVoteOption.wheelWeight Int @default(1)` plus DB `CHECK` constraint `MealVoteOption_wheelWeight_range` (1-100). Existing options default to 1, so every current wheel stays even.
- Migration `20260926090000_add_meal_vote_option_wheel_weight` (with `rollback.sql`). Rolling back only drops custom weights, which puts every wheel back to equal shares.

**HTTP**
| Method | Path | Auth |
| --- | --- | --- |
| PUT | `/meal-votes/:id/wheel-weights` | sous chef or head chef, then creator-or-head-chef (same rule as close / add-option) |

- Body `{ weights: [{ optionId, weight }] }`: 1-20 entries; each weight is an integer from 1 to 100. Partial update: omitted options keep their current weight. Returns the updated vote.
- OPEN votes only; uses the same transactional `updateMany where status=OPEN` guard as ballots, so a vote that closes mid-request can't be changed.
- Errors: 400 `VALIDATION_ERROR`, 400 `MEAL_VOTE_WEIGHT_DUPLICATE`, 400 `MEAL_VOTE_OPTION_INVALID`, 403 `MEAL_VOTE_FORBIDDEN`, 404 `MEAL_VOTE_NOT_FOUND`, 409 `MEAL_VOTE_CLOSED`.
- Every option in meal-vote responses (list, detail, create, add option, ballot, close) now includes `wheelWeight`.
- Weights have **no effect** on tallies or the official winner.

### UI - PR [#139](https://github.com/newtc22222/ff-restaurent/pull/139) (`feat/meal-vote-wheel-chances` → `develop`, **merged** 2026-09-26; stacked on #138)

- Every wheel option starts with an equal share (weight 1). Each option shows its chance as a percentage share.
- The vote owner (creator or head chef) on an **OPEN** vote gets **Edit chances**: set a weight from 1 to 100 per option; the percentages and the wheel preview update live. Reset to equal or cancel.
- Save sends only the changed weights (intent `update-meal-vote-wheel-weights`). Invalid weights block saving.
- The hint under the wheel switches between "same chance" and "custom chances".
- Missing `wheelWeight` (older API) falls back to 1.
- Weights affect only the wheel, not tallies or the official winner.
- Component: `apps/web/src/features/meal-votes/WheelOddsEditor.tsx`. New EN/VI strings in `mealVotes.json` and `toast.json` (VI wording pending Technical Writer review).

> **Follow-up pending:** a UX/copy follow-up PR for the meal-vote wheel is pending and not yet merged. These notes will be updated when it lands.

---

## Migrations / Staging ops
Apply Prisma migrations from the feature PRs on Staging (notification enum `BILL_CREATED`, cuisine locale + images, meal-vote + honor-badge tables/seeds, meal-vote option `wheelWeight`). Use the existing Staging migrate path in the Deployment wiki — do not invent a new procedure.

### Staging evidence - meal-vote wheel chances (2026-09-26)

| Item | Value |
| --- | --- |
| PRs merged → `develop` | #138 and #140 at 11:31 ICT; #139 at 11:41 ICT |
| `develop` tip | `680ebb9` (merge of #139) |
| Deploy run | [GCP deploy 36218575818](https://github.com/newtc22222/ff-restaurent/actions/runs/36218575818) - success |
| Migration | `20260926090000_add_meal_vote_option_wheel_weight` applied on Staging at 11:48 ICT |
| Cloud Run revisions | API `00089-q7t`; web `00086-8x9` |
| Production | Untouched |

## Production
No production promote for this RC until Staging checklist sign-off and the normal `develop` → `main` path.
