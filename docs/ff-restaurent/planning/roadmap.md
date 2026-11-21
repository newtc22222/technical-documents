---
id: roadmap
title: Roadmap for Cuisine i18n, Meal Tracking, and AI Features
sidebar_label: Roadmap
sidebar_position: 1
description: Draft FF RESTaurent roadmap after 2.4.x, covering cuisine type i18n, private meal tracking, and feature-flagged AI features on the 2.5.x line.
---

# Roadmap: Cuisine i18n, Meal Tracking, and AI Features

:::note

Source: `ROADMAP.md` on the [`docs/roadmap-and-wiki`](https://github.com/newtc22222/ff-restaurent/tree/docs/roadmap-and-wiki) branch (snapshot `702f576`). It was moved off `develop` by [#172](https://github.com/newtc22222/ff-restaurent/pull/172) and is a draft plan, not shipped behavior. Since it was written, the cuisine type labels (`typeEn` / `typeVi`, milestone M1) shipped in [#170](https://github.com/newtc22222/ff-restaurent/pull/170) as part of [v2.4.5](../releases/release-v2.4.5.md) rather than a separate 2.4.1.

:::

Status: **draft for review**. No Linear issues exist yet. Each `Tn.m` below is
written to become one Linear issue, so titles, scope, and acceptance criteria are
self-contained. Suggested Linear milestone: `Phase 3 — Advanced Automation`.

Baseline: `develop` after PRs #166 to #169, which landed while this was being
written and are reflected below: cuisine price range and team average spend,
the province-grouped Catalog, **Recipes with hand-entered per-serving
nutrition** (`Recipe.caloriesKcal`, protein, carbs, fat), and restaurant
brands/branches (`RestaurantBrand`).

## Decisions already made

| Topic          | Decision                                                                          |
| -------------- | --------------------------------------------------------------------------------- |
| AI model       | Gemini 3.5 Flash, model ID `gemini-3.5-flash`, via the `@google/genai` Node SDK   |
| Meal log scope | **Private by default** (owner-only). Sharing is out of scope for this roadmap     |
| Bill detection | Reads **bill totals** from a photo (base cost, VAT, shipping, discounts, total)   |
| Rollout        | AI is feature-flagged (`AI_ENABLED`), so the app runs normally with AI turned off |

## Release plan

| Release | Milestone            | Contents     |
| ------- | -------------------- | ------------ |
| 2.4.1   | M1 Cuisine i18n      | T1.1 to T1.4 |
| 2.5.0   | M2 Meal tracking     | T2.1 to T2.5 |
| 2.5.x   | M3 AI foundation     | T3.1 to T3.5 |
| 2.5.x   | M4 AI assessment     | T4.1 to T4.2 |
| 2.5.x   | M5 AI suggestion     | T5.1 to T5.2 |
| 2.5.x   | M6 AI detection      | T6.1 to T6.4 |
| any     | Cross-cutting chores | T0.1 to T0.2 |

Meal tracking and all AI services stay on the 2.5.x line. The `2.5.x` patch
numbers are placeholders; a suggested order is 2.5.0 for M2, 2.5.1 for M3 plus
M4, 2.5.2 for M5, and 2.5.3 for M6, and the final numbers are yours to assign.
Each AI release stays behind `AI_ENABLED`, so shipping one does not change
behavior until it is switched on.

Dependency chain: `M1` is independent. `M2` has no dependencies. `M3` needs
nothing from `M2`, but `M4` needs both `M2` and `M3`. `M5` needs `M3` (and uses
`M2` data when present). `M6` needs `M3`.

---

## M1. Cuisine `type` in English (2.4.1)

Today `Cuisine.name` and `description` have `En`/`Vi` variants and are resolved
by `localizedCuisineName` / `localizedCuisineDescription`
(`apps/web/src/features/catalog/localizedCuisine.ts`). `Cuisine.type` (for
example "Món nước") has no translation and is shown raw in the restaurant
form, collection cuisine field, cuisine edit modal, and stats.

### T1.1 API and schema: `typeEn` / `typeVi`

- Prisma: add nullable `typeEn`, `typeVi` to `Cuisine`; additive migration.
- Extend Zod cuisine schemas, serializers, and `openapi.json` (`npm run openapi:check`).
- Keep `type` as the canonical fallback (no breaking change).
- **Accept:** create/update accepts and returns both fields; existing clients unaffected; schema and route tests added.

### T1.2 Seed and backfill English types

- Fill `typeEn`/`typeVi` in `popular-cuisine-seed.ts` and `prisma/seed/seed.ts`.
- The seed is part of the blocking release job, so it must stay **idempotent** and also backfill existing rows without overwriting values an admin edited.
- **Accept:** running the seed twice yields identical rows; `popular-cuisine-seed.test.ts` covers backfill and no-overwrite.

### T1.3 Web: `localizedCuisineType` and usage

- Add `localizedCuisineType` beside `localizedCuisineName`, with unit tests.
- Use it in `RestaurantCatalogFields.tsx`, `collection-cuisine.ts` (description and `searchText`), the stats label, and anywhere else `cuisine.type` renders.
- Search matches both languages.
- **Accept:** switching EN/VI changes the type label everywhere; no raw `cuisine.type` left in UI code (grep check).

### T1.4 Web: cuisine edit modal

- `CuisineEditModal.tsx`: add English and Vietnamese type inputs. Follow `.context/ui-guidelines.md` and reuse existing form components (`.context/COMPONENTS.md`).
- EN/VI translation keys added 1:1.
- **Accept:** SOUS_CHEF and above can edit; CUSTOMER view stays read-only.

---

## M2. Feature: Meal tracking (2.5.0)

A personal log of what each person ate. **Private to its owner.** Calories are
optional and become AI-fillable in M4.

### T2.1 Data model: `MealLog`

New model and enums, additive migration:

- `id`, `userId` (cascade delete with user), `eatenAt`, `mealType` (`BREAKFAST | LUNCH | DINNER | SNACK | DRINK`), `title`, `notes?`
- Optional links: `restaurantId?`, `billId?`, `cuisineId?`, `recipeId?` (all `SetNull` on delete). Picking a recipe prefills `calories` from `Recipe.caloriesKcal` (per serving) and the user can adjust servings eaten.
- `calories?` (Int), `caloriesSource` (`MANUAL | AI_ESTIMATE`, nullable), `aiConfidence?`
- `photoPath?` (storage path, see T2.3)
- Indexes: `[userId, eatenAt, id]`, `[userId, mealType, eatenAt]`.
- **Accept:** migration applies on a populated DB; `prisma:indexes:verify` passes.

### T2.2 API: `/meal-logs` CRUD

- New `meal-log-routes.ts` + `meal-log-service.ts` + Zod schemas in the barrel.
- Owner-scoped on **every** query (no role, not even HEAD_CHEF or ROOT_ADMIN, can read another user's logs).
- Cursor pagination matching `lib/pagination.ts`, filters: date range, `mealType`, `restaurantId`.
- **Accept:** other users get 404 (not 403) for someone else's log; tests cover ownership, pagination, validation.

### T2.3 Private meal photo storage

- New private Supabase bucket (`SUPABASE_MEAL_BUCKET`, default `ff-meal-photos`) served with short-lived signed URLs, as the payment QR bucket does.
- Upload endpoint with type and size validation (JPEG/PNG/WebP, max 5 MB); delete on log delete.
- **Accept:** a photo cannot be fetched without an owner-issued signed URL; orphaned objects cleaned up on delete; `storage.test.ts` extended.

### T2.4 Web: Meal log page and form

- New `features/meal-logs` (reuse the `features/recipes` and `features/restaurants` pickers rather than building new ones): list/timeline grouped by day, add/edit form (meal type, time, restaurant picker, cuisine, notes, photo, calories), loader/action intents via the shared mutation dispatcher, TanStack Query hooks.
- Add to navigation and Settings/feature grouping consistent with the existing layout; EN/VI strings 1:1.
- **Accept:** works on mobile width; empty/loading/error states per UI guidelines; colocated tests.

### T2.5 Web: "Log my meal" from a bill, plus stats

- Bill detail page gets a "Log this meal" action prefilled with restaurant, date, and cuisine.
- Add a simple personal summary to the page (meals per week, calories per day when present).
- **Accept:** one-tap prefill; no duplicate log for the same `billId` per user (unique on `[userId, billId]` or a friendly duplicate warning).

---

## M3. AI foundation (2.5.x)

All AI features share one server-side gateway. The API never exposes provider
credentials to the web app.

### T3.1 Provider abstraction and Gemini client

- `apps/api/src/services/ai/` with a small `AiProvider` interface (`generateStructured({ prompt, images?, schema })`) and a `GeminiProvider` using `@google/genai`.
- Model default `gemini-3.5-flash`, configurable (`AI_MODEL`).
- Structured output only: responses are validated with Zod; invalid output is one retry, then a typed error.
- Timeouts and error mapping (quota, safety block, timeout) to stable API errors.
- **Accept:** unit tests use a fake provider; no network in CI.

### T3.2 Config and credentials

- `config.ts` / `.env.example`: `AI_ENABLED` (default `false`), `AI_MODEL`, `GOOGLE_CLOUD_LOCATION`, optional `GEMINI_API_KEY` (local dev only).
- **Production uses Vertex AI with Application Default Credentials**, the same no-secret pattern as Firebase Admin: `new GoogleGenAI({ vertexai: true, project, location })`. The Cloud Run runtime service account (`ff-runtime@ff-restaurent.iam.gserviceaccount.com`) needs `roles/aiplatform.user`, and the Vertex AI API must be enabled in the project.
- Local development can use an AI Studio API key instead.
- Update the GCP deploy workflow and the deployment wiki; do not add any API key as a `VITE_` variable.
- **Accept:** startup with `AI_ENABLED=false` needs no AI settings; a missing credential with `AI_ENABLED=true` fails fast with a clear message; `config.test.ts` covers both.

### T3.3 Usage metering, quotas, and rate limits

- `AiUsage` table (`userId`, `feature`, `model`, input/output tokens, `createdAt`) written per call.
- Per-user daily quota per feature (configurable) and a global monthly kill switch, both returning a clear "AI limit reached" response.
- Stricter route rate limit than default.
- **Accept:** quota exceeded returns 429 with a localized message key; usage rows queryable by ROOT_ADMIN for cost review.

### T3.4 Image intake hardening

- Shared multipart handler for AI images: allow JPEG/PNG/WebP, max 5 MB (Vertex inline limit is 7 MB), magic-byte check, strip EXIF/GPS before sending, optional client-side downscale.
- Images are sent to Gemini inline and **not stored** unless the user saves them to a meal log.
- **Accept:** oversized or mislabeled files rejected; GPS metadata removed (tested).

### T3.5 Web: AI availability and privacy notice

- `GET /ai/status` returns enabled features and remaining quota; the web app hides AI buttons when disabled.
- First-use notice: photos are sent to Google for processing; results are estimates. EN/VI.
- **Accept:** AI entry points absent when `AI_ENABLED=false`; notice shown once and remembered per user.

---

## M4. Feature: AI assessment (2.5.x)

Photo in, calorie estimate out. Depends on M2 and M3.

### T4.1 API: `POST /ai/meal-assessment`

- Input: one image (T3.4). Output (Zod-validated): `dishName`, `cuisineId?` (matched to an existing cuisine), `caloriesMin`, `caloriesMax`, `caloriesEstimate`, `confidence` (0 to 1), `notes`.
- Prompt describes portion-size uncertainty; prompt text kept in a versioned module.
- **Accept:** fake-provider tests; low-confidence and "not food" cases return a typed result, not a guess.

### T4.2 Web: "Estimate from photo" in the meal log form

- Button on the form fills dish name, cuisine, and calories; user can edit before saving.
- Saved with `caloriesSource = AI_ESTIMATE` and clearly labeled as an estimate.
- **Accept:** failure or quota states are non-blocking (manual entry still works); EN/VI strings.

---

## M5. Feature: AI suggestion (2.5.x)

Recommend food by mood, restaurant/eatery, and similar context. Depends on M3.

### T5.1 API: `POST /ai/suggestions` (catalog-grounded)

- Input: free-text mood or request, optional filters (cuisine, province/catalog area, budget, meal type). Budget uses the new cuisine price range and team average spend.
- **Shortlist first, rank second:** the API builds a candidate list from the catalog (favorites, Recommended collection, ratings, cuisine, catalog area, price range, and the user's recent meals to avoid repeats). Recipes can be added as a second candidate type for a "cook at home" option; this is optional and can ship later. The model sees only candidate IDs and short facts, and returns ranked IDs with reasons.
- IDs are validated against the shortlist, so the model cannot invent places.
- User-supplied text (restaurant names, feedback comments, the mood text) is treated as data, never as instructions.
- **Accept:** hallucinated IDs dropped; archived restaurants never suggested; tests include a prompt-injection fixture.

### T5.2 Web: "What should we eat?" panel

- Mood chips plus free text, results as the existing restaurant card with a reason line.
- "Start a vote with these" creates a `MealVote` using the existing meal-vote feature.
- **Accept:** works with an empty history; result list links to restaurant detail; EN/VI strings.

---

## M6. Feature: AI detection (2.5.x)

Read a bill photo, guess the cuisine, find related information, and fill the
bill. Depends on M3. This is the riskiest milestone because it feeds money.

### T6.1 API: `POST /ai/bill-detection`

- Input: a bill or receipt photo. Output (Zod-validated): `restaurantName?`, `address?`, `occurredOn?`, `baseCost`, `vat`, `shippingFee`, `discounts[]`, `vouchers[]`, `totalCost`, `cuisineId?`, per-field `confidence`.
- **Money rules:** follow the repo's integer-cents convention (verify and document how VND amounts map before building, and add a shared helper in `packages/shared`). Never trust model arithmetic: recompute `totalCost` from the extracted components and flag a mismatch instead of silently correcting.
- **Accept:** a fixture set of receipts (Vietnamese and English, with and without VAT/vouchers) with expected values; mismatches surface as warnings.

### T6.2 Related-information matching (catalog only)

- Match the extracted restaurant name and address to existing `RestaurantEntry` rows (normalized key plus fuzzy match), using `RestaurantBrand` so "Phở 24 - Branch 1" and "Phở 24 - Branch 2" resolve to the right brand and branch and return the top candidates with a match score.
- No open-web search in this milestone. If no good match, offer "create new restaurant" with the extracted details prefilled.
- **Accept:** exact and near-duplicate matches found; no match returns an empty candidate list, not a forced guess.

### T6.3 Web: AI prefill on the bill form

- "Scan bill" action on the bill create form fills restaurant, date, costs, discounts, and vouchers.
- Nothing is saved until the user reviews. Low-confidence fields are highlighted, and mismatched totals show a warning.
- Reuses the existing duplicate-bill detection on save.
- **Accept:** every prefilled field remains editable; scan failure leaves the form untouched; EN/VI strings.

### T6.4 Evaluation harness

- Small repeatable eval script (not part of default CI) that runs the fixture images through the real model and reports field accuracy for T4.1 and T6.1, so prompt or model changes can be compared.
- **Accept:** one command prints per-field accuracy; fixtures contain no real customer data.

---

## Cross-cutting chores

### T0.1 Documentation refresh

- `CLAUDE.md` now covers recipes, brands, and the catalog, but its overview still says v1.1.0 and it omits meal votes, honor badges, and notifications. Fix the version line, then add the meal log and AI gateway sections as each milestone ships, and update `TODO.md` (several items there are already done).
- Add a deployment wiki note for the AI setup (T3.2).

### T0.2 Release checklist per milestone

- Each release follows the existing flow: migrations, idempotent seed, `openapi:check`, `typecheck`, tests, `prettier:check`, e2e, and the staging smoke suite extended with an AI-disabled and (staging only) AI-enabled check.

---

## Risks and open questions

| Risk or question                                                                                     | Plan                                                                                            |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Cost. Third-party listings show about $1.50 per 1M input and $9 per 1M output tokens (unverified)    | Check Google's pricing page; T3.3 meters usage and enforces quotas                              |
| Privacy. Photos of people, receipts, and card digits go to Google                                    | T3.4 strips EXIF, does not store images, and shows the notice (T3.5). Confirm Vertex data terms |
| Estimate quality. Calories from a photo are rough, and receipt OCR can misread digits                | Always show as an estimate, require user review, recompute totals, eval harness (T6.4)          |
| Model availability and ID drift (`gemini-3.5-flash`)                                                 | Model ID is config, not code                                                                    |
| Prompt injection via restaurant names or comments                                                    | Shortlist plus ID validation in T5.1; treat all stored text as data                             |
| Money unit convention for VND ("integer cents")                                                      | Verify before T6.1; document in `packages/shared`                                               |
| Should AI calorie estimates be able to match an existing `Recipe` (nutrition is hand-entered there)? | Optional extra in T4.1: return the nearest recipe as a suggestion, never overwrite its data     |
| Should meal logs ever be shareable (for example with a participant group)?                           | Out of scope now; the owner-only model makes it additive later                                  |
| Should the 7 MB inline limit become an upload-by-reference flow?                                     | No: 5 MB cap and client downscale are enough for now                                            |

## Suggested Linear structure

- One project: **AI and Meal Tracking**, under milestone `Phase 3 — Advanced Automation`.
- One parent issue per milestone (M1 to M6), with `Tn.m` as sub-issues.
- Labels: `api`, `web`, `db-migration`, `ai`, `i18n`.
- Blocking relations: T4.x blocked by T2.2 and T3.1; T5.x and T6.x blocked by T3.1; T3.x blocked by nothing.
