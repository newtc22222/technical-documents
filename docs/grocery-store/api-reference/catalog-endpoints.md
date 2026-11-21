---
id: catalog-endpoints
title: "Catalog & Product Endpoints"
sidebar_label: "Catalog & Products"
sidebar_position: 3
description: "Catalog & Products — Grocery Store POS & Tax Application."
---
# Catalog & Product Endpoints

The catalog module (`backend/internal/catalog`) manages categories, configurable tax rules, grocery products, multi-unit conversions, and MinIO image uploads.

---

## 1. Categories

### 1.1 List Categories
- **Method:** `GET`
- **Path:** `/api/v1/categories`
- **Auth Required:** No

#### Response `200 OK`
```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Thực phẩm tươi",
    "slug": "thuc-pham-tuoi",
    "sort_order": 1
  },
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "Đồ ăn vặt & Đóng gói",
    "slug": "do-an-vat",
    "sort_order": 2
  }
]
```

### 1.2 Create Category
- **Method:** `POST`
- **Path:** `/api/v1/categories`
- **Auth Required:** Yes (`owner` only)

#### Request Body
```json
{
  "name": "Bia & Đồ uống có cồn",
  "slug": "bia-do-uong",
  "sort_order": 5
}
```

---

## 2. Tax Categories

### 2.1 List Tax Categories
- **Method:** `GET`
- **Path:** `/api/v1/tax-categories`
- **Auth Required:** No

#### Response `200 OK`
```json
[
  {
    "id": "tax-uuid-1",
    "name": "VAT 0% - Hàng tươi sống",
    "vat_rate": "0.00",
    "pit_rate": "1.00",
    "effective_from": "2025-01-01",
    "effective_to": null,
    "notes": "Miễn thuế GTGT hàng tươi sống chưa chế biến"
  },
  {
    "id": "tax-uuid-2",
    "name": "VAT 8% - Hàng tiêu dùng giảm thuế",
    "vat_rate": "8.00",
    "pit_rate": "1.00",
    "effective_from": "2025-01-01",
    "effective_to": null,
    "notes": "Nghị định 72/2024/NĐ-CP giảm 2% thuế GTGT"
  }
]
```

---

## 3. Products

### 3.1 List Products
- **Method:** `GET`
- **Path:** `/api/v1/products`
- **Auth Required:** No
- **Query Parameters:**
  - `category_id` (UUID, optional): Filter by category.
  - `search` (string, optional): Case-insensitive match on product name or SKU.

#### Response `200 OK`
```json
[
  {
    "id": "prod-uuid-1",
    "sku": "TP-001",
    "name": "Thịt bò Úc tươi",
    "category_id": "cat-uuid-fresh",
    "tax_category_id": "tax-uuid-vat0",
    "base_unit": "kg",
    "image_url": "http://localhost:9000/products/beef.png",
    "is_active": true,
    "created_at": "2026-10-07T00:00:00Z",
    "tax_category": {
      "vat_rate": "0.00"
    },
    "units": [
      {
        "id": "unit-uuid-kg",
        "unit_name": "kg",
        "conversion_rate": "1.0000",
        "price_retail": "250000.00",
        "is_base": true
      }
    ]
  }
]
```

### 3.2 Create Product
- **Method:** `POST`
- **Path:** `/api/v1/products`
- **Auth Required:** Yes (`owner`, `cashier`)

#### Request Body
```json
{
  "sku": "DAV-099",
  "name": "Kẹo mè xửng Huế 250g",
  "category_id": "22222222-2222-2222-2222-222222222222",
  "tax_category_id": "tax-uuid-2",
  "base_unit": "gói",
  "units": [
    {
      "unit_name": "gói",
      "conversion_rate": 1.0,
      "price_retail": 35000,
      "is_base": true
    }
  ]
}
```

### 3.3 Get Single Product
- **Method:** `GET`
- **Path:** `/api/v1/products/:id`
- **Auth Required:** No

### 3.4 Update Product
- **Method:** `PUT`
- **Path:** `/api/v1/products/:id`
- **Auth Required:** Yes (`owner`, `cashier`)

---

## 4. Product Units

### 4.1 List Product Units
- **Method:** `GET`
- **Path:** `/api/v1/products/:id/units`
- **Auth Required:** No

### 4.2 Add Conversion Unit to Product
- **Method:** `POST`
- **Path:** `/api/v1/products/:id/units`
- **Auth Required:** Yes (`owner`, `cashier`)

#### Request Body
```json
{
  "unit_name": "thùng",
  "conversion_rate": 24.0,
  "price_retail": 750000,
  "price_wholesale": 720000,
  "min_wholesale_qty": 3,
  "is_base": false
}
```

---

## 5. Product Image Upload

Uploads a JPEG or PNG image directly into the MinIO `products` S3 bucket.

- **Method:** `POST`
- **Path:** `/api/v1/products/:id/image`
- **Auth Required:** Yes (`owner`, `cashier`)
- **Content-Type:** `multipart/form-data`

#### Form Parameters:
- `image`: Binary file (Max 5 MB, extensions: `.jpg`, `.jpeg`, `.png`, `.webp`).

#### Response `200 OK`
```json
{
  "image_url": "http://localhost:9000/products/prod-uuid-1.jpg"
}
```
