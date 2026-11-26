---
id: intro
title: Laptech Documentation
sidebar_label: Introduction
sidebar_position: 0
description: Complete technical documentation for the Laptech Store e-commerce platform (API, Storefront, and Admin Workbench).
---

# Laptech Store Platform

**Laptech** is a multi-repository e-commerce platform for laptops and computer hardware, composed of a 9-module Spring Boot backend (`laptech-api`), a customer storefront (`laptech-client-web-ui`), and an operations console (`laptech-admin-web-ui`).

:::note Current state (Not in production)
Laptech is currently in active development and **not yet deployed to production**. All three repositories run locally via Docker Compose (`laptech-dev`) and local frontend dev servers.
:::

## Repositories & Architecture

| Repository | Stack | Default Local Port | Purpose |
| --- | --- | --- | --- |
| `laptech-api` | Java 21, Spring Boot 3.5.8, Spring Cloud 2025.0.0, Maven 3.9 | `8080` (Gateway) + `8081`–`8092` | API Gateway + 7 DDD domain services + shared `laptech-common` library |
| `laptech-client-web-ui` | Next.js 16.3.8 (App Router + Turbopack), React 19, Tailwind CSS 4, `next-intl` | `3000` | Customer storefront: catalog, Laptop Finder / Shop by Need, brand/price/tag filters, search, compare, guest & server cart, checkout |
| `laptech-admin-web-ui` | React 19, Vite 8.3.4, Ant Design 6.6.5, React Router 7, TypeScript 6/7 | `5173` | Back-office workbench: products & R2 media, categories, brands, orders, users, PBAC roles/permissions, payment provider config |

## Backend Modules (`laptech-api`)

| Module | Port | Responsibility |
| --- | --- | --- |
| `laptech-common` | — | Shared `ResponseEnvelope`, JWT/Redis revocation filter, `RequiredSecretsEnvironmentPostProcessor`, RabbitMQ constants |
| `laptech-gateway` | `8080` | Spring Cloud Gateway (WebFlux), CORS (`APP_CORS_ALLOWED_ORIGINS`), aggregated Swagger UI (`/swagger-ui.html`) |
| `laptech-identity` | `8081` | Auth (JWT + HttpOnly `laptech_rt` refresh cookie + `X-Laptech-Client: web` CSRF guard), user profiles, addresses, PBAC (5 seeded roles, 69 permissions, 201 grants, role hierarchy DAG) |
| `laptech-catalog` | `8092` | Products, combinable search/filters, categories, brands, tags, attributes, Cloudflare R2 / MinIO media uploads, Redis caching |
| `laptech-inventory` | `8083` | Stock levels and warehouse allocations (Phase 3 async RabbitMQ reservation consumer planned) |
| `laptech-order` | `8084` | Shopping cart, checkout with catalog price verification (`PRICE_CHANGED` 409), order lifecycle & admin order status counts |
| `laptech-payment` | `8085` | Payment initiation strategy (`COD`, `MOMO`, `VNPAY`, `STRIPE`), admin payment-provider config with optimistic locking & secret-key policy |
| `laptech-promotion` | `8086` | Voucher and promotion domain (checkout wiring planned) |
| `laptech-content` | `8087` | Product reviews and threaded comments (including `[deleted]` placeholder retention for threads with live replies) |

## Infrastructure & Technology Stack

- **Runtime & Build:** Java 21 (`21.0.8-tem`), Maven Wrapper (`3.9.11`), Node.js 24
- **Database:** MySQL 9.4.0 (one schema per service, e.g. `laptech_identity`, `laptech_catalog`), Flyway (`V1` + `V2` migrations in `prod`/`test`; Hibernate `ddl-auto: update` in `dev`)
- **Cache & Revocation:** Redis 7.4.11 (`--requirepass` required) — Spring Cache + distributed access-token revocation (`laptech:auth:revoked-before:{userId}`)
- **Messaging:** RabbitMQ 4.1.8-management (`laptech.order`, `laptech.payment`, `laptech.inventory`, `laptech.dlx` exchanges + 5 work queues + 5 DLQs)
- **Object Storage:** Cloudflare R2 (`STORAGE_PROVIDER=r2`, dedicated bucket `laptech-store-media`, prefix `laptech/`, 5 MiB upload cap); MinIO or local filesystem for dev
- **Testing:** Testcontainers (`mysql:9.4`), ArchUnit, Vitest, Playwright E2E

## Documentation Map

- **[Architecture](./overview/architecture.md):** System topology, DDD layers, API Gateway route precedence, auth/revocation flows, and event topology.
- **[Roadmap & Improvements](./overview/improvements.md):** Stabilized milestones vs planned Phases 2, 3, and 5.
- **[Local Setup](./setup/local-setup.md):** Docker Compose (`laptech-dev`), required `.env` variables, helper scripts (`dev/up.*`, `dev/seed.*`), and running both frontends.
- **[Role Handbook](./handbook/index.md):** Guides for Product Owners, Business Analysts, Developers, DevOps, QA, End Users, and Frontend API integration.
- **[Architecture Decision Records](./adr/0001-cloudflare-r2-storage.md):** ADR-0001 (Cloudflare R2 storage) and ADR-0002 (Order snapshot & checkout price verification).
- **[Auth API Reference](./api-reference/auth-controller.md):** Detailed auth controller, service, DTO, and entity reference (for the full 7-service contract, use the aggregated Swagger UI at `http://localhost:8080/swagger-ui.html`).
- **[Troubleshooting](./troubleshooting/troubleshooting.md):** Common backend, infra, and frontend issues and fixes.
