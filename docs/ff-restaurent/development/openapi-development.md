---
id: openapi-development
title: OpenAPI Development
sidebar_label: OpenAPI Development
sidebar_position: 3
description: How to update and validate the OpenAPI contract, generated transport types, and CI drift gate.
---

# How to update and validate the OpenAPI contract

FF RESTaurent generates its OpenAPI specification and web transport types from the same Zod schemas that Fastify uses for runtime validation. This guide shows how to inspect the contract, regenerate its artifacts, run its checks, and diagnose drift.

> [!NOTE]
> The FF-31 setup is currently on pull request [#59](https://github.com/newtc22222/ff-restaurent/pull/59). If the commands below are missing from your branch, check out `codex/ff-31-openapi-generated-client` or wait until the pull request merges into `develop`.

## Understand the contract flow

The contract has one runtime source and two generated artifacts:

1. Domain Zod schemas live in `apps/api/src/schemas/` and export through `apps/api/src/schemas/index.ts`
2. `apps/api/src/contracts/route-contracts.ts` attaches request, parameter, query, security, and response schemas to Fastify routes
3. Fastify validates requests from those schemas and exposes the same schemas through Swagger
4. `scripts/generate-openapi.ts` starts the application in memory and writes `apps/api/openapi.json`
5. The generator converts that document into `apps/web/src/lib/generated/api-types.ts`
6. `apps/web/src/lib/generated/transport-client.ts` creates an `openapi-fetch` client from the generated `paths` type

The generator maps shared enums to `@ff-restaurent/shared`. Generated transport types must not redeclare domain enum literals such as `PAID`, `HEAD_CHEF`, or `SHOPEE_FOOD`.

## Inspect the Swagger interface

Swagger UI lets you inspect and exercise the runtime contract against a local API.

Start the application from the repository root:

```powershell
docker compose up --build
```

Open `http://localhost:4000/api/docs`. Test public endpoints directly. For protected endpoints, call `POST /auth/login`, copy the returned JSON Web Token (JWT), and enter it through **Authorize**.

Swagger UI confirms the running application contract. It does not confirm that generated files are current.

## Check generated artifact drift

The drift check rebuilds both generated artifacts in memory and compares them byte for byte with the checked-in files.

Run this command from the repository root:

```powershell
npm run openapi:check
```

The command exits with code `0` when both artifacts are current. A stale file produces an error that names the file and tells you to run `npm run openapi:generate`.

The generator supplies a placeholder `DATABASE_URL` before importing the API. It does not require a running database for generation or drift checks.

## Update an API contract

Use the same schema in the route handler and the central route contract. This keeps runtime behavior, documentation, and generated types aligned.

1. Add or update the domain schema in `apps/api/src/schemas/<domain>.ts`
2. Export the schema through `apps/api/src/schemas/index.ts`
3. Use the schema in the route handler instead of duplicating validation
4. Attach the schema in `apps/api/src/contracts/route-contracts.ts`
5. Update `apps/api/src/schemas/transport.ts` when a named response component changes
6. Add a focused runtime or integration test
7. Regenerate and inspect the artifacts

Run the generator:

```powershell
npm run openapi:generate
```

Review only the generated contract files:

```powershell
git diff -- apps/api/openapi.json `
  apps/web/src/lib/generated/api-types.ts
```

Commit both generated files with the source schema change. Do not edit either generated file by hand.

For partial updates, define an explicit update schema such as `cuisineSchema.partial()`. Use that exported update schema in both the handler and route contract so the generated client keeps fields optional.

## Verify the complete change

Run focused checks before the repository verification contract.

```powershell
npm run openapi:check
npm test -w @ff-restaurent/api
npm test
```

The API tests verify stable operation identifiers, response schemas, runtime request validation, and named OpenAPI components. The root tests also verify that generated types compose with shared domain enums.

Set `DATABASE_URL` before the full contract because Prisma loads `apps/api/prisma.config.ts` during typecheck and build:

```powershell
$env:DATABASE_URL = `
  'postgresql://postgres:postgres@localhost:5432/postgres'
npm run prettier:check
npm run lint
npm run typecheck
npm test
npm run build
```

Do not replace `npm run typecheck` with a direct `tsc` command. The script runs Prisma generation through its `pretypecheck` hook.

Database-gated integration tests and Playwright run in continuous integration (CI). State that limitation when you only run the local suites.

## Understand the CI drift gate

The main CI workflow runs `npm run openapi:check` after dependency installation and Prisma generation. A pull request fails when a developer changes runtime schemas without committing the regenerated OpenAPI or web types.

The gate lives in `.github/workflows/ci.yml` under **Verify OpenAPI and generated web transport are current**.

## Diagnose common failures

Use the failure message to identify which contract layer is out of sync:

| Failure | Cause | Resolution |
| --- | --- | --- |
| `apps/api/openapi.json is stale` | Runtime schemas changed without regeneration | Run `npm run openapi:generate`, inspect the diff, and commit the artifact |
| `apps/web/src/lib/generated/api-types.ts is stale` | The generated web contract does not match the runtime document | Regenerate and commit both generated artifacts |
| `Missing OpenAPI component` | A required named transport schema is absent | Add or restore the component in `apps/api/src/schemas/transport.ts` |
| A shared enum appears as string literals | The generator mapping does not cover the component | Update `sharedTypes` in `scripts/generate-openapi.ts`; do not patch generated output |
| A partial update requires every field | The route contract uses a create schema | Export and use a `.partial()` update schema in both locations |
| Swagger returns `401` before a validation error | Authentication runs before body validation by contract | Supply a valid JWT before testing request validation |
| Typecheck fails while loading Prisma configuration | `DATABASE_URL` is missing | Set `DATABASE_URL` and rerun `npm run typecheck` |

## Complete the developer checklist

Before opening or updating a pull request:

- [ ] Import request schemas from `apps/api/src/schemas/index.ts`
- [ ] Attach request and response schemas to every changed route
- [ ] Preserve serialized field names and nullability
- [ ] Keep shared domain enums sourced from `@ff-restaurent/shared`
- [ ] Run `npm run openapi:generate`
- [ ] Review both generated artifact diffs
- [ ] Run `npm run openapi:check`
- [ ] Run focused API tests
- [ ] Run the repository verification contract
- [ ] Confirm CI, database-gated tests, and Playwright results
