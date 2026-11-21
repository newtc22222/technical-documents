---
id: troubleshooting
title: Troubleshooting and FAQ
sidebar_label: Troubleshooting
sidebar_position: 1
description: Common backend, infrastructure, and frontend issues and solutions for Laptech Store.
---

# Troubleshooting and FAQ

## Authentication & Sessions

- **`403 Forbidden` on `POST /api/auth/refresh-token` or `POST /api/auth/logout`**
  - Cookie endpoints enforce a CSRF guard: the request must include either `X-Laptech-Client: web` or an `Origin` listed in `APP_CORS_ALLOWED_ORIGINS`.
  - Verify your HTTP client sends `X-Laptech-Client: web` and `withCredentials: true`, and that `APP_CORS_ALLOWED_ORIGINS` includes your frontend URL (e.g. `http://localhost:3000,http://localhost:5173`).
- **Refresh cookie (`laptech_rt`) not sent across domains**
  - `APP_AUTH_REFRESH_COOKIE_SAME_SITE` defaults to `Lax`. For cross-site HTTPS deployments (e.g. Vercel frontend → Railway API), set `APP_AUTH_REFRESH_COOKIE_SAME_SITE=None` (which also sets `Secure`).
- **Access token rejected immediately after password change**
  - Expected behavior: `PATCH /api/auth/me/change-password` writes `laptech:auth:revoked-before:{userId}` to Redis and updates `password_changed_at`. Clear client-side tokens and re-authenticate.
- **`400 Bad Request` on `POST /api/auth/register` or `PATCH /api/auth/me/change-password`**
  - `register` requires `gender` (`MALE`, `FEMALE`, or `NOT_MENTION`) and rejects passwords longer than 64 characters (BCrypt DoS guard).
  - `change-password` expects `oldPassword`, `newPassword`, and `confirmNewPassword` (not `currentPassword`).
- **`409 Conflict` when editing or deleting a role/permission**
  - Seeded PBAC roles (`ADMIN`, `MANAGER`, `EMPLOYEE`, `SELLER`, `USER`) and seeded permissions are locked against deletion and renaming.

## Startup, Infrastructure & Migrations

- **Service fails to start with `IllegalStateException` from `RequiredSecretsEnvironmentPostProcessor`**
  - Outside `dev`/`test`, `DB_PASSWORD`, `RABBITMQ_PASSWORD`, and `APP_JWT_SECRET` (≥ 32 raw UTF-8 bytes) are mandatory; `prod` also requires `DB_URL`, `DB_USERNAME`, `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, and `REDIS_PASSWORD`.
- **`laptech-catalog` fails to boot with missing storage configuration**
  - Set `STORAGE_PROVIDER` to `r2`, `minio`, or `local` (Cloudinary was removed in [ADR-0001](../adr/0001-cloudflare-r2-storage.md)).
- **Throttled `WARN` about Redis revocation check**
  - `REDIS_PASSWORD` may not match the compose Redis container or Redis is down. The revocation filter fails open with a throttled warning so traffic is not blackholed, while `laptech-identity` continues checking DB state.
- **Host port `3306` already bound by `mysql-laptech`**
  - Set `MYSQL_PORT` and `DB_PORT` in `.env` to a free port such as `3307`. Never stop, remove, or reuse `mysql-laptech`.
- **Flyway migration failure on an existing `ddl-auto: update` schema**
  - Baseline the existing schema at V1 (`SPRING_FLYWAY_BASELINE_ON_MIGRATE=true`) before applying prod-style Flyway migrations (`V1` + `V2`).
- **`docker compose up -d --wait` exits with code 1**
  - Expected because the one-shot `rabbitmq-definitions` importer exits 0 after importing `dev-config/rabbitmq/definitions.json`. Use `dev/up.sh` or `.\dev\up.ps1` instead.

## Checkout & Frontend Issues

- **`409` with `errorCode: "PRICE_CHANGED"` during checkout**
  - The catalog price changed after the item was added to the cart ([ADR-0002](../adr/0002-order-snapshot-and-checkout-price.md)). The cart is preserved; prompt the user to review the updated price and retry.
- **`400 Bad Request` on `GET /api/admin/orders` with status filters**
  - Do not serialize array params with axios bracket notation (`status[]`); use repeated `status=PENDING&status=CONFIRMED` params.
- **Storefront shows USD instead of VND**
  - Set `NEXT_PUBLIC_CURRENCY=VND` in `laptech-client-web-ui/.env.local` (defaults to `USD`). This also switches the Laptop Finder budget tiers to 10M–40M VND.
- **Admin production build fails `npm run check:dist`**
  - Ensure `VITE_SHOW_DEMO_FEATURES` is unset or `false` when building production bundles so demo login helpers are tree-shaken out.
