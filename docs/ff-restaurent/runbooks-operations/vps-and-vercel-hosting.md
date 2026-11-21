---
id: vps-and-vercel-hosting
title: VPS and Vercel Hosting
sidebar_label: VPS and Vercel Hosting
sidebar_position: 10
description: Current hosting, with the API in Docker Compose behind Caddy on a VPS, the web app on Vercel, the deploy workflow, trusted proxies, and backups.
---

# VPS and Vercel Hosting

The API runs in a Docker Compose stack behind Caddy on a VPS; the web app runs on Vercel. The API moved from GCP Cloud Run on 2026-10-17, and the GCP and Render deploy code was removed on 2026-10-20. This page summarizes what lives in the repository. The authoritative, detailed version is [`docs/deploy-vps.md`](https://github.com/newtc22222/ff-restaurent/blob/develop/docs/deploy-vps.md); the server side (Compose, Caddy, `ci-entry.sh`, rollback) is outside the repository.

## API image

- `ghcr.io/newtc22222/ff-restaurent-api:<40-character git SHA>`, built from `apps/api/Dockerfile` with `--target vps` (now the final stage) for `linux/amd64`.
- Runs `node dist/server.js` on port 8080 as the non-root `node` user. Liveness is `GET /health`; readiness (database) is `GET /ready`.
- Before the new API starts, the release step runs in the same image: `docker compose run --rm --no-deps ff-api npm run release:run` (`prisma migrate deploy`, cuisine and badge seeds, phone backfill, root-admin bootstrap, notification pruning).
- The app tree is read-only; only `/tmp` and `/home/node` are written.

## Environments and deploys

`.github/workflows/vps-deploy.yml`:

| Trigger | Target | GitHub environment |
| --- | --- | --- |
| push to `develop` | `stg` | `Staging` |
| push to `main` | `prod` | `production` |
| manual `target: stg` | `stg` | `Staging` (only from `develop` or `main`) |
| manual `target: prod` | `prod` | `production` (only from `main`) |

Jobs: `verify` (install, build shared, lint, typecheck, test, build), `build` (push the image to GHCR), `deploy` (SSH as `deploy@$VPS_HOST`, one command `deploy ff <stg|prod> <sha>`). A non-zero SSH exit means the deploy failed and the server already rolled back. Runs for one target never overlap.

`VPS_HOST`, `VPS_SSH_KEY` and `VPS_KNOWN_HOSTS` are **environment** secrets, with a different key per environment pinned to its own target by a forced command; the variable `VPS_DEPLOY_ENABLED=true` turns the workflow on. Third-party actions are pinned to commit SHAs.

## Proxy and client IP

- Caddy is the only reverse proxy, at `172.30.0.10` on the Docker network `edge`. Set `TRUSTED_PROXIES=172.30.0.10`; never set `TRUST_PROXY_HOPS` (it overrides). Without it the API logs `trust_proxy_missing` at boot.
- `EDGE_PROXY_SECRET` (32+ characters, same value on the server for `ff-prod` and in the Vercel Production project): `apps/web/middleware.ts` signs `x-ff-client-ip`, `x-ff-proxy-ts` and `x-ff-proxy-sig`, and `apps/api/src/http/client-ip.ts` trusts the IP only for a valid signature under a minute old. Leave it unset on staging.

## Web on Vercel

Root Directory `apps/web`, Vite preset, Node 22.x, install `cd ../.. && npm ci`, build `cd ../.. && npm run build -w @ff-restaurent/shared && npm run build -w @ff-restaurent/web`, output `dist`. Everything outside `/assets/` falls back to `index.html`; `/assets/*` is cached immutable, everything else `no-cache`. `VITE_API_URL` and the `VITE_FIREBASE_*` values are build-time, public and baked in.

## Backups

The VPS runs its own nightly backup and a weekly `restore-drill.sh` that restores the newest R2 dump into scratch databases. The old GitHub `Backup restore drill` workflow (Cloud SQL) was removed.

## Performance checks

Read-only checks for the VPS (trusted proxy, table sizes, connections, lost push deliveries, Caddy timeouts, endpoint timing) are in the repository's `docs/vps-performance-checks.md`. They replace the Cloud Run and Cloud SQL steps in [Production Measurements](./production-measurements.md).
