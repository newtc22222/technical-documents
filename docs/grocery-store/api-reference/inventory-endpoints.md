---
id: inventory-endpoints
title: "Inventory & Batch Endpoints"
sidebar_label: "Inventory & Batches"
sidebar_position: 4
description: "Inventory & Batches — Grocery Store POS & Tax Application."
---
# Inventory & Batch Endpoints

The inventory module (`backend/internal/inventory`) manages product batches, trackable expiration dates, and FIFO stock queries.

---

## 1. List Inventory Batches

Retrieves all warehouse inventory batches sorted chronologically by `expiry_date ASC` (earliest expiring batches first).

- **Method:** `GET`
- **Path:** `/api/v1/inventory/batches`
- **Auth Required:** No (Public browsing) or Authenticated
- **Query Parameters:**
  - `expiring_within_days` (integer, optional): Only return batches expiring within the specified number of days (e.g., `7` or `30`).

### Query Example: Get Batches Expiring in < 30 Days
```bash
curl -X GET "http://localhost:8080/api/v1/inventory/batches?expiring_within_days=30"
```

### Response `200 OK`
```json
[
  {
    "id": "batch-uuid-001",
    "product_id": "prod-uuid-beef",
    "batch_no": "BEEF-20261020-01",
    "expiry_date": "2026-10-25T00:00:00Z",
    "quantity": "12.500",
    "cost_price": "210000.00",
    "received_at": "2026-10-20T08:00:00Z",
    "product": {
      "id": "prod-uuid-beef",
      "sku": "TP-001",
      "name": "Thịt bò Úc tươi",
      "base_unit": "kg"
    }
  },
  {
    "id": "batch-uuid-002",
    "product_id": "prod-uuid-milk",
    "batch_no": "MILK-20260915-04",
    "expiry_date": "2026-11-10T00:00:00Z",
    "quantity": "48.000",
    "cost_price": "26000.00",
    "received_at": "2026-09-15T09:30:00Z",
    "product": {
      "id": "prod-uuid-milk",
      "sku": "DAV-002",
      "name": "Sữa tươi tiệt trùng Vinamilk 1L",
      "base_unit": "hộp"
    }
  }
]
```

---

## 2. Inward Batch Receipt

Registers a new delivery batch received from a supplier into warehouse inventory.

- **Method:** `POST`
- **Path:** `/api/v1/inventory/batches`
- **Auth Required:** Yes (`owner`, `cashier`)

### Request Body
```json
{
  "product_id": "prod-uuid-beef",
  "batch_no": "BEEF-20261022-01",
  "expiry_date": "2026-10-28",
  "quantity": 25.0,
  "cost_price": 215000
}
```

### Response `201 Created`
```json
{
  "id": "e98e217d-2b47-4952-b91c-161bcf701321",
  "product_id": "prod-uuid-beef",
  "batch_no": "BEEF-20261022-01",
  "expiry_date": "2026-10-28T00:00:00Z",
  "quantity": "25.000",
  "cost_price": "215000.00",
  "received_at": "2026-10-22T01:00:00Z"
}
```
