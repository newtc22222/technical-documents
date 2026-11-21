---
id: 0003-zero-float64-money
title: "ADR 0003: Zero float64 for Money Calculations"
sidebar_label: "0003: Zero float64 Money"
sidebar_position: 4
description: "0003: Zero float64 Money — Grocery Store POS & Tax Application."
---
# ADR 0003: Zero float64 for Money Calculations

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Backend Tax Agent, Technical Orchestrator

---

## Context
Currency calculations in Vietnamese Dong (VND) cannot tolerate IEEE-754 floating-point binary approximations (e.g. `0.1 + 0.2 != 0.3`). Because Vietnamese tax calculations involve multi-item VAT aggregation, weight multiplications (e.g. 0.700 kg of beef), and legal cash rounding to the nearest 100 VND, any fractional floating-point truncation introduces off-by-one errors on invoice totals and audit mismatches.

## Decision
We enforce a strict **Zero `float64` for Money** policy across the entire backend:
1. All monetary values are represented as `int64` wrapped in the custom type `pkg/money.VND`.
2. All non-integer multiplications (weights, percentage tax rates, unit conversion factors) are handled exclusively via `github.com/shopspring/decimal`.
3. Intermediate tax computations use basis points (`int64 TaxRateBp`, where 8% = 800 bp).
4. Final cash totals apply integer half-up rounding to the nearest 100 VND.

## Consequences

### Positive
- 100% deterministic, mathematically exact calculations across all transaction sizes.
- Full compliance with Vietnamese state auditing standards.
- Invoices match the exact sum of line items to the single Dong.

### Negative / Tradeoffs
- Developers must explicitly convert through `pkg/money` and `shopspring/decimal` rather than native Go mathematical operators (`*`, `/`).
- Unit tests must enforce coverage on negative and edge cases.
