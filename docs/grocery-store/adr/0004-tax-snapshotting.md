---
id: 0004-tax-snapshotting
title: "ADR 0004: Tax Engine Line Snapshotting"
sidebar_label: "0004: Tax Snapshotting"
sidebar_position: 5
description: "0004: Tax Snapshotting — Grocery Store POS & Tax Application."
---
# ADR 0004: Tax Engine Line Snapshotting

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Backend Order Agent, Technical Orchestrator

---

## Context
Tax laws in Vietnam change over time. For example, the government implemented a temporary 2% VAT reduction from 10% to 8% under Decree 72/2024/NĐ-CP. When tax rates update in the future (e.g. returning to 10% or introducing new brackets), previously settled orders and historical accounting records must never change retroactively.

## Decision
The tax engine calculates VAT dynamically during order checkout, but rather than referencing foreign keys dynamically during report generation, the system saves an **immutable snapshot** of `vat_rate` and `vat_amount` directly onto each row in the `order_items` table:
- `order_items.vat_rate NUMERIC(5,2)`
- `order_items.vat_amount NUMERIC(14,2)`

When regenerating historical invoices or pulling past tax reports, the system reads from these immutable snapshots rather than joining with current `tax_categories` rates.

## Consequences

### Positive
- Historical accounting records and re-printed PDF invoices remain 100% legally compliant and tamper-proof.
- Upgrading or editing a tax rule in `tax_categories` carries zero risk of breaking historical ledger integrity.
- Fast analytical queries without multi-table relational joins to resolve historic tax rules.

### Negative / Tradeoffs
- Slight denormalization of data across `orders` and `order_items`.
