---
id: domain-cutover
title: "Domain Cutover: lingu-flow.com + Staging"
sidebar_label: Domain Cutover
sidebar_position: 3
description: How LinguFlow is previewed without a custom domain and the checklist to move production onto lingu-flow.com.
---

# Domain cutover: `lingu-flow.com` + staging

How LinguFlow is previewed **this week** (no custom domain), and the checklist to move production onto **`lingu-flow.com`** later.

There is no `lingu-flow.vercel.com`. Vercel’s default host is **`.vercel.app`**.

---

## This week (no custom domain)

| Role | Git | Frontend | API + DB |
|---|---|---|---|
| **Production (stable)** | `main` | `https://lingu-flow.vercel.app` | `https://lingu-flow-production.up.railway.app` |
| **Staging (next version)** | `staging` | Vercel Preview: `https://lingu-flow-git-staging-phi-vos-projects.vercel.app` | `https://lingu-flow-staging.up.railway.app` |

### How to ship a preview

1. Branch from `staging` (or commit on `staging`).
2. Push. Vercel builds a Preview; Railway `staging` deploys the `staging` branch.
3. Open the Preview URL. `/api/*` is rewritten to **staging** Railway (host is not a production alias).
4. When it is stable, merge `staging` → `main`. Production Vercel hosts keep talking to production Railway.

Do **not** merge `staging` into `main` until you intend to release.

### How the API rewrite works

`frontend/vercel.json` is host-based:

- `lingu-flow.vercel.app`, `lingu-flow-phi-vos-projects.vercel.app`, and `lingu-flow-git-main-phi-vos-projects.vercel.app` → production Railway
- every other host (PR previews, `staging` branch) → staging Railway

The SPA still calls relative `/api/...` (same origin). CORS on Railway is a backstop for direct API hits.

### Railway staging

- Environment: `staging` (duplicate of production; **own Postgres**)
- Service domain: `https://lingu-flow-staging.up.railway.app`
- `ENVIRONMENT=staging` (JWT + seed guards treat this like production)
- Distinct `JWT_SECRET` from production so tokens do not cross environments
- R2 bucket is currently **shared** with production — do not treat staging media as isolated

Other feature-branch previews still hit the **production** API until those branches include this `vercel.json` (or you merge `staging` → `main`).

---

## Later: `lingu-flow.com` production, `lingu-flow.vercel.app` staging

`lingu-flow.com` is available (~$11/year at typical registrars). `linguflow.com` is taken.

Target after cutover:

| Role | Domain | Vercel assignment | Railway |
|---|---|---|---|
| Production | `https://lingu-flow.com` (+ `www` if you want it) | Production / `main` | `lingu-flow-production.up.railway.app` |
| Staging | `https://lingu-flow.vercel.app` | Git branch `staging` | `lingu-flow-staging.up.railway.app` |

### Cutover checklist (do not run until you buy the domain)

1. **Buy** `lingu-flow.com` at [Cloudflare Registrar](https://domains.cloudflare.com) (at-cost renewals) or [Vercel Domains](https://vercel.com/domains/search?q=lingu-flow.com).
2. **Vercel → lingu-flow → Settings → Domains**
   - Add `lingu-flow.com` (and `www.lingu-flow.com` → redirect to apex).
   - Leave it on the **Production** branch (`main`).
   - Edit `lingu-flow.vercel.app` → assign to Git branch **`staging`**.  
     Until you do this, `.vercel.app` still serves production.
3. **`frontend/vercel.json`**
   - Add a host rule for `lingu-flow.com` (and `www` if it serves the app) → production Railway.
   - **Remove** the `lingu-flow.vercel.app` host rule so that host falls through to staging Railway.
   - Keep the `lingu-flow-git-main-…` / team aliases on production only if you still want those URLs to hit prod.
4. **Railway CORS (both envs)**
   - Production `CORS_ORIGINS`: add `https://lingu-flow.com`.
   - Staging `CORS_ORIGINS`: add `https://lingu-flow.vercel.app` (already the default).
   - Regex that matches every Vercel alias: `https://lingu-flow(?:-[a-z0-9-]+)?\.vercel\.app`
5. **Auth / OAuth**
   - If Google OAuth is enabled, add `https://lingu-flow.com` (and keep the Vercel origin) in the Google Cloud authorized origins / redirect URIs.
6. **Cloudflare R2 CORS**
   - Allow `https://lingu-flow.com` (and keep `https://lingu-flow.vercel.app`) for `PUT` / `GET`.
7. **Verify before announcing**
   - `https://lingu-flow.com/api/health` → production
   - `https://lingu-flow.vercel.app/api/health` → staging (`environment` in the JSON should be `staging`)
   - Log in on each host; a production token must **not** work on staging.
8. **DNS / SEO**
   - Optional: 308 leftover marketing links to `.com`.
   - Update [Deployment & DevOps Guide](./deployment-guide.md) and `DEPLOYMENT.md` once `.com` is live.

Hobby Vercel is enough: assign a domain to a Git branch. Pro Custom Environments are optional.

---

## Related

- [Deployment & DevOps Guide](./deployment-guide.md)
