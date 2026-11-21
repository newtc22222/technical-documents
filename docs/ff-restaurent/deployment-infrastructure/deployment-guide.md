---
id: deployment-guide
title: Deployment Guide
sidebar_label: Deployment Guide
sidebar_position: 1
description: Preparation work and deployment-stage steps for releasing FF RESTaurent.
---

# Deployment Guide

:::warning

**Partly outdated.** The Cloud Run, Cloud SQL and Render sections describe hosting that has been removed. The API now deploys to a VPS and the web app to Vercel; see [VPS and Vercel Hosting](../runbooks-operations/vps-and-vercel-hosting.md). The CI, environment and readiness notes still apply in general.

:::

This guide lists the preparation work and deployment-stage steps for releasing FF RESTaurent. It assumes the current monorepo layout:

- `apps/api` - Fastify API, Prisma, PostgreSQL, JWT auth
- `apps/web` - React/Vite frontend served as static files
- `packages/shared` - shared TypeScript types and bill-splitting logic

---

## Deployment Targets

The app can be deployed as:

- A Docker Compose stack on a VPS, running Postgres, API, and web containers together.
- A split deployment, with Postgres on a managed database, the API on a Node/container host, and the web app on a static host or CDN.

The repository includes:

- `apps/api/Dockerfile` (`vps` target; this is the production API image)
- `apps/web/Dockerfile` (Compose or a local web image; production web does not use it)
- `apps/web/vercel.json`
- `docker-compose.yml` (local stack)
- `.github/workflows/ci.yml`
- `.github/workflows/vps-deploy.yml`

`render.yaml` is obsolete. `main` has deleted it. `develop` may still contain the file.

## Current production path

Production does not use the Compose stack or a web image. The API image and the Vercel project are specified in [VPS and Vercel Hosting](../runbooks-operations/vps-and-vercel-hosting.md). The checklist below is the release procedure for that path. `docker-compose.yml` is for local runs.

---

## Prepare Before Deployment

### 1. Confirm environment

Production values live on the VPS and in the Vercel project, never in Git. The names and the rules for `TRUSTED_PROXIES` and `EDGE_PROXY_SECRET` are in [VPS and Vercel Hosting](../runbooks-operations/vps-and-vercel-hosting.md).

The API image sets `PORT=8080` and `NODE_ENV=production`. Do not set `API_PORT` on the VPS. `API_PORT` is the local Compose port (`4000`). `VITE_API_URL` is a Vercel build variable. Changing it requires a new Vercel deployment.

`JWT_SECRET` must be at least 32 characters. Rotating it invalidates existing sessions.

### 2. Review the database

Before a release that includes migrations:

1. Confirm migration files are committed under `apps/api/prisma/migrations`.
2. Back up the production database. The VPS nightly backup is the operator backup. It is not a GitHub workflow.
3. Read the migration for destructive changes. Prisma migrations are forward-only unless a tested rollback script is in the migration directory.

Do not run `prisma migrate dev` against production. The release job runs `prisma migrate deploy`.

### 3. Run the same checks CI runs

From the repository root, with Node.js 22:

```bash
npm ci
npm run build -w @ff-restaurent/shared
npm run prettier:check
npm run lint
npm run prisma:generate -w @ff-restaurent/api
npm run openapi:check
npm run typecheck
npm test
npm run build
```

Rebuild `@ff-restaurent/shared` before the API or web build when shared code changes. Both production builds use the compiled package.

`docker compose up --build` is the local stack only. Its API command migrates, loads demo data when `NODE_ENV` is not `production`, then runs the cuisine seed, badge seed, phone backfill, and root bootstrap. Production never runs the demo seed.

To build the production API image locally:

```bash
docker build -f apps/api/Dockerfile --target vps -t ff-api:local .
```

Do not build `apps/web/Dockerfile` for a production release. That image is the Compose web container.

---

## Release checklist

### 1. Freeze the SHA

Deploy a commit on `main` for production or on `develop` for staging. The API image tag is the 40-character git SHA:

```text
ghcr.io/newtc22222/ff-restaurent-api:<sha>
```

There is no production web image.

### 2. Let the workflows deploy

A push to `main` deploys production. A push to `develop` deploys staging. `VPS_DEPLOY_ENABLED` must be `true`.

`.github/workflows/vps-deploy.yml` verifies the tree, builds the `vps` target, pushes the image, and runs `deploy ff <prod|stg> <sha>` on the VPS. Vercel builds the web app from the same push when the project is connected to that branch.

Before the new API process starts, the server runs `npm run release:run`. `apps/api/scripts/run-release-job.sh` does, in order:

1. `prisma migrate deploy`
2. popular-cuisine seed
3. honor-badge seed
4. phone backfill
5. root-admin bootstrap
6. notification pruning

A non-zero SSH status means the deploy failed and the server has already rolled back.

### 3. Smoke-check

```bash
curl https://api.ff-restaurent.com/health
curl https://api.ff-restaurent.com/ready
```

`/health` is liveness. `/ready` checks the database. Then confirm:

- The Vercel app loads over HTTPS.
- Login works for a real account.
- The bills list loads.
- A user can view their own bill shares.
- A payment status update persists after refresh.

`npm run smoke` runs `scripts/staging-smoke.mjs`. Set `API_URL` and `WEB_URL`. When the script should sign in, also set `SMOKE_USERNAME` and `SMOKE_PASSWORD` for a least-privileged account. The script does not refuse a production URL. Point it at staging unless the check is meant to hit production.

### 4. Watch the release

Watch API restarts, migration errors, database connection errors, CORS failures, 4xx and 5xx spikes, and Vercel asset failures. Keep `/health` on an uptime check.

### 5. Roll back

1. Deploy the previous API image SHA. A failed release job already rolls the VPS deploy back.
2. Restore the pre-release backup only when the migration changed data in a way the old API cannot read.
3. Re-run the smoke checks.
4. Record the SHA, the migration name, and the error. Ship a forward migration. Do not delete production rows from `_prisma_migrations`.

---

## CI

`.github/workflows/ci.yml` runs on pull requests and on pushes to `main`. The `verify` job uses Node.js 22 and PostgreSQL 16. On both `develop` and `main` the job:

1. `npm ci`
2. `npm run agents:verify`
3. Builds `@ff-restaurent/shared`
4. `npm run prettier:check` and `npm run lint`
5. `npm run prisma:generate` for the API
6. `npm run openapi:check`
7. `npm run typecheck`
8. `scripts/verify-phase2-contract-migration.sh`
9. `npm run prisma:migrate:deploy` against the CI database
10. `scripts/capture-production-baseline.test.sh`
11. `npm run prisma:phase2:contract:verify` and `npm run prisma:indexes:verify`
12. `scripts/run-release-job.test.sh`
13. `npm test` and `npm run build`
14. Playwright `npm run test:e2e`

`develop` also runs `scripts/rehearse-gcp-migration.test.sh` and `scripts/rehearse-gcp-migration.integration.test.sh`. Those steps and scripts are not on `main`.

> **Prisma tooling scope.** This project uses only the standard Prisma CLI (`prisma generate` and `prisma migrate deploy`) against PostgreSQL (`DATABASE_URL`). The web app is deployed on Vercel. The hosted Prisma Postgres / Prisma Compute GitHub App check is not used and must not be re-enabled. If that check reappears, remove the Prisma GitHub App's access to this repo and drop it from the branch protection required-checks list. It is not defined by any workflow in this repository.

Deploy secrets are the `VPS_HOST`, `VPS_SSH_KEY`, and `VPS_KNOWN_HOSTS` environment secrets, plus `VPS_DEPLOY_ENABLED`. They are not repository secrets. The workflow's `GITHUB_TOKEN` pushes and pulls the API image. Do not print secret values in logs.

The workflow file refuses a production deploy that is not on `main`, and a staging deploy that is not on `develop` or `main`. It selects the `production` or `Staging` GitHub environment. The file does not define an approval job. Required reviewers, if any, are set on those environments in GitHub. The production SSH key is pinned to `deploy ff prod`. See [VPS and Vercel Hosting](../runbooks-operations/vps-and-vercel-hosting.md).

---

## Production readiness

Before handling real user data, confirm:

- HTTPS is on for the Vercel app and the API.
- `CORS_ORIGINS` lists only the real web origins.
- The VPS nightly backup and the weekly restore drill have a recorded success.
- Logs are kept off the container filesystem. The API and the release step write only to `/tmp` and `/home/node`, so the container can run with a read-only root when those paths are writable.
- `JWT_SECRET` is only in the server env file.
- `/api/docs` is exposed only if that environment should publish the API contract.
- Demo seed data is not loaded. The release job does not run `prisma/seed/seed-if-empty.ts`.
