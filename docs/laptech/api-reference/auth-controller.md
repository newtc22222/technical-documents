---
id: auth-controller
title: AuthController
sidebar_label: AuthController
description: Documentation for the AuthController endpoints, CSRF guard, and RefreshCookiePolicy.
---

:::tip Full Multi-Service OpenAPI Spec
This section documents the core `laptech-identity` authentication contract. For the complete 7-service API (Catalog, Inventory, Order, Payment, Promotion, Content, Identity), open the aggregated Gateway Swagger UI at `http://localhost:8080/swagger-ui.html` or see the [Frontend API guide](../handbook/fe-api-guide.md).
:::

The `AuthController` handles REST endpoints for authentication under `/api/auth`.

### Endpoints

- **`POST /api/auth/register`**
  - Request: `RegisterRequest` (`email`, `name`, `password` ≤ 64 chars, required `gender`: `MALE` | `FEMALE` | `NOT_MENTION`, optional `phone`, `dob`).
  - Response: `201 Created` (no body). Throws `409` if email already exists.

- **`POST /api/auth/login`**
  - Request: `LoginRequest` (`email`, `password`).
  - Response: `ResponseEnvelope<AuthPayload>` with access token, user summary, roles, and PBAC `permissions`; sets HttpOnly `laptech_rt` refresh cookie.

- **`POST /api/auth/refresh-token`**
  - Request: No body; reads `laptech_rt` cookie. Requires **`X-Laptech-Client: web`** header or an allowed `Origin` (`APP_CORS_ALLOWED_ORIGINS`), otherwise returns **`403 Forbidden`**.
  - Response: `ResponseEnvelope<AuthPayload>` with new access token; rotates refresh token cookie (revokes old token, issues new one).

- **`POST /api/auth/logout`**
  - Request: No body; reads `laptech_rt` cookie. Subject to the same **`X-Laptech-Client: web` / `Origin` CSRF guard** (`403` otherwise).
  - Response: `ResponseEnvelope<Void>`. Revokes refresh token and clears cookie.

- **`PATCH /api/auth/me/change-password`**
  - Request: `ChangePasswordRequestDTO` (`oldPassword`, `newPassword`, `confirmNewPassword`, 6–64 chars).
  - Response: `200 OK`. Updates `password_changed_at`, writes `laptech:auth:revoked-before:{userId}` in Redis, and revokes active refresh tokens.

- **`POST /api/auth/forgot-password`** *(Planned — not yet implemented)*
- **`POST /api/auth/reset-password`** *(Planned — not yet implemented)*

### Cookie Management (`RefreshCookiePolicy`)

- Refresh token is stored in an HttpOnly cookie named `laptech_rt`.
- `APP_AUTH_REFRESH_COOKIE_SAME_SITE` defaults to `Lax`. Setting it to `None` automatically enables `Secure` for cross-site HTTPS deployments.
