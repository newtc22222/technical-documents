---
id: architecture
title: High-Level Architecture
sidebar_label: Architecture
sidebar_position: 1
description: Overview of the module's architecture and flows.
---

The authentication module follows a layered architecture: Controller → Service → Repository → Entity. It integrates with Spring Security for authentication and JWT for token management.

## Components

- **Controller**: Handles HTTP requests (e.g., `/api/auth/login`).
- **Service**: Business logic for auth operations.
- **Repository**: JPA interfaces for database access.
- **Entities/DTOs**: Data models for users, tokens, requests/responses.

## Key Flows

### Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant DB
    Client->>Controller: POST /api/auth/login (email, password)
    Controller->>Service: authenticate(LoginRequest)
    Service->>SpringSecurity: authenticate credentials
    Service->>JwtProvider: generateAccessToken
    Service->>DB: generate & store RefreshToken
    Service-->>Controller: LoginResult
    Controller->>Client: Set HttpOnly cookie (refresh), return AuthPayload
```

### Refresh Token Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Service
    participant DB
    Client->>Controller: POST /api/auth/refresh-token (with cookie)
    Controller->>Service: refreshToken(rawRefreshToken)
    Service->>DB: validate RefreshToken (jti, hash, expiry)
    Service->>JwtProvider: generate new AccessToken
    Service->>DB: rotate RefreshToken (revoke old, create new)
    Service-->>Controller: new LoginResult
    Controller->>Client: Update cookie, return new AuthPayload
```

### Architecture Diagram

```mermaid
graph TD
    A[Client] --> B[AuthController]
    B --> C[AuthServiceImpl]
    C --> D[JwtTokenProvider]
    C --> E[UserRepository]
    C --> F[RefreshTokenRepository]
    C --> G[RoleRepository]
    E --> H[Database]
    F --> H
    G --> H
```
