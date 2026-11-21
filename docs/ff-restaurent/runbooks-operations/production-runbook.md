---
id: production-runbook
title: Production Runbook
sidebar_label: Production Runbook
sidebar_position: 1
description: Release gates, required production configuration, session policy, deployment, launch telemetry, and rollback rehearsal.
---

# Production Runbook

## Release gates

The required `verify` check runs deterministic installation, lint, typecheck,
unit and PostgreSQL integration tests, production builds, and the three-role
Playwright smoke suite. Configure `verify` as a required status check on `main`.

Production requires:

- `DATABASE_URL`
- `JWT_SECRET` with at least 32 characters
- `JWT_EXPIRES_IN` (default `8h`)
- `CORS_ORIGINS` as a comma-separated allowlist
- `REGISTRATION_INVITE_CODE` with at least 12 characters
- `ROOT_ADMIN_USERNAME` identifying the existing account to promote when the
  database does not yet have a ROOT_ADMIN

The API deliberately fails production startup when these security controls are
missing. Demo seeding is disabled when `NODE_ENV=production`.

## Session and browser-token policy

The closed-group MVP uses an expiring bearer token in browser local storage.
Tokens expire after eight hours by default and there is no silent renewal;
users sign in again. This accepts local-storage theft risk only for the MVP, so
the web deployment must use HTTPS, avoid third-party scripts, enforce a strict
Content Security Policy, and treat every XSS finding as a credential incident.
Moving to same-site, secure, HTTP-only cookies is the preferred next hardening
step before broad public distribution.

## Deployment

Production and staging API deploys go through `.github/workflows/vps-deploy.yml`.
The web app deploys on Vercel. Names, secrets and the production `/api` proxy
are in [VPS and Vercel Hosting](./vps-and-vercel-hosting.md).

1. A push to `main` deploys production. A push to `develop` deploys staging.
   `VPS_DEPLOY_ENABLED` must be `true`.
2. The workflow verifies the SHA, builds
   `ghcr.io/newtc22222/ff-restaurent-api:<sha>` from the Dockerfile `vps`
   target, then runs `deploy ff <prod|stg> <sha>` on the VPS.
3. Before the new API starts, the server runs `npm run release:run` in that
   image. `apps/api/scripts/run-release-job.sh` applies migrations, the cuisine
   and badge seeds, the phone backfill, the root-admin bootstrap, and
   notification pruning. Never run the destructive demo seed in production.
4. A non-zero SSH status means the deploy failed and the server has already
   rolled back.
5. Confirm `GET /health` and `GET /ready`, then the Vercel web app.
6. Run `npm run smoke` with staging URLs and a least-privileged smoke account
   before treating a staging deploy as promotable.

Do not build a production web image. `VITE_API_URL` is a Vercel build variable.

## Launch telemetry

Fastify request logs provide method, path, status, latency, and request IDs.
The API also emits structured events for `login_succeeded`, `bill_created`,
`payment_status_changed`, and `request_failure`. Alert on readiness failures,
repeated authentication failures/rate limits, and elevated 5xx responses.
Never log credentials, invite codes, JWTs, or request authorization headers.

## Backups and restore drills

`main` does not contain `.github/workflows/backup-restore-drill.yml`. That
workflow read Cloud SQL. The VPS runs its own nightly backup and a weekly
`restore-drill.sh` that restores the newest R2 dump into scratch databases.
The drill lives on the server, not in this repository.

Record each successful drill date, source dump, and operator in the release
record. A failed drill blocks promotion. Do not copy database URLs or dump
contents into the wiki.

## Rollback rehearsal

Before promotion, record the current API image digest and the Vercel
deployment.

1. Stop promotion and preserve failure logs and request IDs.
2. If the migration is backward-compatible, deploy the previous API image SHA.
   A failed `release:run` already rolls the VPS deploy back.
3. If data restoration is required, stop writes, restore the pre-release
   backup, verify `_prisma_migrations` and row counts, then point
   `DATABASE_URL` at the restored database.
4. Verify `/ready`, login, bill visibility, payment state, notifications, and
   role administration.
5. Document the incident and ship a forward migration. Do not run
   `migrate dev` or delete production migration records.

## Hosting

The API runs in Docker Compose behind Caddy on a VPS. The web app runs on
Vercel, and production proxies `/api` through Vercel. See
[VPS and Vercel Hosting](./vps-and-vercel-hosting.md).

`main` (`14d09c6`) does not contain `render.yaml`, `gcp-deploy.yml`,
`gcp-foundation-verify.yml`, `backup-restore-drill.yml`, or the GCP and Render
operator scripts. `develop` still has some of those files. Do not run them
against production. The [GCP Foundation](../deployment-infrastructure/gcp-foundation.md) page is the historical
record of that platform.
