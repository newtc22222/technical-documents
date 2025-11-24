---
id: dtos
title: DTOs
sidebar_label: DTOs
description: Data Transfer Objects for auth module.
---

### LoginRequest

- Fields: `email` (String, @NotBlank), `password` (String, @NotBlank).

### RegisterRequest

- Fields: `email` (@Email, @NotBlank), `name` (@NotBlank), `password` (@ValidPassword), `phone` (String), `dob` (LocalDate), `gender` (@ValueOfEnum Gender).

### AuthPayload

- Response payload: `accessToken`, `tokenType`, `expiresIn`, `issuedAt`, etc.

### LoginResult

- Internal: Similar to AuthPayload, includes raw refresh token.
