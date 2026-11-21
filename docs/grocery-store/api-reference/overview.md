---
id: overview
title: "API Reference Overview"
sidebar_label: "API Overview"
sidebar_position: 1
description: "API Overview — Grocery Store POS & Tax Application."
---
# API Reference Overview

The Sales Management POS & Tax Application exposes a RESTful JSON API conforming to the **OpenAPI 3.0.3** standard.

---

## 1. Global Endpoints & Base URLs

| Environment | Base URL | Description |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:8080/api/v1` | Local Docker Compose stack |
| **Healthcheck** | `http://localhost:8080/health` | Container health probe (`{"status":"ok"}`) |
| **OpenAPI Specification** | `/openapi.yaml` *(in `grocery-store` repo root)* | Full machine-readable API contract |

---

## 2. Authentication & Authorization Headers

Protected endpoints require a valid JSON Web Token (JWT) supplied in the standard HTTP `Authorization` header:

```http
Authorization: Bearer <access_token>
```

- **Access Token TTL:** 15 minutes
- **Refresh Token TTL:** 7 days
- **Token Signing:** HMAC-SHA256 (`HS256`)

### Role-Based Access Control (RBAC) Matrix

| Endpoint Group | `owner` | `cashier` | `viewer` | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `POST /auth/login`, `POST /auth/refresh` | ✅ | ✅ | ✅ | Public endpoints |
| `GET /me` | ✅ | ✅ | ✅ | Requires active session |
| `GET /categories`, `GET /products` | ✅ | ✅ | ✅ | Public catalog browsing |
| `POST /categories`, `POST /tax-categories` | ✅ | ❌ | ❌ | Owner only |
| `POST /products`, `PUT /products/:id` | ✅ | ✅ | ❌ | Owner & Cashier |
| `POST /orders`, `GET /orders` | ✅ | ✅ | ✅ (Read) | Cashier creates orders |
| `GET /orders/:id/invoice.pdf` | ✅ | ✅ | ✅ | Direct invoice streaming |
| `GET /inventory/batches` | ✅ | ✅ | ✅ | Stock & expiry inspection |
| `POST /inventory/batches` | ✅ | ✅ | ❌ | Inward stock intake |
| `GET /reports/daily` | ✅ | ✅ | ✅ | Daily store metrics |
| `GET /reports/monthly`, `GET /reports/tax` | ✅ | ❌ | ✅ | Management financial reports |
| `GET /reports/export/excel` | ✅ | ❌ | ✅ | Excel export for accounting |

---

## 3. Standard Request & Response Formats

All API requests with bodies must include:
```http
Content-Type: application/json
Accept: application/json
```

### 3.1 Standard Success Envelope
Successful queries return direct JSON arrays or objects:
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Bút bi Thiên Long",
  "sku": "VPP-001"
}
```

### 3.2 Standard Error Envelope
In case of client or server errors (HTTP 4xx, 5xx):
```json
{
  "error": "Descriptive human-readable error message in English or Vietnamese"
}
```

### 3.3 HTTP Status Codes Used

| Code | Meaning | Typical Usage |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | `GET`, `PUT`, `POST` returning resource |
| `201 Created` | Resource created | `POST /orders`, `POST /products` |
| `400 Bad Request` | Validation failure | Missing required field, negative price/qty |
| `401 Unauthorized` | Missing / invalid JWT | Expired token, invalid signature |
| `403 Forbidden` | Insufficient permissions | Cashier attempting to view monthly tax report |
| `404 Not Found` | Resource does not exist | Invalid product ID or order UUID |
| `500 Server Error` | Unhandled exception | Database connectivity lost |
