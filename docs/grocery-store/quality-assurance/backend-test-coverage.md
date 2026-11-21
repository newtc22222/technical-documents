---
id: backend-test-coverage
title: "Backend Test Coverage Record"
sidebar_label: "Backend Test Coverage"
sidebar_position: 2
description: "Backend Test Coverage — Grocery Store POS & Tax Application."
---
# Backend Test Coverage Record

The Go backend enforces rigorous unit and package integration testing. Test suites execute natively via `make test` (`go test -v -cover ./...`).

---

## 1. Package Coverage Summary Table

All 11 packages pass with zero errors, achieving an average statement coverage of **~88%**, with all core financial engines at **100%**:

| Package | Status | Coverage | Tests Executed & Scope |
| :--- | :---: | :---: | :--- |
| `internal/tax` | **PASS** | **100.0%** | Mixed Invoice VAT (SPEC §4), Empty Inputs, 5% Reduced Rate, Rounding Half-Up, Zero Rate Lines |
| `pkg/money` | **PASS** | **100.0%** | Basic Add/Sub/Mul, Decimal Multiplication, Nearest 100 Cash Rounding, Negative Values |
| `pkg/unit` | **PASS** | **100.0%** | Base/Non-base Unit Conversions, Quantity Rounding, Zero/Negative Conversion Rate Rejection |
| `internal/middleware` | **PASS** | **97.1%** | RBAC Role Access (`owner`, `cashier`, `viewer`), Auth Header Extraction, CORS Preflight, Audit Logger |
| `internal/invoice` | **PASS** | **93.0%** | Embedded Roboto TTF fonts, UTF-8 Vietnamese Rendering, PDF generation & HTTP streaming |
| `internal/report` | **PASS** | **92.2%** | Daily report, Monthly report (owner role), 2025 VAT + PIT 1% Tax Summary, Excel XLSX Export |
| `pkg/jwt` | **PASS** | **81.8%** | Token Pair Generation, Access/Refresh Validation, Expired Token Rejection |
| `internal/inventory` | **PASS** | **80.9%** | Batch creation, stock tracking, FIFO ordering, expiry filtering (`expiring_within_days`) |
| `internal/order` | **PASS** | **75.7%** | Order creation, VAT snapshots, Decimal weights, Wholesale tiers, Detail with VAT breakdown, List orders |
| `internal/auth` | **PASS** | **72.7%** | Login handler, Refresh handler, `/me` profile handler, password validation & bcrypt hashing |
| `internal/catalog` | **PASS** | **72.3%** | Categories, Tax Categories, Products CRUD, search filtering, unit conversion, image upload validation |

---

## 2. Deep Dive: Core Financial Test Suites

### 2.1 Tax Engine Suite (`internal/tax/tax_test.go`)
- **Mixed VAT Verification:** Validates that 2 Pens @ 5,000 (8%) + 0.7 kg Beef @ 250,000 (0%) + 1 Milk @ 32,000 (8%) generates exactly 3,360 VND VAT and aggregates correctly into groups `0%` (0 VND) and `8%` (3,360 VND).
- **Zero & Negative Protection:** Ensures items with 0 tax rate or negative amounts evaluate safely without panic.

### 2.2 Money Math Suite (`pkg/money/money_test.go`)
- **Rounding Half-Up:** Ensures amounts ending in 1 - 49 round down and 50 - 99 round up to the nearest 100 VND.
- **Large Volume Arithmetic:** Verifies billions of VND without 64-bit integer overflow.

### 2.3 Unit Resolver Suite (`pkg/unit/resolver_test.go`)
- **Multi-Unit Hierarchy:** Verifies that purchasing 30 packages resolves properly to 1 carton and preserves fractional weights.

---

## 3. Running Coverage Locally

To generate an HTML visual coverage report:

```bash
# Run test suite with coverage profile output
docker compose exec api go test -coverprofile=coverage.out ./...

# View coverage summary in terminal
docker compose exec api go tool cover -func=coverage.out

# Export interactive HTML visual breakdown
docker compose exec api go tool cover -html=coverage.out -o coverage.html
```
