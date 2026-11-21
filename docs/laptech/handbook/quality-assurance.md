---
title: Quality Assurance
sidebar_label: Quality Assurance
sidebar_position: 6
---

## Testing Across the Platform

Laptech spans three repositories with automated unit, integration, architecture, and end-to-end tests:

| Repository | Test Command | Scope |
| --- | --- | --- |
| `laptech-api` | `./mvnw -B verify` | Unit tests, ArchUnit DDD checks, `PreAuthorizeAuthoritiesSeededTest`, and Testcontainers (`mysql:9.4`) REST/Flyway integration tests |
| `laptech-client-web-ui` | `npm test` / `npm run test:e2e` | Vitest + Testing Library unit/component tests; Playwright E2E against mocked API on `:3100` (including VND currency, Shop by Need / Laptop Finder, search, i18n) |
| `laptech-admin-web-ui` | `npm test` / `npm run check:dist` | Vitest unit & payment config boundary tests; `check:dist` verifies demo login helpers are stripped from production builds |

## API Documentation (Swagger)

The API Gateway aggregates OpenAPI specs for all 7 domain services:

- **API Gateway (Aggregated):** `http://localhost:8080/swagger-ui.html`
- **Identity:** `http://localhost:8081/swagger-ui.html`
- **Catalog:** `http://localhost:8092/swagger-ui.html`
- **Inventory:** `http://localhost:8083/swagger-ui.html`
- **Order:** `http://localhost:8084/swagger-ui.html`
- **Payment:** `http://localhost:8085/swagger-ui.html`
- **Promotion:** `http://localhost:8086/swagger-ui.html`
- **Content:** `http://localhost:8087/swagger-ui.html`

## Key Verification Areas

### 1. Authentication, Session & Security Hardening
- **CSRF guard:** Verify `POST /api/auth/refresh-token` and `POST /api/auth/logout` return `403` when neither `X-Laptech-Client: web` nor an allowed `Origin` is sent.
- **Password change revocation:** Verify `PATCH /api/auth/me/change-password` (`oldPassword`, `newPassword`, `confirmNewPassword`) invalidates existing access tokens via Redis (`laptech:auth:revoked-before:{userId}`) and revokes refresh tokens.
- **Input & PBAC guards:** Verify passwords > 64 chars are rejected (BCrypt DoS guard), seeded roles/permissions cannot be deleted or renamed (`409`), and SQL errors never leak in error responses.

### 2. Catalog, Cart & Checkout Integrity
- **Combinable filters:** Verify `GET /api/products` and `/api/products/search` combine `q`, `minPrice`, `maxPrice`, `categoryId`, `brandId`, `tags`, and `sort`; unknown `brandId`/`categoryId` returns `200` with an empty page.
- **Checkout price check ([ADR-0002](../adr/0002-order-snapshot-and-checkout-price.md)):** Change a product's catalog price after adding it to cart and verify `POST /api/orders` returns `409` with `errorCode: "PRICE_CHANGED"` while keeping the cart intact.
- **Guest cart merge:** Verify `localStorage` (`laptech_cart`) merges cleanly with `GET /api/carts` on sign-in without duplicating quantities.

### 3. Roadmap Note — Asynchronous Inventory & Payment Callbacks

:::note Planned (Phases 2–3)
The **RabbitMQ inventory reservation consumer** (automatic stock reservation on `OrderCreated` and deduction on `PaymentSucceeded`) is scheduled for **Phase 3**, and live **VNPay/Stripe webhook callbacks** are scheduled for **Phase 2**. Do not expect automatic async stock deduction or live gateway callbacks in the current build.
:::
