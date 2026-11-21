---
id: order-endpoints
title: "Order & Invoice Endpoints"
sidebar_label: "Orders & Invoices"
sidebar_position: 5
description: "Orders & Invoices — Grocery Store POS & Tax Application."
---
# Order & Invoice Endpoints

The order processing module (`backend/internal/order` and `backend/internal/invoice`) handles POS checkout transactions, mixed-VAT calculations, cash rounding, line-item snapshotting, and native UTF-8 Vietnamese PDF invoice generation.

---

## 1. Create Order (Checkout)

Creates a new sales transaction. Dynamically resolves product units, applies wholesale pricing if volume thresholds are met, executes the Vietnamese Tax Engine, snapshots `vat_rate` and `vat_amount` per line, rounds the cash grand total to the nearest 100 VND, and issues an order code (`ORD-YYYYMMDD-XXXX`).

- **Method:** `POST`
- **Path:** `/api/v1/orders`
- **Auth Required:** Yes (`owner`, `cashier`)

### Request Body (Mixed VAT Example)
```json
{
  "type": "retail",
  "customer_id": null,
  "discount": 0,
  "items": [
    {
      "product_id": "11111111-aaaa-bbbb-cccc-111111111111",
      "unit_id": "22222222-aaaa-bbbb-cccc-222222222222",
      "quantity": 2
    },
    {
      "product_id": "33333333-aaaa-bbbb-cccc-333333333333",
      "unit_id": "44444444-aaaa-bbbb-cccc-444444444444",
      "weight_kg": 0.7
    },
    {
      "product_id": "55555555-aaaa-bbbb-cccc-555555555555",
      "unit_id": "66666666-aaaa-bbbb-cccc-666666666666",
      "quantity": 1
    }
  ]
}
```

### Response `201 Created`
```json
{
  "id": "ord-uuid-001",
  "code": "ORD-20261022-4821",
  "type": "retail",
  "customer_id": null,
  "user_id": "cashier-uuid-1",
  "subtotal": "217000.00",
  "discount": "0.00",
  "vat_total": "3360.00",
  "grand_total": "220400.00",
  "status": "paid",
  "created_at": "2026-10-22T01:15:30Z",
  "items": [
    {
      "id": "item-uuid-1",
      "order_id": "ord-uuid-001",
      "product_id": "11111111-aaaa-bbbb-cccc-111111111111",
      "unit_id": "22222222-aaaa-bbbb-cccc-222222222222",
      "quantity": "2.000",
      "weight_kg": null,
      "unit_price": "5000.00",
      "line_total": "10000.00",
      "vat_rate": "8.00",
      "vat_amount": "800.00"
    },
    {
      "id": "item-uuid-2",
      "order_id": "ord-uuid-001",
      "product_id": "33333333-aaaa-bbbb-cccc-333333333333",
      "unit_id": "44444444-aaaa-bbbb-cccc-444444444444",
      "quantity": "0.700",
      "weight_kg": "0.700",
      "unit_price": "250000.00",
      "line_total": "175000.00",
      "vat_rate": "0.00",
      "vat_amount": "0.00"
    },
    {
      "id": "item-uuid-3",
      "order_id": "ord-uuid-001",
      "product_id": "55555555-aaaa-bbbb-cccc-555555555555",
      "unit_id": "66666666-aaaa-bbbb-cccc-666666666666",
      "quantity": "1.000",
      "weight_kg": null,
      "unit_price": "32000.00",
      "line_total": "32000.00",
      "vat_rate": "8.00",
      "vat_amount": "2560.00"
    }
  ]
}
```

---

## 2. List Orders

- **Method:** `GET`
- **Path:** `/api/v1/orders`
- **Auth Required:** Yes (`owner`, `cashier`, `viewer`)
- **Query Parameters:**
  - `status` (string, optional): `paid`, `draft`, `cancelled`
  - `type` (string, optional): `retail`, `wholesale`, `weight`

---

## 3. Get Order Details (With Grouped VAT Breakdown)

Retrieves order headers, customer information, line items, and a map of VAT totals grouped by percentage rate.

- **Method:** `GET`
- **Path:** `/api/v1/orders/:id`
- **Auth Required:** Yes (`owner`, `cashier`, `viewer`)

### Response `200 OK`
```json
{
  "id": "ord-uuid-001",
  "code": "ORD-20261022-4821",
  "subtotal": "217000.00",
  "discount": "0.00",
  "vat_total": "3360.00",
  "grand_total": "220400.00",
  "status": "paid",
  "vat_breakdown": {
    "0%": 0,
    "8%": 3360
  },
  "items": [ ... ]
}
```

---

## 4. Download Native UTF-8 PDF Invoice

Generates and streams an authentic, publication-ready Vietnamese retail invoice formatted with embedded Google Roboto TTF fonts.

- **Method:** `GET`
- **Path:** `/api/v1/orders/:id/invoice.pdf`
- **Auth Required:** No / Direct streaming
- **Response Content-Type:** `application/pdf`
- **Response Headers:**
  ```http
  Content-Disposition: attachment; filename="invoice-ORD-20261022-4821.pdf"
  Content-Type: application/pdf
  ```

### Invoice PDF Structure
- **Store Header:** Tên cửa hàng ("CỬA HÀNG BÁCH HÓA VIỆT"), Địa chỉ, Số điện thoại.
- **Invoice Title:** `HÓA ĐƠN BÁN HÀNG` (in bold Vietnamese typography).
- **Metadata:** Mã đơn hàng, Ngày bán, Thu ngân phụ trách, Khách hàng.
- **Item Table:** STT, Tên hàng, ĐVT, Số lượng, Đơn giá, Thuế suất GTGT, Thành tiền.
- **Tax Breakdown Box:** Bảng kê tiền thuế phân loại theo từng mức (0%, 8%).
- **Grand Total & Cash Rounding:** Tổng tiền thanh toán (bội số 100 đ).
- **Footer:** Lời cảm ơn khách hàng.

### Curl Command to Save PDF
```bash
curl -X GET http://localhost:8080/api/v1/orders/ord-uuid-001/invoice.pdf \
  -o hoa_don_ban_hang.pdf
```
