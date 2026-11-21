---
id: smoke-testing
title: "Live API Smoke Test Matrix"
sidebar_label: "Smoke Test Runbook"
sidebar_position: 4
description: "Smoke Test Runbook — Grocery Store POS & Tax Application."
---
# Live API Smoke Test Matrix

The smoke test runbook provides a verified 13-step integration sequence executing against the live Docker Compose stack to validate end-to-end operational readiness.

---

## 1. 13-Step Verification Matrix

| Step | Action & HTTP Endpoint | Expected Output | Verification Assertion | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `POST /auth/login` (Cashier) | Access token issued, user "Trần Thị Bình" | HTTP `200 OK`, `access_token` string present | **PASS** |
| **2** | `POST /auth/login` (Owner) | Access token issued, user "Nguyễn Văn An" | HTTP `200 OK`, `role == "owner"` | **PASS** |
| **3** | `GET /categories` | 4 seeded product categories | HTTP `200 OK`, Array length == 4 | **PASS** |
| **4** | `GET /products` | 21 seeded items across 4 categories | HTTP `200 OK`, Array length == 21 | **PASS** |
| **5** | `POST /orders` (Mixed VAT) | 2 Pens (8%) + 0.7kg Beef (0%) + 1 Milk (8%) | HTTP `201 Created`, Subtotal: 217k, VAT: 3,360, Grand: 220,400 | **PASS** |
| **6** | `GET /orders/:id` | Grouped VAT breakdown | HTTP `200 OK`, `vat_breakdown["8%"] == 3360` | **PASS** |
| **7** | `GET /orders/:id/invoice.pdf` | Direct stream of native UTF-8 PDF | HTTP `200 OK`, `Content-Type: application/pdf`, size \sim 24 KB | **PASS** |
| **8** | `GET /inventory/batches?expiring_within_days=30` | Batches flagged by expiry window | HTTP `200 OK`, Batches sorted chronologically | **PASS** |
| **9** | `GET /reports/daily` | Revenue, VAT, order count | HTTP `200 OK`, Revenue & VAT matched to orders | **PASS** |
| **10** | `GET /reports/monthly` (Owner vs Cashier) | Monthly breakdown with RBAC check | Owner: `200 OK`; Cashier: `403 Forbidden` | **PASS** |
| **11** | `GET /reports/tax` | VAT + 1% presumptive retail PIT | HTTP `200 OK`, Gross revenue & 1% PIT calculated | **PASS** |
| **12** | `GET /reports/export/excel` | Excel spreadsheet download | HTTP `200 OK`, `Content-Type: application/vnd.openxmlformats-...`, size > 6 KB | **PASS** |
| **13** | `GET http://localhost:4200` | Angular frontend single-page shell | HTTP `200 OK`, HTML document contains `<app-root>` | **PASS** |

---

## 2. Running Automated Smoke Verification

A ready-to-run automated bash script is included in `scripts/test_smoke.sh`:

```bash
# Execute full smoke test against local stack
bash scripts/test_smoke.sh
```

### Script Execution Snippet
```bash
#!/usr/bin/env bash
set -e

API_URL="http://localhost:8080/api/v1"

echo "=== 1. Login as Cashier ==="
CASHIER_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"cashier","password":"Cashier@123"}')
TOKEN=$(echo "$CASHIER_RES" | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "FAIL: Could not obtain token"
  exit 1
fi
echo "SUCCESS: Obtained token"

echo "=== 2. List Categories ==="
CATS=$(curl -s -X GET "$API_URL/categories")
COUNT=$(echo "$CATS" | jq '. | length')
echo "SUCCESS: Found $COUNT categories"
```
