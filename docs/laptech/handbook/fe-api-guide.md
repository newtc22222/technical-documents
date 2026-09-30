---
title: Frontend integration guide
sidebar_label: Frontend API guide
sidebar_position: 8
---

> **Base URL (Gateway):** `http://localhost:8080`
> **OpenAPI UI:** `http://localhost:8080/swagger-ui.html` — aggregated gateway UI, select a service from the top-right dropdown

All requests go through the **API Gateway** (`port 8080`). You never call individual service ports directly from the frontend.

---

## Table of Contents

1. [Standard Response Shape](#1-standard-response-shape)
2. [Authentication & Token Strategy](#2-authentication--token-strategy)
   - [Register](#21-register)
   - [Login](#22-login)
   - [Refresh Token](#23-refresh-token)
   - [Logout](#24-logout)
3. [User Profile](#3-user-profile)
   - [Get My Profile](#31-get-my-profile)
   - [Update My Profile](#32-update-my-profile)
   - [Change Password](#33-change-password)
4. [Addresses](#4-addresses)
5. [Catalog — Products](#5-catalog--products)
6. [Catalog — Categories](#6-catalog--categories)
7. [Catalog — Brands](#7-catalog--brands)
8. [Cart](#8-cart)
9. [Orders](#9-orders)
10. [Payments](#10-payments)
11. [Reviews & Comments](#11-reviews--comments)
12. [Error Handling](#12-error-handling)
13. [Pagination Reference](#13-pagination-reference)
14. [Permissions Reference](#14-permissions-reference)

---

## 1. Standard Response Shape

Most endpoints return a `ResponseEnvelope<T>` wrapper:

```json
{
  "success": true,
  "status": 200,
  "message": "Human-readable status message",
  "data": { },
  "timestamp": "2026-06-28T05:00:00Z",
  "path": "/api/auth/login",
  "errors": null
}
```

| Field | Type | Notes |
|---|---|---|
| `success` | `boolean` | `true` on success, `false` on error |
| `status` | `number` | HTTP status code mirrored |
| `message` | `string` | Human-readable message |
| `data` | `T \| null` | The actual response payload |
| `timestamp` | `string` | ISO-8601 UTC timestamp |
| `path` | `string` | Request URI |
| `errors` | `Record<string,string> \| null` | Field-level validation errors |

> Always read `success` and `errors` before rendering. On `success: false`, `data` will be `null`.

Some endpoints (Product list, etc.) return the raw Spring Page object **without** the envelope wrapper — see individual sections.

---

## 2. Authentication & Token Strategy

The API uses a **dual-token** scheme:
- **Access Token** — short-lived JWT, sent in `Authorization: Bearer <token>` header.
- **Refresh Token** — long-lived, stored in an **HttpOnly cookie** named `laptech_rt`. You never read or write this cookie manually; the browser handles it automatically.

```
Login  → access token (body) + refresh token (HttpOnly cookie Set-Cookie)
Request → Authorization: Bearer <accessToken>
Expired → POST /api/auth/refresh-token  (cookie sent automatically)
Logout  → POST /api/auth/logout         (cookie is cleared server-side)
```

### 2.1 Register

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "email":    "user@example.com",
  "name":     "Nguyen Van A",
  "password": "Str0ng!Pass",
  "phone":    "0901234567",
  "dob":      "2000-01-15",
  "gender":   "MALE"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | `string` | ✅ | Must be a valid email |
| `name` | `string` | ✅ | Full name |
| `password` | `string` | ✅ | Must pass password strength rules |
| `phone` | `string` | ❌ | Optional |
| `dob` | `string` | ❌ | ISO date `YYYY-MM-DD` |
| `gender` | `string` | ❌ | `MALE`, `FEMALE`, or `NOT_MENTION` |

**Response:** `201 Created` — no body.

---

### 2.2 Login

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email":    "user@example.com",
  "password": "Str0ng!Pass"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "status": 200,
  "message": "Authenticated",
  "data": {
    "accessToken":               "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType":                 "Bearer",
    "expiresIn":                 900,
    "issuedAt":                  "2026-06-28T05:00:00Z",
    "refreshTokenSentViaCookie": true,
    "refreshTokenExpiresAt":     "2026-07-28T05:00:00Z",
    "user": {
      "id":        1,
      "email":     "user@example.com",
      "fullName":  "Nguyen Van A",
      "avatarUrl": null,
      "createdAt": "2026-06-28T05:00:00Z"
    },
    "roles":       ["ROLE_USER"],
    "permissions": ["cart:view", "cart:create", "order:view"],
    "jti":         "abc123-uuid"
  }
}
```

> **Tip:** Store `accessToken`, `expiresIn`, and `issuedAt` in memory (e.g. Pinia / Zustand). Do not put the access token in `localStorage` if you want to avoid XSS risk — keep it in memory and let the cookie handle the refresh automatically.

The refresh token cookie is **HttpOnly** and automatically included in subsequent requests by the browser (when `credentials: 'include'` is set in `fetch`/`axios`).

---

### 2.3 Refresh Token

```
POST /api/auth/refresh-token
```

No request body needed. The browser automatically sends the `laptech_rt` cookie.

**Response `200 OK`:** Same shape as login — a new `accessToken` and a rotated refresh token cookie.

**Typical FE flow:**

```typescript
// Interceptor example (axios)
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await axios.post('/api/auth/refresh-token', {}, {
        withCredentials: true,
      });
      const newToken = data.data.accessToken;
      store.setToken(newToken);
      error.config.headers['Authorization'] = `Bearer ${newToken}`;
      return axiosInstance(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### 2.4 Logout

```
POST /api/auth/logout
```

No body. The server revokes the refresh token and clears the cookie.

**Response `200 OK`:**

```json
{ "success": true, "status": 200, "message": "Logged out", "data": null }
```

> After logout, clear `accessToken` from your client store. The server-side cookie is already cleared by the `Set-Cookie` response header.

---

## 3. User Profile

All `/api/auth/me/**` endpoints require:
```
Authorization: Bearer <accessToken>
```

### 3.1 Get My Profile

```
GET /api/auth/me
```

**Response `200 OK`:**

```json
{
  "data": {
    "id":     1,
    "email":  "user@example.com",
    "name":   "Nguyen Van A",
    "gender": "MALE",
    "dob":    "2000-01-15",
    "phone":  "0901234567",
    "roles":  ["ROLE_USER"]
  }
}
```

---

### 3.2 Update My Profile

```
PATCH /api/auth/me
```

**Request Body** (all fields optional — send only what changed):

```json
{
  "name":   "Nguyen Van B",
  "phone":  "0912345678",
  "dob":    "2000-05-20",
  "gender": "FEMALE"
}
```

**Response `200 OK`:** Updated `UserProfileDTO` (same shape as GET).

---

### 3.3 Change Password

```
PATCH /api/auth/me/change-password
```

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword":     "NewPass456!"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Password changed successfully. You have been logged out. Please log in again.",
  "data": null
}
```

> **Warning:** After a successful password change, the server clears the security context. Redirect the user to the login page and clear all client-side tokens immediately.

---

## 4. Addresses

Base: `/api/me/addresses` · Requires `Authorization: Bearer <token>`

### List Addresses

```
GET /api/me/addresses
```

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id":        1,
      "street":    "123 Nguyen Hue",
      "ward":      "Ben Nghe",
      "district":  "Quan 1",
      "city":      "Ho Chi Minh",
      "isDefault": true,
      "userId":    1,
      "userName":  "Nguyen Van A",
      "createdAt": "2026-06-01T10:00:00",
      "updatedAt": "2026-06-01T10:00:00"
    }
  ]
}
```

### Create Address

```
POST /api/me/addresses
```

```json
{
  "street":    "456 Le Loi",
  "ward":      "Phuong 1",
  "district":  "Quan 3",
  "city":      "Ho Chi Minh",
  "isDefault": false
}
```

`201 Created` — returns the created address object.

### Update Address

```
PUT /api/me/addresses/{addressId}
```

Same body shape as Create. Returns the updated address.

### Delete Address

```
DELETE /api/me/addresses/{addressId}
```

`200 OK` — soft-delete. If the deleted address was default, another address is automatically promoted.

### Set Default Address

```
POST /api/me/addresses/{addressId}/default
```

No body. Returns the updated address with `isDefault: true`.

---

## 5. Catalog — Products

Base: `/api/products` · **No auth required**

### List Products (paginated)

```
GET /api/products
GET /api/products?page=0&size=20&sort=name,asc
GET /api/products?categoryId=3
GET /api/products?brandId=5
GET /api/products?tags=laptop,gaming
```

> When `categoryId`, `brandId`, or `tags` are provided, only one filter is applied at a time (last one wins in current implementation). Combine filters via the `/api/categories/{id}/products` or `/api/brands/{id}/products` sub-routes.

**Response** (Spring Page — **not** wrapped in `ResponseEnvelope`):

```json
{
  "content": [ ],
  "pageable": { "pageNumber": 0, "pageSize": 20 },
  "totalElements": 150,
  "totalPages": 8,
  "last": false,
  "first": true,
  "numberOfElements": 20,
  "empty": false
}
```

### Get Product by ID

```
GET /api/products/{id}
```

### Get Product by Slug

```
GET /api/products/slug/{slug}
```

Prefer slug-based lookups for SEO-friendly pages.

### Get Product Attributes

```
GET /api/products/{id}/attributes
```

Returns a `ResponseEnvelope<List<ProductAttributeAssignResponseDTO>>`.

---

## 6. Catalog — Categories

Base: `/api/categories` · **No auth required**

### List All Categories (paginated)

```
GET /api/categories?page=0&size=50&sort=name,asc
```

**Response** (`ResponseEnvelope<PaginationResponse<CategoryResponseDTO>>`):

```json
{
  "data": {
    "content":       [ ],
    "totalElements": 12,
    "totalPages":    1,
    "currentPage":   0,
    "pageSize":      50
  }
}
```

### Get Category by ID

```
GET /api/categories/{id}
```

### Get Category by Slug

```
GET /api/categories/slug/{slug}
```

### Get Category Tree (for navigation menus)

```
GET /api/categories/tree
GET /api/categories/tree?includeCounts=false
```

Returns a nested tree of `CategoryTreeNodeDTO`. Heavily Redis-cached — safe to call on every page load.

```json
{
  "data": [
    {
      "id": 1,
      "name": "Laptops",
      "slug": "laptops",
      "productCount": 42,
      "children": [
        {
          "id": 2,
          "name": "Gaming Laptops",
          "slug": "gaming-laptops",
          "productCount": 15,
          "children": []
        }
      ]
    }
  ]
}
```

### Get Category Breadcrumb

```
GET /api/categories/{id}/breadcrumb
```

Returns `string[]` from root to target. Useful for `<Breadcrumb>` UI components.

```json
{ "data": ["Laptops", "Gaming Laptops", "RTX 4090 Series"] }
```

### Get Products by Category

```
GET /api/categories/categories/{categoryId}/products?page=0&size=20
```

Returns `ResponseEnvelope<PaginationResponse<ProductResponseDTO>>`.

---

## 7. Catalog — Brands

Base: `/api/brands` · **No auth required**

### List All Brands

```
GET /api/brands
```

Returns `ResponseEnvelope<List<BrandResponseDTO>>` (no pagination — full list).

### Get Brand by ID

```
GET /api/brands/{id}
```

### Get Brand by Slug

```
GET /api/brands/slug/{slug}
```

### Get Products by Brand

```
GET /api/brands/{brandId}/products?page=0&size=20&sort=name,asc
```

Returns `ResponseEnvelope<PaginationResponse<ProductResponseDTO>>`.

---

## 8. Cart

Base: `/api/carts` · Requires `Authorization: Bearer <token>` + `cart:*` permissions

While signed out, the storefront keeps its cart in `localStorage` under `laptech_cart`. On login, and when a refresh cookie restores the session, it loads `GET /api/carts`, keeps the larger quantity for each shared product, `PUT`s a line only when that quantity differs, and `POST`s only products that are not already on the server cart. `POST` both adds quantity and re-snapshots the catalog price, so an existing line is not posted just to change quantity. After those writes succeed, the storefront shows a second `GET` (server `unitPrice`; a null `imageUrl` is the local placeholder) and then removes `laptech_cart`. Logout drops the in-memory cart and does not copy the server cart back. Checkout calls `POST /api/orders` with that server cart id.

### Get Cart

```
GET /api/carts
```

**Response `200 OK`** (`ResponseEnvelope<CartResponse>`):

```json
{
  "data": {
    "id":       10,
    "userId":   1,
    "items": [
      {
        "productId":   5,
        "productName": "Dell XPS 15",
        "quantity":    2,
        "unitPrice":   35000000,
        "subtotal":    70000000
      }
    ],
    "totalPrice": 70000000
  }
}
```

### Add Item to Cart

```
POST /api/carts/items
```

```json
{ "productId": 5, "quantity": 1 }
```

If the product already exists in the cart, its quantity is **increased** by the given amount, and the line's unit price is replaced with the current catalog price. The request does not send a price. A quantity-only update does not refresh the price. Returns the full updated `CartResponse`.

### Update Item Quantity

```
PUT /api/carts/items/{productId}
```

```json
{ "quantity": 3 }
```

Set `quantity: 0` to remove the item. Returns updated `CartResponse`.

### Remove Item

```
DELETE /api/carts/items/{productId}
```

`200 OK` — returns updated `CartResponse`.

### Clear Cart

```
DELETE /api/carts/items
```

`204 No Content`

### Recalculate Totals

```
POST /api/carts/recalculate
```

Returns the current `CartResponse`. This call does not apply a voucher or a shipping fee. Checkout does not accept a voucher code (see ADR-0002).

---

## 9. Orders

Base: `/api/orders` · Requires `Authorization: Bearer <token>` + `order:*` permissions

### Create Order

```
POST /api/orders
```

```json
{
  "cartId": 10,
  "paymentMethod": "COD",
  "shippingAddress": {
    "street": "123 Nguyen Hue",
    "ward": "Ben Nghe",
    "district": "Quan 1",
    "city": "Ho Chi Minh",
    "receiverName": "Preview Shopper",
    "receiverPhone": "0900000000"
  },
  "shipmentNotes": { "note": "Leave at the gate" }
}
```

`201 Created` — returns `ResponseEnvelope<OrderResponse>`. The charge is the cart's frozen unit price. Checkout re-reads the catalog and continues only when that price still matches. There is no voucher field. `discountTotal` is `0` and `shippingFee` is `0`.

| Status | `errorCode` | When |
| --- | --- | --- |
| 409 | `PRICE_CHANGED` | Catalog price and cart price differ. The cart is kept. |
| 409 | `409` | The cart is empty. |
| 404 | | The product or the cart does not exist. |
| 502 | `502` | Catalog could not be read. The cart is kept. |

### List My Orders

```
GET /api/orders
```

Returns `ResponseEnvelope<List<OrderResponse>>`.

### Get Order Detail

```
GET /api/orders/{orderId}
```

Returns `ResponseEnvelope<OrderResponse>`.

### Update Order Status _(admin / staff only)_

```
PATCH /api/orders/{orderId}/status
```

```json
{ "status": "CONFIRMED" }
```

### Cancel Order

```
POST /api/orders/{orderId}/cancel
```

No body. Returns the updated `OrderResponse`. Only works when the order is not in a final state (`DELIVERED`, `CANCELLED`).

---

## 10. Payments

Base: `/api/payments` · Requires `Authorization: Bearer <token>` + `order:update` permission

### Initiate Payment

```
POST /api/payments/initiate
```

```json
{
  "orderId": 42,
  "method":  "MOMO"
}
```

**Available methods:** `COD`, `MOMO`, `VNPAY`, `STRIPE` *(check with backend team for currently active providers)*

**Response `200 OK`** (`PaymentResponse`):

```json
{
  "transactionId": "TXN_20260628_abc123",
  "paymentUrl":    "https://payment-provider.com/pay?token=xxx",
  "status":        "PENDING",
  "method":        "MOMO"
}
```

> For redirect-based providers (MoMo, VNPay), redirect the user to `paymentUrl`. The user returns to your site via the configured callback URL. Provider-to-server callbacks are handled by the backend.

---

## 11. Reviews & Comments

Base: `/api` · Requires `Authorization: Bearer <token>` for write operations

### Get Reviews for a Product

```
GET /api/{productId}/reviews?ratingMin=0&ratingMax=5&page=0&sort=createAt,desc
```

### Get All Reviews

```
GET /api/reviews?productId=5&ratingMin=3&ratingMax=5
```

### Get Review by ID

```
GET /api/reviews/{id}
```

### Create Review _(requires `review:create`)_

```
POST /api/{productId}/reviews
```

Request body — TBD (schema in progress on backend).

### Delete Review _(requires `review:delete`)_

```
DELETE /api/reviews/{id}
```

`204 No Content`

### Get Comments for a Product

```
GET /api/{productId}/comments?page=0&sort=createAt,desc
```

### Create Comment _(requires `comment:create`)_

```
POST /api/{productId}/comments
```

### Delete Comment _(requires `comment:delete`)_

```
DELETE /api/comments/{id}
```

> **Note:** The Reviews & Comments service is still in active development. Response shapes are not yet finalized. Consult the backend team before building UI that depends on these endpoints.

---

## 12. Error Handling

All errors follow the same `ResponseEnvelope` shape with `success: false`.

### Common HTTP Status Codes

| Status | Meaning | What to do |
|---|---|---|
| `400` | Validation error | Show field errors from `errors` map |
| `401` | Unauthenticated | Trigger token refresh, then redirect to login on failure |
| `403` | Forbidden (no permission) | Show "Access Denied" message |
| `404` | Resource not found | Show 404 page |
| `409` | Conflict (e.g. email taken) | Show conflict message |
| `500` | Server error | Show generic error, log to Sentry |
| `501` | Not Implemented | Feature coming soon — do not expose in UI |

### Validation Error Example

```json
{
  "success": false,
  "status":  400,
  "message": "Validation failed",
  "data":    null,
  "errors": {
    "email":    "must be a well-formed email address",
    "password": "Password must be at least 8 characters"
  }
}
```

**Recommended handler:**

```typescript
function handleApiError(response: ResponseEnvelope<unknown>) {
  if (response.errors) {
    Object.entries(response.errors).forEach(([field, msg]) => {
      form.setError(field, { message: msg });
    });
    return;
  }
  toast.error(response.message ?? 'Something went wrong');
}
```

---

## 13. Pagination Reference

Endpoints that support pagination accept Spring-style query params:

| Param | Default | Notes |
|---|---|---|
| `page` | `0` | Zero-indexed page number |
| `size` | `20` | Items per page |
| `sort` | varies | `field,direction` e.g. `name,asc` or `createdAt,desc` |

**Example:** `GET /api/products?page=1&size=10&sort=name,asc`

Paginated responses wrapped in `PaginationResponse`:

```json
{
  "content":       [ ],
  "totalElements": 150,
  "totalPages":    15,
  "currentPage":   1,
  "pageSize":      10
}
```

---

## 14. Permissions Reference

The `permissions` array in the login response controls what the logged-in user can do. Check permissions client-side to conditionally render UI elements.

| Permission | Endpoint Access |
|---|---|
| `cart:view` | `GET /api/carts` |
| `cart:create` | `POST /api/carts/items` |
| `cart:update` | `PUT /api/carts/items/{id}`, `POST /api/carts/recalculate` |
| `cart:delete` | `DELETE /api/carts/items/**` |
| `order:view` | `GET /api/orders/**` |
| `order:create` | `POST /api/orders` |
| `order:update` | `PATCH /api/orders/{id}/status`, `POST /api/payments/initiate` |
| `review:create` | `POST /api/{productId}/reviews` |
| `review:delete` | `DELETE /api/reviews/{id}` |
| `comment:create` | `POST /api/{productId}/comments` |
| `comment:delete` | `DELETE /api/comments/{id}` |

> **Tip:** Store `permissions` as a `Set<string>` in your auth store and use a helper `can('cart:create')` to gate UI features. This avoids role-checking (which is less flexible) and keeps the logic aligned with backend `@PreAuthorize` rules.

---

## Appendix — Axios Setup Template

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // Required for HttpOnly refresh-token cookie
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = authStore.accessToken;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post('/api/auth/refresh-token');
        authStore.setToken(data.data.accessToken);
        original.headers['Authorization'] = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        authStore.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
```
