---
title: DevOps
sidebar_label: DevOps
sidebar_position: 5
---

## Infrastructure & Environments

Laptech runs as a distributed Spring Boot backend (`laptech-api`, 8 runnable services + `laptech-common`) paired with two web frontends (`laptech-client-web-ui` on Vercel, `laptech-admin-web-ui` on Vercel / static host, and preview environments on Railway).

## Local Infrastructure (Docker Compose)

Image versions (`mysql:9.4.0`, `redis:7.4.11`, `rabbitmq:4.1.8-management`, Mailpit, Adminer, `bitnamilegacy/minio`), host ports, credentials, and the start sequence are on the [Local setup](../setup/local-setup.md) page. Use `dev/up.ps1` on Windows or `dev/up.sh` in WSL. Those scripts wait until the long-running services are healthy, then run the one-shot `rabbitmq-definitions` importer (`dev-config/rabbitmq/definitions.json`). A bare `docker compose up -d --wait` returns exit code 1 after that importer exits 0.

Host port `3306` may already be taken by a container named `mysql-laptech`. Set `MYSQL_PORT` and `DB_PORT` to a free port. Never stop, remove, or reuse `mysql-laptech`.

## CI/CD & Branch Flow

- **Branch flow:** Feature/fix branches merge into `develop`; release branches promote `develop` → `main` (enforced by `flow-guard` in GitLab CI).
- **`laptech-api` CI:** `flow-guard`, `compile`, `package`, and `test` (with `docker:dind` for Testcontainers `mysql:9.4`).
- **`laptech-client-web-ui` CI:** Lint, TypeScript check, Vitest unit tests, Playwright E2E (mocked API on `:3100`), and Next.js production build.
- **`laptech-admin-web-ui` CI:** `npm run typecheck` (TypeScript 7 native), ESLint 10, Vitest, production Vite build, and `npm run check:dist` (ensures `VITE_SHOW_DEMO_FEATURES` demo helpers are absent from production bundles).

## Database Migrations (Flyway)

- **Production:** Flyway enabled (`V1` baseline + `V2` migrations per service) with `ddl-auto: validate`.
- **Existing pre-Flyway schemas:** Baseline at V1 (`SPRING_FLYWAY_BASELINE_ON_MIGRATE=true`) before running prod-style migrations. See `docs/runbook-flyway-v2-tag-slug.md` in `laptech-api` for the catalog V2 runbook.
- **Dev:** Flyway off with Hibernate `ddl-auto: update`.

## Port Assignments

| Port | Service |
| --- | --- |
| `8080` | API Gateway (`laptech-gateway`, owns CORS + aggregated Swagger UI) |
| `8081` | Identity Service (`laptech-identity`) |
| `8092` | Catalog Service (`laptech-catalog`) |
| `8083` | Inventory Service (`laptech-inventory`) |
| `8084` | Order Service (`laptech-order`) |
| `8085` | Payment Service (`laptech-payment`) |
| `8086` | Promotion Service (`laptech-promotion`) |
| `8087` | Content Service (`laptech-content`) |

Compose host ports (MySQL, Redis, RabbitMQ, Mailpit, Adminer `8090`, MinIO `9000`/`9001`) are listed on [Local setup](../setup/local-setup.md).

## Secrets & Security Configuration

Keep `.env` git-ignored and never write secret values into docs or the wiki.

- **Fail-fast secrets (`RequiredSecretsEnvironmentPostProcessor`):**
  - Non-`dev`/`test` profiles require `DB_PASSWORD`, `RABBITMQ_PASSWORD`, and `APP_JWT_SECRET` (≥ 32 raw UTF-8 bytes).
  - `prod` additionally requires `DB_URL`, `DB_USERNAME`, `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, and `REDIS_PASSWORD`.
- **CORS & Cookies:** Configure `APP_CORS_ALLOWED_ORIGINS` with exact frontend origins and set `APP_AUTH_REFRESH_COOKIE_SAME_SITE=None` (adds `Secure`) for cross-site HTTPS deployments.
- **Object Storage:** Set `STORAGE_PROVIDER=r2` in production (bucket `laptech-store-media`, key prefix `laptech/`, 5 MiB cap; see [ADR-0001](../adr/0001-cloudflare-r2-storage.md)).
