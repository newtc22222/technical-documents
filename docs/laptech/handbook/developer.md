---
title: Developer
sidebar_label: Developer
sidebar_position: 4
---

## Architecture: Multi-Module DDD Backend + 2 Web Apps

`laptech-api` is a **9-module Maven repository** comprising an API Gateway (`laptech-gateway`), shared library (`laptech-common`), and **7 standalone Spring Boot domain services** (`identity`, `catalog`, `inventory`, `order`, `payment`, `promotion`, `content`) running on separate ports.

- `laptech-common` holds `ResponseEnvelope`, global exception handling, JWT + Redis token revocation filter, `RequiredSecretsEnvironmentPostProcessor`, and RabbitMQ constants.
- Services communicate synchronously via **OpenFeign** (`/api/internal/**`) and asynchronously via **RabbitMQ** topic exchanges.

### DDD Layering Strategy (Enforced by ArchUnit)

Inside each domain module (e.g. `laptech-order`), ArchUnit tests enforce four layers:

1. **`domain/`**: Pure Java. Aggregates, Entities, Value Objects, Domain Events, and Repository Interfaces. No Spring or JPA dependencies.
2. **`application/`**: Use cases, Application Services, DTOs, MapStruct mappers, and Event Handlers.
3. **`infrastructure/`**: Spring Data JPA implementations, Feign clients, RabbitMQ producers/consumers, Redis cache/revocation, Cloudflare R2 / MinIO storage.
4. **`interfaces/`**: REST controllers and HTTP delivery.

### Security & PBAC Seeding

- `PermissionRoleSeeder` runs `permissions_roles.sql` on boot (serialized with an advisory lock) to seed and re-sync **5 roles**, **69 permissions**, **201 grants**, and the role hierarchy DAG. Seeded roles and permissions are protected against deletion and renaming.
- Access-token revocation uses Redis (`laptech:auth:revoked-before:{userId}`) across all services, plus DB checks (`password_changed_at`, `is_active`, `deleted_at`) in `laptech-identity`.
- `PreAuthorizeAuthoritiesSeededTest` verifies that every `@PreAuthorize` authority matches a seeded permission.

## Backend Tech Stack

- **Java 21** (`21.0.8-tem`), **Spring Boot 3.5.8**, **Spring Cloud 2025.0.0**, **Maven Wrapper 3.9.11**
- **MySQL 9.4.0**, **Redis 7.4.11**, **RabbitMQ 4.1.8**, **Cloudflare R2** (`aws-sdk 2.31.50`) / **MinIO** (local)
- **Flyway** (`V1` + `V2` migrations in `prod`/`test`; Hibernate `ddl-auto: update` in `dev`)
- **Lombok**, **MapStruct 1.6.3**, **ArchUnit 1.3.0**, **Testcontainers (`mysql:9.4`)**

## Frontend Repositories

- **Storefront (`laptech-client-web-ui`, port `3000`):** Next.js `16.3.8` (App Router + Turbopack), React 19, Tailwind CSS 4, shadcn/ui + Radix UI, `next-intl` (`en`, `vi`, `fr`), TanStack Query 5, Zustand 5, `nuqs`, React Hook Form + Zod 4, Vitest, Playwright E2E.
- **Admin Workbench (`laptech-admin-web-ui`, port `5173`):** React 19, Vite `8.3.4`, TypeScript 6/7 (`@typescript/native`), Ant Design `6.6.5`, Be Vietnam Pro font, React Router 7, TanStack Query 5, Zustand 5, `i18next` (`en`/`vi`), Vitest, ESLint 10. Uses `PermissionGuard` for PBAC and `npm run generate:permissions` to sync permission constants.

## Local Setup & Execution

Copy `.env.example` to `.env` in `laptech-api`. See [Local setup](../setup/local-setup.md) for required variable names and frontend env vars.

```bash
# Start infra (MySQL, Redis, RabbitMQ, Mailpit, Adminer, MinIO)
dev/up.sh       # or .\dev\up.ps1 on Windows

# Full build + ArchUnit + Testcontainers verification
export JAVA_HOME=$HOME/.sdkman/candidates/java/21.0.8-tem
export PATH=$JAVA_HOME/bin:$PATH
./mvnw -B verify

# Run a single service
./mvnw spring-boot:run -pl laptech-catalog -Dspring-boot.run.profiles=dev
```

## Coding Guidelines

- Keep all business invariants inside Aggregates and Domain Services; do not bypass the `domain/` layer.
- Keep gateway route precedence intact: specific `/api/admin/<domain>/**` and `/api/me/comments/**` routes must stay above `laptech-identity`'s catch-all `/api/admin/**` and `/api/me/**`.
- Always send `X-Laptech-Client: web` on browser auth requests to satisfy the cookie CSRF guard.
