---
id: report-endpoints
title: "Reporting & Export Endpoints"
sidebar_label: "Reports & Analytics"
sidebar_position: 6
description: "Reports & Analytics — Grocery Store POS & Tax Application."
---
# Reporting & Export Endpoints

The reporting module (`backend/internal/report`) aggregates sales metrics across daily, monthly, and tax periods, and exports structured spreadsheets (`.xlsx`) via Excelize.

---

## 1. Daily Sales Summary

Returns aggregated sales volume, total collected VAT, completed order count, and revenue breakdown across product categories for a given date.

- **Method:** `GET`
- **Path:** `/api/v1/reports/daily`
- **Auth Required:** Yes (`owner`, `cashier`, `viewer`)
- **Query Parameters:**
  - `date` (string, optional): ISO date format `YYYY-MM-DD` (Defaults to current date).

### Response `200 OK`
```json
{
  "date": "2026-10-22",
  "total_revenue": 1823600,
  "total_vat": 44320,
  "order_count": 8,
  "category_revenue": {
    "Đồ ăn vặt & Đóng gói": 642000,
    "Mỹ phẩm & Chăm sóc cá nhân": 378000,
    "Thực phẩm tươi": 510000,
    "Văn phòng phẩm": 293600
  }
}
```

---

## 2. Monthly Revenue Progress

Returns month-to-date total revenue, VAT totals, and a day-by-day revenue breakdown for calendar analysis.

- **Method:** `GET`
- **Path:** `/api/v1/reports/monthly`
- **Auth Required:** Yes (`owner`, `viewer` — *Cashier receives 403 Forbidden*)
- **Query Parameters:**
  - `month` (string, optional): Month format `YYYY-MM` (Defaults to current month).

### Response `200 OK`
```json
{
  "month": "2026-10",
  "total_revenue": 45280000,
  "total_vat": 1240000,
  "order_count": 184,
  "daily_breakdown": [
    {
      "date": "2026-10-01",
      "revenue": 1450000,
      "vat": 42000,
      "count": 6
    },
    {
      "date": "2026-10-02",
      "revenue": 1680000,
      "vat": 51200,
      "count": 7
    }
  ]
}
```

---

## 3. Vietnamese Tax Summary & PIT Estimation

Aggregates revenue and tax liabilities under Vietnamese tax laws across a designated date range. Segregates revenue and VAT by tax tier (0%, 5%, 8%) and calculates the **1.0% presumptive retail PIT** under Circular 40/2021/TT-BTC.

- **Method:** `GET`
- **Path:** `/api/v1/reports/tax`
- **Auth Required:** Yes (`owner`, `viewer`)
- **Query Parameters:**
  - `from` (string, required): Start date `YYYY-MM-DD`
  - `to` (string, required): End date `YYYY-MM-DD`

### Response `200 OK`
```json
{
  "from_date": "2026-10-01",
  "to_date": "2026-10-31",
  "gross_revenue": 17790000,
  "vat_0_revenue": 5100000,
  "vat_5_revenue": 0,
  "vat_5_amount": 0,
  "vat_8_revenue": 12690000,
  "vat_8_amount": 1015200,
  "total_vat": 1015200,
  "pit_estimate": 177900
}
```

---

## 4. Export Monthly Spreadsheet (`.xlsx`)

Streams a formatted Microsoft Excel workbook generated via **Excelize**, suitable for submission to accountants or storage in Google Sheets.

- **Method:** `GET`
- **Path:** `/api/v1/reports/export/excel`
- **Auth Required:** Yes (`owner`, `viewer`)
- **Query Parameters:**
  - `month` (string, optional): Month format `YYYY-MM` (Defaults to current month).
- **Response Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename="Bao_cao_doanh_thu_thang_2026-10.xlsx"`

### Workbook Contents
1. **Sheet 1: Tổng quan (Summary):** Month, store tax ID, total revenue, total VAT, 1% retail PIT estimate, total orders.
2. **Sheet 2: Bảng kê hóa đơn (Order Register):** Order code, timestamp, cashier name, customer name, subtotal, VAT 0% amount, VAT 8% amount, grand total.
3. **Sheet 3: Doanh số theo ngày (Daily Breakdown):** Calendar dates, order counts, daily gross sales.

### Curl Example
```bash
curl -X GET "http://localhost:8080/api/v1/reports/export/excel?month=2026-10" \
  -H "Authorization: Bearer <access_token>" \
  -o Bao_cao_thang_10_2026.xlsx
```
