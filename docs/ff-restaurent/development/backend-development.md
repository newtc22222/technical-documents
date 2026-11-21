---
id: backend-development
title: Backend Development Guide
sidebar_label: Backend Development
sidebar_position: 1
description: Working on the API in apps/api — the Fastify 5 / Prisma 6 / PostgreSQL stack.
---

# Backend Development Guide

This guide explains how to work on the FF RESTaurent API in `apps/api`.

Stack versions were checked on 2026-10-22 against `apps/api/package.json` on `develop` and `main` (Fastify 5.12, Prisma 7.10). The tree below matches that checkout.

## Technology Stack

- Node.js with TypeScript and native ESM
- Fastify 5
- `@fastify/jwt` for bearer-token authentication
- `@fastify/cors`, `@fastify/rate-limit`, `@fastify/multipart`
- Prisma 7 with PostgreSQL, through the `pg` driver adapter
- CORS preflights may be cached for 7200 seconds (`CORS_PREFLIGHT_MAX_AGE_SECONDS` in `apps/api/src/app.ts`). The notification stream response includes CORS headers.
- Zod request validation
- Swagger UI at `/api/docs`
- Supabase storage for restaurant media and payment QR images
- `@ff-restaurent/shared` for shared enums, phone parsing, and bill-splitting
  math

## Source Layout

```text
apps/api/
|-- prisma/
|   |-- schema.prisma
|   |-- migrations/
|   |-- scripts/          backfill, root bootstrap and recover, index and contract checks, notification prune
|   `-- seed/             seed.ts, seed-if-empty, popular cuisines, honor badges
|-- scripts/
|   `-- run-release-job.sh
`-- src/
    |-- app.ts            composition only
    |-- server.ts         listen and shutdown
    |-- config/           config.ts, server-config.ts
    |-- contracts/        restaurant-contract.ts, route-contracts.ts
    |-- data/vietnam-wards-full.json
    |-- http/             auth-guards, error-handler, rate-limit, request-log
    |-- lib/              prisma, roles, pagination, password, search and catalog normalization
    |-- routes/           one register function per area
    |-- schemas/          Zod modules, imported through schemas/index.ts
    `-- services/         domain rules, serializers, storage, push, seeds
```

Route modules in `src/routes`:

- `address-routes.ts`, `auth-routes.ts`, `password-reset-routes.ts`
- `profile-routes.ts`, `member-routes.ts`
- `restaurant-routes.ts`, `brand-routes.ts`, `catalog-routes.ts`
- `collection-routes.ts`, `feedback-routes.ts`, `media-routes.ts`
- `bill-routes.ts`, `recipe-routes.ts`, `meal-vote-routes.ts`
- `honor-badge-routes.ts`, `notification-routes.ts`
- `participant-group-routes.ts`, `stats-routes.ts`

Tests are colocated as `*.test.ts`.

## Request Flow

The backend request flow should remain direct:

```text
HTTP request
  -> Fastify route
  -> auth or role preHandler when required
  -> Zod schema parse for request data
  -> Prisma query or shared package calculation
  -> serializer or response object
  -> global error mapper when needed
```

`src/app.ts` is composition-only. It registers core plugins, Swagger, health
routes, the global error handler, and route modules. Do not move domain logic
back into `app.ts`.

`src/server.ts` owns process startup and graceful shutdown. Keep runtime
concerns there.

## Route Modules

Route files under `src/routes` own one API area each. A route module keeps
authentication, Zod parsing, and status codes. Ownership, visibility, and
persistence belong in `src/services` when more than one route needs them.

- `services/collection-service.ts` owns collection, favorite, and recommended behavior.
- `contracts/restaurant-contract.ts` derives backward-compatible restaurant response aliases from normalized persistence.
- `services/root-admin-service.ts` owns root transfer behavior.
- `services/storage.ts` owns Supabase-backed media access.
- `services/phone-backfill.ts` and `services/popular-cuisine-seed.ts` support the release job and the local Compose command. `server.ts` does not run them.

## Validation and Errors

Request validation lives in `src/schemas`. Route modules import the barrel
`src/schemas/index.ts` and parse with Zod. Do not validate request bodies by hand.

When changing request or response fields:

1. Update the Zod schema.
2. Update the route handler and the service that owns the Prisma query.
3. Update serializers such as `contracts/restaurant-contract.ts` when relevant.
4. From the repository root, run `npm run openapi:generate`, then `npm run openapi:check`. The check fails when `apps/api/openapi.json` or `apps/web/src/api/generated/api-types.ts` is behind the contract.
5. Add or update focused tests.

The global error mapper in `src/http/error-handler.ts` should remain the place
where common API errors become consistent HTTP responses.

## Roles and Authorization

Effective permissions ascend as:

```text
CUSTOMER < SOUS_CHEF < HEAD_CHEF < ROOT_ADMIN
```

- CUSTOMER is represented by `chefRole: null`.
- SOUS_CHEF can create restaurants and bills and manage owned work.
- HEAD_CHEF adds global bill visibility and archive/restore capabilities.
- ROOT_ADMIN is the singleton `systemRole`, inherits Head Chef capabilities, and
  exclusively manages member roles, root transfer, password-recovery
  administration, and other system controls.

`chefRole` and `systemRole` are independent. HEAD_CHEF must never change member
roles or ROOT_ADMIN ownership.

Use auth pre-handlers from `src/http/auth-guards.ts` for broad route access.
Use service checks for ownership rules that require loading the target record,
such as bill creator checks or participant payment checks.

`src/lib/roles.ts` re-exports the hierarchy from `@ff-restaurent/shared` and
owns `sanitizeUser` and `publicUserSelect`. Always return users through those
helpers. Never serialize password hashes, reset-code hashes, or session-version
internals.

## Money and Bill Splitting

All persisted and API monetary values are integer cents. Never use float math
for bill totals, participant shares, discounts, VAT, shipping, or vouchers.

Core calculation logic lives in:

```text
packages/shared/src/bill-splitting.ts
```

The API should call `calculateBillSplit()` and persist the returned integer-cent
values. Do not duplicate allocation logic inside route handlers. If bill math
changes, update shared tests at the same time:

```powershell
npm test --workspace @ff-restaurent/shared
```

## Database and Phase 2 Contracts

Database models, enums, constraints, and relations live in:

```text
apps/api/prisma/schema.prisma
```

For schema changes:

1. Update `schema.prisma`.
2. Create a Prisma migration.
3. Regenerate the Prisma client.
4. Update route query shapes and serializers.
5. Update web API types.
6. Update seed/backfill scripts when production or demo data needs coverage.
7. Add focused API tests or migration verification as needed.

Use deploy mode for production:

```powershell
npm run prisma:migrate:deploy --workspace @ff-restaurent/api
```

Do not run `prisma migrate dev` against production.

The v1.1.0 Phase 2 contract is complete:

- Collections are the sole persistence authority for Favorites and Recommended
  restaurants.
- `Cuisine` and `RestaurantCuisine` are the cuisine authority.
- `RestaurantPlatformLink` rows are the platform-link authority.
- Legacy restaurant response aliases are derived by `contracts/restaurant-contract.ts`.
- The deprecated `links` write input is still accepted and translated to
  normalized platform links.

Verify the normalized restaurant contract against a live database with:

```powershell
npm run prisma:phase2:contract:verify --workspace @ff-restaurent/api
```

## Phone, Password, and Root Operations

Vietnamese phone parsing is shared, but the API is authoritative. Optional phone
numbers persist as canonical E.164 values. The release job and the local
Compose command run the idempotent phone backfill after migrations. The API
process does not.

JWTs carry `sessionVersion`. Password changes, assisted password resets, and
root transfers invalidate affected older sessions.

Production root bootstrap uses `ROOT_ADMIN_USERNAME` only when no root exists.
Emergency root recovery is interactive and operator-only:

```powershell
npm run prisma:root:recover --workspace @ff-restaurent/api
```

Do not expose root recovery through HTTP or web UI.

## Local Development

Run the full stack with Docker:

```powershell
docker compose up --build
```

Expected local endpoints:

```text
API:      http://localhost:4000
Health:   http://localhost:4000/health
Ready:    http://localhost:4000/ready
Swagger:  http://localhost:4000/api/docs
Web:      http://localhost:5173
```

Run only the API. Build the shared package first. The API imports its compiled output:

```powershell
npm run build --workspace @ff-restaurent/shared
npm run prisma:generate --workspace @ff-restaurent/api
npm run dev --workspace @ff-restaurent/api
```

API typecheck, build, and Prisma commands load `apps/api/prisma.config.ts` and
therefore require `DATABASE_URL`, even when they do not query the database.
State clearly when database-backed verification was skipped.

## Verification

For API-only changes:

```powershell
npm run typecheck --workspace @ff-restaurent/api
npm run lint --workspace @ff-restaurent/api
npm test --workspace @ff-restaurent/api
npm run build --workspace @ff-restaurent/api
```

For Prisma or contract changes:

```powershell
npm run prisma:generate --workspace @ff-restaurent/api
npm run prisma:indexes:verify --workspace @ff-restaurent/api
npm run prisma:phase2:contract:verify --workspace @ff-restaurent/api
```

For shared bill math or shared types:

```powershell
npm test --workspace @ff-restaurent/shared
npm run build --workspace @ff-restaurent/shared
```

For broad changes before review:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Backend Change Checklist

- Put endpoints in the route module that owns the resource.
- Use `requireAuthenticatedUser` before reading `request.currentUser`.
- Use role pre-handlers for broad access gates and route-local checks for
  ownership.
- Parse request data with Zod schemas.
- Use Prisma for persistence.
- Keep money as integer cents and delegate split math to `packages/shared`.
- Return sanitized users only.
- Preserve ROOT_ADMIN-only governance.
- Preserve Phase 2 normalized restaurant persistence contracts.
- Regenerate the OpenAPI contract when API response contracts change (`npm run openapi:check`).
- Add focused tests before broad verification.
