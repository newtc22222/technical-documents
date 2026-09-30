---
id: local-setup
title: Local setup
sidebar_label: Local setup
sidebar_position: 0
description: Current local setup for the Laptech multi-module API on this Windows machine, with WSL Ubuntu and the laptech-dev compose stack.
---

This page is the current local setup for the Laptech API. Commands come from the API repository: `docs/local-stack.md`, `docs/testing-integration.md`, and the `dev/` scripts. Run them from a clone of that repository.

## Prerequisites

This machine is Windows. Use the PowerShell scripts (`dev/*.ps1`) from PowerShell, and WSL Ubuntu for Java, Maven, Docker, and `glab`.

JDK for API builds is sdkman Temurin **21.0.8-tem**. In WSL, set `JAVA_HOME` to that candidate and put its `bin` first:

```bash
export JAVA_HOME=$HOME/.sdkman/candidates/java/21.0.8-tem
export PATH=$JAVA_HOME/bin:$PATH
```

From the API repository root, the verify command is:

```bash
./mvnw -B verify
```

Docker needs the Compose plugin. On Windows, when `docker` is missing from PATH, the `.ps1` scripts call `wsl docker`.

## Ports

Compose project name: `laptech-dev`. Host ports bind to `127.0.0.1`. Credentials come from `.env` (no compose defaults).

| Service | Env (default) | URL / use |
|---|---|---|
| MySQL | `MYSQL_PORT` (3306) | `127.0.0.1:${MYSQL_PORT}` |
| Redis | `REDIS_PORT` (6379) | `127.0.0.1:${REDIS_PORT}` |
| RabbitMQ AMQP | `RABBITMQ_PORT` (5672) | `127.0.0.1:${RABBITMQ_PORT}` |
| RabbitMQ UI | `RABBITMQ_MGMT_PORT` (15672) | http://127.0.0.1:15672 |
| Mailpit SMTP | `MAILPIT_SMTP_PORT` (1025) | SMTP on `127.0.0.1:1025` |
| Mailpit UI | `MAILPIT_UI_PORT` (8025) | http://127.0.0.1:8025 |
| Adminer | `ADMINER_PORT` (8090) | http://127.0.0.1:8090 — server host `mysql` |
| MinIO API | `MINIO_API_PORT` (9000) | http://127.0.0.1:9000 |
| MinIO console | `MINIO_CONSOLE_PORT` (9001) | http://127.0.0.1:9001 |

Host Spring apps use `DB_*` (`DB_PORT` must equal `MYSQL_PORT`). `MYSQL_*` configure the MySQL container.

`DB_USERNAME=root` is intentional: Flyway must create the per-service schemas, so host apps connect as root with `MYSQL_ROOT_PASSWORD`. `MYSQL_DATABASE` is not the schema the apps use; each service has its own (`laptech_identity`, and so on).

Host port `3306` may already be taken by a container named `mysql-laptech`. Set `MYSQL_PORT` and `DB_PORT` to a free port such as `3307`. Never stop, remove, or reuse `mysql-laptech`. `reset` and `seed` touch only the compose project.

`LAPTECH_DEV_PROJECT` overrides the compose project name (default `laptech-dev`). Use it for a throwaway or parallel stack so that stack stays separate from `laptech-dev`.

## First run

```bash
cp .env.example .env
```

Edit `.env` and fill every empty password and secret. Compose refuses to start until they are set. Never commit `.env` or print those values.

Validate the required names, then start the stack. `up.sh --check` and `up.ps1 -Check` validate the required `.env` names and exit before Docker.

```bash
dev/up.sh --check
dev/up.sh
```

PowerShell:

```powershell
.\dev\up.ps1 -Check
.\dev\up.ps1
```

Equivalent compose commands from the API repository root (project name `laptech-dev` in `docker-compose.yml`):

```bash
docker compose up -d
docker compose ps
```

Plain `up` starts infra only (mysql, redis, rabbitmq, rabbitmq-definitions, mailpit, adminer, minio). The `app` service is behind Compose profile `app` (containerised gateway image). Leave it off for normal local Java runs. To include it: `dev/up.sh --app` or `.\dev\up.ps1 -App`.

RabbitMQ users come from `.env` (`RABBITMQ_USERNAME` / `RABBITMQ_PASSWORD`). Exchanges, queues, bindings, and DLQs are imported from `dev-config/rabbitmq/definitions.json` by the one-shot `rabbitmq-definitions` service after the broker is healthy.

## Required `.env` names

`up` reports missing names only. These names must be present and non-empty (names only; never print or commit values):

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `REDIS_PASSWORD`
- `RABBITMQ_USERNAME`
- `RABBITMQ_PASSWORD`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `APP_JWT_SECRET`

## Helper scripts (`dev/`)

Scripts in `dev/` wrap the compose stack (project `laptech-dev`), each in bash (`.sh`) and PowerShell (`.ps1`) form; run from any directory. Prerequisites: Docker with the compose plugin, and a `.env` copied from `.env.example` with every password/secret filled.

| Script | What it does | Flags |
|---|---|---|
| `up` | Checks `.env` exists and these names are non-empty, reporting names only: `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, `REDIS_PASSWORD`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `APP_JWT_SECRET`; then `docker compose up -d --wait` | `--app` / `-App`, `--check` / `-Check` |
| `down` | `docker compose down`, volumes kept | `--app` / `-App` |
| `reset` | `docker compose down -v` for the project only, then up; asks you to type yes | `-y`, `--yes` / `-Yes` and `--app` / `-App` |
| `seed` | Applies `docs/seed_dev_data.sql` to the compose MySQL as root; idempotent | (none) |

`reset.sh` exits 1 before deleting volumes when stdin is not a terminal, unless `--yes`. `reset.ps1` does the same unless `-Yes`.

## Seed

Seed runs only through `dev/seed.sh` or `dev/seed.ps1`. The SQL targets the per-service schema `laptech_catalog` (not `MYSQL_DATABASE`). Start laptech-catalog once so its tables exist (Flyway or Hibernate `ddl-auto` depending on profile); until then seed exits with a clear message. Then `dev/seed.sh` / `.\dev\seed.ps1` can be re-run any number of times.

Dev uses Hibernate `ddl-auto: update` with Flyway off. Prod applies each service `V1` baseline.

## Spring profiles

| Profile | Use | Schema / secrets |
|---|---|---|
| `dev` | Local compose stack | `ddl-auto: update`, Flyway off. Existing `application-dev.yml` files already target compose. |
| `test` | Automated tests only | Identity and catalog load `src/test/resources/application-test.yml` and use Testcontainers MySQL 9.4. They must not use shared databases. |
| `prod` | Deployed environments | All secrets required, no defaults. Flyway enabled with `ddl-auto: validate`. |

The full table is in the API repository at `docs/local-stack.md`.

## R2

Object bytes go in a dedicated bucket named `laptech-store-media`. Keys stay under the prefix `laptech/`.

`R2_PUBLIC_BASE_URL` is the dev public base (an `r2.dev` URL) and already lives in the git-ignored laptech-api `.env`. A production custom domain is not chosen.

Bucket creation and CORS are the Product Owner's actions. This page has no procedure for them.

## Troubleshooting

- **Host port 3306 already bound.** A container named `mysql-laptech` will block this stack. Set `MYSQL_PORT` and `DB_PORT` to a free port such as `3307`. Never stop, remove, or reuse `mysql-laptech`.
- **`up --check` / `-Check` fails.** It prints missing or empty `.env` names only. Fill those names. Never print or commit the values.
- **`reset` exits 1 and keeps volumes.** Stdin is not a terminal. Confirm with `dev/reset.sh --yes` or `.\dev\reset.ps1 -Yes`.
- **Seed says catalog tables are missing.** Start laptech-catalog once under the `dev` profile so Hibernate `ddl-auto: update` creates them, then re-run `dev/seed.sh` or `.\dev\seed.ps1`.
- **`reset` / `seed` scope.** They touch only the compose project (`laptech-dev`, or `LAPTECH_DEV_PROJECT`). They leave other containers, including `mysql-laptech`, untouched.
- **Existing database and Flyway.** A schema built earlier with `ddl-auto: update` must be baselined at V1 before prod-style Flyway V1 can apply. See `docs/local-stack.md` in the API repository.
- **MinIO image.** Upstream `minio/minio` images are no longer published on Docker Hub or Quay, so the stack uses the pinned `bitnamilegacy/minio` mirror. Use it for local development only.

Teardown (compose project only):

```bash
docker compose down      # stop containers; named volumes kept
docker compose down -v   # also deletes mysql/redis/rabbitmq/minio volumes — local data gone
```

Prefer `dev/down.sh` / `.\dev\down.ps1` (volumes kept) and `dev/reset.sh` / `.\dev\reset.ps1` (project volumes only, after confirmation).
