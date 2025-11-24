---
id: auth-controller
title: AuthController
sidebar_label: AuthController
description: Documentation for the AuthController class.
---

The `AuthController` handles REST endpoints for authentication.

### Endpoints

- **POST /api/auth/register**
  - Request: `RegisterRequest` (JSON body).
  - Response: 201 Created (no body).
  - Description: Registers a new user. Throws 409 if email exists.

- **POST /api/auth/login**
  - Request: `LoginRequest` (JSON body).
  - Response: `ResponseEnvelope<AuthPayload>` with access token; sets refresh cookie.
  - Description: Authenticates user and issues tokens.

- **POST /api/auth/refresh-token**
  - Request: None (reads refresh cookie).
  - Response: `ResponseEnvelope<AuthPayload>` with new access token; updates cookie.
  - Description: Refreshes access token, rotates refresh token.

- **POST /api/auth/logout**
  - Request: None (reads refresh cookie).
  - Response: `ResponseEnvelope<Void>`.
  - Description: Revokes refresh token and clears cookie.

- **POST /api/auth/forgot-password** (TODO: Implement).
- **POST /api/auth/reset-password** (TODO: Implement).

### Cookie Management

- Refresh token stored in HttpOnly cookie (`laptech_rt`).
- Secure flags applied based on environment (HTTPS vs localhost).
