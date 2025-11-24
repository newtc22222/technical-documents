---
id: auth-service
title: AuthService
sidebar_label: AuthService
description: Documentation for the AuthService interface and impl.
---

The `AuthService` interface defines auth operations, implemented by `AuthServiceImpl`.

### Methods

- **void register(RegisterRequest request)**
  - Registers a user with default `USER` role.
  - Validates email uniqueness.
  - Encodes password.

- **LoginResult authenticate(LoginRequest request)**
  - Authenticates via Spring Security.
  - Generates access token and refresh token.

- **LoginResult refreshToken(String rawRefreshToken)**
  - Validates refresh token (format: `jti.secret`).
  - Checks DB for expiry/revocation.
  - Verifies secret hash.
  - Rotates token and generates new access token.

- **void revokeRefreshToken(String rawRefreshToken)**
  - Marks token as revoked in DB.

- **void revokeAllRefreshTokensForUser(Long userId)**
  - Deletes all tokens for a user.

### Internal Helpers

- `buildLoginResult`: Constructs `LoginResult` with roles/permissions.
- `fetchPermissionsForUser`: Aggregates permissions from roles.
- `generateRefreshTokenValueAndStore`: Creates random secret, hashes it, stores in DB.
