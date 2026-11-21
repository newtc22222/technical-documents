---
id: domain-cutover
title: "Domains and Staging"
sidebar_label: "Domains and Staging"
sidebar_position: 3
description: "The phivo.dev and vercel.app hosts per environment, how a change reaches staging and production, and what a domain move touches."
---

# Domains and staging

Which host serves each environment, how a change reaches staging and then production, and what a further domain move (for example to `lingu-flow.com`) would touch.

There is no `lingu-flow.vercel.com`. Vercel’s default host is **`.vercel.app`**.

---

## Hosts today

The web app is on Vercel and the API on the VPS behind Caddy (see the [Deployment & DevOps Guide](./deployment-guide.md)). The phivo.dev domains replaced the Railway origins (`lingu-flow-production.up.railway.app`, `lingu-flow-staging.up.railway.app`), which no longer answer.

| Role | Git | Web (Vercel) | API + DB (VPS) |
| --- | --- | --- | --- |
| **Production** | `main` | `https://lingu.phivo.dev`, `https://lingu-flow.vercel.app` | `https://lingu-api.phivo.dev` |
| **Staging** | `staging` | `https://lingu-staging.phivo.dev`, Vercel Preview (`https://lingu-flow-git-staging-phi-vos-projects.vercel.app`) | `https://lingu-api-staging.phivo.dev` |

The staging API answers only requests that carry the right `X-Staging-Key` (Caddy checks it). Staging builds send it from `VITE_STAGING_ACCESS_KEY`, and only to the staging API.

### How to ship a change

1. Branch from `staging` and open a pull request into `staging`.
2. Merge it. Vercel builds a Preview of `staging`, and the [VPS deploy](./vps-deploy.md) workflow deploys `lf-api-stg` when `backend/**` changed.
3. Check it on `https://lingu-staging.phivo.dev`.
4. Release: a `release/x.y.z` branch bumps the version and merges into `main`. Vercel deploys Production and the workflow deploys `lf-api`. Then merge `main` back into `staging` and tag the release.

Do **not** merge `staging` into `main` until you intend to release.

### How a page picks its API

`apiUrl` in `frontend/src/utils/api.ts` decides per page:

- **phivo.dev pages** call the API on the same domain (`lingu.phivo.dev` → `lingu-api.phivo.dev`, `lingu-staging.phivo.dev` → `lingu-api-staging.phivo.dev`). The map is `API_BASE_BY_HOST`.
- **`*.vercel.app` pages** whose build points `VITE_API_BASE_URL` at the production or staging API call their own origin (`/api`, `/api-staging`), and Vercel forwards the request. Some networks block phivo.dev by host name; this path keeps the app usable there. The environment comes from the build, so a staging page is never proxied to production.
- **Any other host** calls `VITE_API_BASE_URL` directly.

| Vercel environment | `VITE_API_BASE_URL` |
| --- | --- |
| Production (`main`) | `https://lingu-api.phivo.dev` |
| Preview, including the `staging` branch | `https://lingu-api-staging.phivo.dev` |

The variable is read at **build** time, so a change needs a redeploy. A feature-branch Preview uses the Preview value, so it talks to staging, never to production.

### CORS

Direct calls from the phivo.dev pages are cross-origin, so the API's CORS settings must list those hosts. Proxied vercel.app calls are same-origin and do not need CORS.

- `CORS_ORIGINS` is a JSON array and **replaces** the built-in list when set. Include the phivo.dev web host of that environment, plus `https://lingu-flow.vercel.app` on production.
- `CORS_ORIGIN_REGEX` = `https://lingu-flow(?:-[a-z0-9-]+)?-phi-vos-projects\.vercel\.app`. The built-in regex (`https://lingu-flow(?:-[a-z0-9-]+)?\.vercel\.app`) also matches other people's Vercel projects named `lingu-flow-*`.
- Preflights are cached for 2 hours (`max_age=7200` in `backend/app/main.py`).

---

## Moving to another domain

What a move to a new production domain (for example `lingu-flow.com` for the web app and `api.lingu-flow.com` for the API) touches. Hobby Vercel is enough: assign a domain to a Git branch.

1. **Vercel:** add the web domain to the project, on the Production branch (`main`).
2. **Caddy on the VPS:** add a site for the new API host that proxies to `lf-api`, next to the existing one.
3. **Frontend code:** add the new web host to `API_BASE_BY_HOST` in `frontend/src/utils/api.ts` so its pages call the new API host. To proxy `*.vercel.app` pages to the new API as well, change `PRODUCTION_API_ORIGIN` in `src/utils/apiOrigins.ts`, `frontend/middleware.ts` and the rewrite in `frontend/vercel.json` together (`src/utils/vercelProxy.test.ts` fails if they drift), and add the host to the report-only CSP `connect-src` in `vercel.json`.
4. **Build variable:** set Production `VITE_API_BASE_URL` to the new API origin and redeploy.
5. **API CORS:** add the new web origin to `CORS_ORIGINS`, and keep the hosts that still serve the app.
6. **Auth / OAuth:** if Google sign-in is on, add the new web origin to the Google Cloud authorized origins.
7. **Cloudflare R2 CORS:** allow the new web origin for `PUT` / `GET`.
8. **Verify before announcing:**
   - `GET https://<new-api-host>/api/health` reports `"environment":"production"` and the current version.
   - Sign in on the new host and on `https://lingu-flow.vercel.app`; upload a card image; open the notification bell.
   - Confirm a production token does **not** work on staging.
9. **Docs:** update the [Deployment & DevOps Guide](./deployment-guide.md) and this page.

---

## Related

- [Deployment & DevOps Guide](./deployment-guide.md)
- [VPS deploy](./vps-deploy.md) — the workflow that deploys `lf-api` and `lf-api-stg`
- Build variables: `frontend/.env.example`. Proxy rewrites and cache headers: `frontend/vercel.json`. Proxy secret: `frontend/middleware.ts`
