---
id: entities
title: Entities and Repositories
sidebar_label: Entities
description: Database entities and repositories.
---

### RefreshToken Entity

- Fields: `jti` (String, PK), `userId` (Long), `tokenHash` (String), `createdAt` (Instant), `expiresAt` (Instant), `revoked` (boolean), `replacedBy` (String).
- Represents stored refresh tokens with hashing for security.

### RefreshTokenRepository

- Methods: `findByJti(String)`, `deleteByUserId(Long)`.

(Note: User, Role, Permission entities are from the user module but integrated here.)
