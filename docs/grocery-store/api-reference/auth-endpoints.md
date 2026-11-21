---
id: auth-endpoints
title: "Authentication Endpoints"
sidebar_label: "Authentication"
sidebar_position: 2
description: "Authentication — Grocery Store POS & Tax Application."
---
# Authentication Endpoints

The authentication module (`backend/internal/auth`) issues signed HMAC-SHA256 JSON Web Tokens (JWT) for session management and user identification.

---

## 1. User Login

Authenticates a system user against stored bcrypt password hashes.

- **Method:** `POST`
- **Path:** `/api/v1/auth/login`
- **Auth Required:** No (Public)

### Request Body
```json
{
  "username": "cashier",
  "password": "Cashier@123"
}
```

### Response `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e8388417-6ff6-42f1-bd26-9f359c382102",
    "username": "cashier",
    "full_name": "Trần Thị Bình",
    "role": "cashier",
    "is_active": true,
    "created_at": "2026-10-07T00:00:00Z"
  }
}
```

### Curl Example
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"Owner@123"}'
```

---

## 2. Refresh Access Token

Issues a new 15-minute access token using a long-lived (7-day) refresh token.

- **Method:** `POST`
- **Path:** `/api/v1/auth/refresh`
- **Auth Required:** No

### Request Body
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. Current User Profile

Retrieves the currently authenticated user's profile and active role permissions.

- **Method:** `GET`
- **Path:** `/api/v1/me`
- **Auth Required:** Yes (`Bearer <access_token>`)

### Response `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "username": "owner",
  "full_name": "Nguyễn Văn An",
  "role": "owner",
  "is_active": true,
  "created_at": "2026-10-07T00:00:00Z"
}
```

### Curl Example
```bash
curl -X GET http://localhost:8080/api/v1/me \
  -H "Authorization: Bearer <access_token>"
```
