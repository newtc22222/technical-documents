---
id: intro
title: Grocery Store Documentation
sidebar_label: Overview
sidebar_position: 0
description: Technical reference for the Grocery Store Sales Management POS & Tax Application.
---

# Grocery Store — Sales Management POS & Tax Application

Welcome to the **Grocery Store (Sales Management POS & Tax Application)** technical documentation. This doc set covers the system architecture, data model, Vietnamese tax & rounding rules, API contracts, WCAG AAA elderly-friendly UI design, architecture decision records (ADRs), QA verification, and operational runbooks.

:::note Current state (v0.6.0)
The repository (`newtc22222/grocery-store`) is at **v0.6.0** (2026-11-10) running **Go 1.23**, **Angular 19.2** (PWA), **PostgreSQL 16**, **Redis 7.4**, and **MinIO**.

The topic pages below were imported from the v0.1.0 MVP wiki baseline. Features shipped in **v0.2.0 – v0.6.0** (CQT e-invoices, customer debt ledger, 5 eye-comfort themes, VietQR + voice readout, held orders, proportional VAT discount, KCT exempt tax, order voiding, offline PWA SW, and end-of-day drawer reconciliation) are summarized in the [Release Changelog](./releases/changelog.md).
:::

---

## Executive Summary

The **Sales Management POS & Tax Application** is designed for Vietnamese small grocery stores, mini-marts, and retail households. It addresses three core operational needs:

1. **Elderly-Friendly Accessibility (WCAG AAA):** Large typography hierarchy (≥ 18px body font), giant touch targets (96px checkout and cancel actions), high-contrast styling (≥ 7:1), eye-comfort color themes, and a simplified layout to eliminate mis-clicks.
2. **Vietnamese Tax Compliance (2025/2026 Rules):** Per-line VAT calculation (KCT exempt, 0% unprocessed fresh food, 5% preferential, 8% reduced standard rate), 1% presumptive retail PIT estimation, immutable invoice snapshotting, cash rounding to the nearest 100 VND, and CQT electronic invoice support.
3. **Multi-Unit Inventory & Weight Selling:** Multiple selling units per product (piece, box, carton) with automatic unit price conversion, wholesale quantity tiers, decimal weight entry via an integrated touch keypad, and FIFO batch/expiry tracking.

---

## Documentation Sections

| Section | What it covers |
| --- | --- |
| [System Architecture](./architecture/overview.md) | System overview, Go backend layers, Angular frontend architecture, and Docker Compose infrastructure. |
| [Data Model](./data-model/erd.md) | Entity-relationship diagram, schema dictionary, SQL migrations, and seed dataset. |
| [Business Logic](./business-logic/tax-engine.md) | Vietnamese tax engine, zero-float money & rounding, multi-unit conversions, weight-based sales, and FIFO expiry tracking. |
| [API Reference](./api-reference/overview.md) | Authentication, catalog, inventory/batches, orders/invoices, and reports/Excel export endpoints. |
| [UI & UX Design](./ui-ux/accessibility-wcag-aaa.md) | WCAG AAA accessibility standards, design tokens, 12-screen walkthrough, and Vietnamese localization. |
| [Architecture Decisions](./adr/index.md) | ADRs 0001–0006: Docker scaffolding, monorepo binaries, zero `float64` money, tax snapshotting, WCAG AAA, and embedded Roboto PDF fonts. |
| [Quality Assurance](./quality-assurance/test-strategy.md) | Test strategy, backend test coverage, E2E & Axe-Core accessibility audits, and 13-step live API smoke testing. |
| [Operations & Setup](./operations/local-setup.md) | Single-command local setup, Makefile cheatsheet, configuration reference, troubleshooting, and backup/recovery. |
| [Releases](./releases/changelog.md) | Release history from v0.1.0 (MVP) through v0.6.0. |

---

## Seed User Personas

| Username | Password | Role | Name | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| `owner` | `Owner@123` | `owner` | Nguyễn Văn An | Full administrative rights: catalog edit, sales, inventory, monthly reports, tax export. |
| `cashier` | `Cashier@123` | `cashier` | Trần Thị Bình | Storefront operational rights: POS checkout, product lookups, batch inspection. |
| `viewer` | `Viewer@123` | `viewer` | Lê Văn Cường | Read-only analytics: daily/monthly reports, tax compliance dashboards. |

*Quick-fill 1-tap buttons for these accounts are provided directly on the login screen.*
