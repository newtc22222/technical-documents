---
id: vps-deploy
title: "VPS Deploy"
sidebar_label: "VPS Deploy"
sidebar_position: 2
description: "The GitHub Actions workflow that builds the API image to GHCR and deploys it to the VPS over SSH."
---

# VPS deploy

How GitHub Actions builds the API image and deploys it to the VPS. The workflow is [`.github/workflows/vps-deploy.yml`](https://github.com/newtc22222/lingu-flow/blob/staging/.github/workflows/vps-deploy.yml). A short pointer sits beside it in [`.github/vps-deploy.md`](https://github.com/newtc22222/lingu-flow/blob/staging/.github/vps-deploy.md).

**This is the production deploy path.** The repository variable `VPS_DEPLOY_ENABLED` has been `true` since 2026-10-14; Railway no longer hosts the API. Production answers at `https://lingu-api.phivo.dev` and staging at `https://lingu-api-staging.phivo.dev`. How the SPA reaches them is in the [Deployment & DevOps Guide](./deployment-guide.md).

Setting `VPS_DEPLOY_ENABLED` to anything but `true` skips every job, which is the switch to stop deploys. On a new repository, create the two GitHub environments below, with their branch rules, **before** setting it: GitHub creates a missing environment on first use with no protection.

---

## What a run does

The workflow builds `ghcr.io/newtc22222/lingu-flow-api:<full git sha>` from `backend/Dockerfile` (context `backend/`, `linux/amd64`) and deploys that image over SSH. On the server it runs in Docker Compose behind Caddy, next to that environment's PostgreSQL. The compose file, the API's environment file, the host cron for the jobs under `backend/app/jobs/`, and `ci-entry.sh` live on the server. This repository only holds the workflow that calls them.

| Trigger | Target | Compose service |
| :--- | :--- | :--- |
| Push to `staging` under `backend/**` or this workflow file | `stg` | `lf-api-stg` |
| Push to `main` under `backend/**` or this workflow file | `prod` | `lf-api` |
| `workflow_dispatch` from `staging` or `main` with `target: stg` | `stg` | `lf-api-stg` |
| `workflow_dispatch` from `main` with `target: prod` | `prod` | `lf-api` |

A dispatch from any other branch is refused in the first job, before anything is built. Unreviewed feature-branch code never reaches the shared VPS or the staging secrets. `prod` is refused unless the ref is `main`. `stg` is refused unless the ref is `staging` or `main`.

Pushes that do not touch `backend/**` or `.github/workflows/vps-deploy.yml` do not start a run.

---

## Jobs

Runners are `ubuntu-24.04`. Third-party actions are pinned to full commit SHAs, because the build job holds `packages: write`.

| Job | Timeout | What it does |
| :--- | :--- | :--- |
| Pick target | 5 min | Chooses `stg` or `prod` and checks the branch rule and that `GITHUB_SHA` is 40 hex characters. |
| Backend tests | 20 min | `python -m pytest -q` in `backend/` on SQLite. Postgres-marked tests skip. |
| Build and push | 30 min | Pushes one plain image manifest tagged with the full sha. Provenance attestations are off, so the server's `docker pull` does not have to choose among manifests. Cache scope is `lf-api`. |
| Deploy | 15 min | SSH as `deploy@$VPS_HOST`. One deploy per target at a time (`vps-deploy-stg` or `vps-deploy-prod`). A running deploy is not cancelled. |

The deploy job is the only job that receives the VPS secrets. It selects the GitHub environment `vps-production` when the target is `prod`, otherwise `vps-staging`.

The image tag is the full git sha, not a moving tag. `GITHUB_TOKEN` pushes the image to GHCR and is handed to the server on stdin so the server can pull that image. The token expires when the deploy job ends. It is never placed on the command line.

The SSH command is exactly:

```text
deploy lf <stg|prod> <sha>
```

The server's forced command, `ci-entry.sh`, accepts only that command. The SSH exit code is the deploy result. The client pins the host key (`StrictHostKeyChecking=yes`) and ignores the runner's global known hosts (`GlobalKnownHostsFile=/dev/null`). The key file is removed at the end of the job, including when the deploy fails.

---

## Environments and secrets

The deploy secrets are **environment secrets, not repository secrets**. The existing `Preview` and `Production` environments belong to the Vercel integration (and, before the cutover, Railway's), so this workflow uses its own names.

| Environment | Target | Deployment branch rule |
| :--- | :--- | :--- |
| `vps-staging` | `stg` | `staging` and `main` only |
| `vps-production` | `prod` | `main` only (required reviewers are optional) |

Each environment holds:

| Secret | Value |
| :--- | :--- |
| `VPS_HOST` | VPS host name or IP. SSH is on port 22. The host field of `VPS_KNOWN_HOSTS` must match this value. |
| `VPS_SSH_KEY` | Private key of the `deploy` user. **A different key in each environment.** |
| `VPS_KNOWN_HOSTS` | The server's `known_hosts` line or lines. The host key is pinned. It is never auto-accepted. |

| Repository variable | Value |
| :--- | :--- |
| `VPS_DEPLOY_ENABLED` | `true` to enable every job. Anything else, including unset, skips the run. |

---

## Deploy keys

The VPS uses one deploy key per project and target, four in all. `ci-entry.sh` pins each key to a single command.

| Key | Allowed command |
| :--- | :--- |
| LinguFlow staging (the `vps-staging` secret) | `deploy lf stg <sha>` |
| LinguFlow production (the `vps-production` secret) | `deploy lf prod <sha>` |
| FF RESTaurent staging | that project's staging target only |
| FF RESTaurent production | that project's production target only |

A leaked LinguFlow staging key cannot deploy LinguFlow production, and neither project's key can deploy the other project.

---

## API settings on the VPS

These are the settings the image expects once it is the process behind Caddy. Names and defaults are in `backend/.env.example` and `backend/app/config.py`.

- **`TRUSTED_PROXY_COUNT=1`.** The path is browser, then Caddy, then the app. Caddy replaces `X-Forwarded-For` with the client address, so the app sees one entry and a browser-supplied value never arrives. The login rate limiter keys on the right-most trusted hop. Do not publish the API port past Caddy: a client that talks to the app directly can set the header itself.
- **`CORS_ORIGIN_REGEX` should be team-scoped** in a deployed environment: `https://lingu-flow(?:-[a-z0-9-]+)?-phi-vos-projects\.vercel\.app`. The production alias `https://lingu-flow.vercel.app` then comes from `CORS_ORIGINS`. The built-in regex (`https://lingu-flow(?:-[a-z0-9-]+)?\.vercel\.app`) also matches other people's Vercel projects named `lingu-flow-*`. The tighter pattern is narrower, not airtight: a project someone else names `lingu-flow-<x>-phi-vos-projects` still matches through its own production domain. A custom frontend domain listed in `CORS_ORIGINS` avoids that.
- **Preflights.** The SPA calls the API cross-origin, and every authenticated call carries `Authorization`, so each one needs a preflight. `max_age=7200` in `backend/app/main.py` lets the browser reuse a preflight for 2 hours (Chromium's ceiling).

- **`VERCEL_PROXY_SECRET`** (optional, 16+ characters, different per environment) must equal `LF_PROXY_SECRET` on the matching Vercel environment. Requests that `*.vercel.app` pages proxy through Vercel then carry the real client address, and per-IP limits and `users.last_ip` see the user instead of Vercel.

Frontend build variables (`VITE_API_BASE_URL`, `VITE_STAGING_ACCESS_KEY` for staging, optional `VITE_STREAM_BASE_URL` and `VITE_GOOGLE_CLIENT_ID`) are in `frontend/.env.example` and in the [Deployment & DevOps Guide](./deployment-guide.md).

---

## Related

- [Deployment & DevOps Guide](./deployment-guide.md) — current production (Vercel + VPS) and how the SPA reaches the API
- [Domains and staging](./domain-cutover.md) — host names per environment and the move to the phivo.dev domains
