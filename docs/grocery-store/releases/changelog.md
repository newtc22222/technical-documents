---
id: changelog
title: Release History (v0.1.0 – v0.6.0)
sidebar_label: Changelog (v0.6.0)
sidebar_position: 1
description: Release history of the Grocery Store POS & Tax Application from v0.1.0 through v0.6.0.
---

# Release History

Summary of shipped releases in `newtc22222/grocery-store` from the initial v0.1.0 MVP through the current **v0.6.0** release.

## v0.6.0 (Current)

**Senior-friendly POS ergonomics & drawer reconciliation**

- Polymer banknote quick-pay pills for fast cash checkout.
- Instant undo bar for accidental item additions/removals.
- Haptic tap feedback and spoken change readout.
- 1-tap quick customer debt recording at checkout.
- End-of-day cash drawer reconciliation workflow.
- Expanded cart layout for higher legibility.

## v0.5.0

**QA audit remediation & compliance hardening**

- Proportional VAT discount allocation across mixed-rate carts.
- KCT (exempt) tax category support alongside 0%, 5%, and 8% VAT rates.
- Consistent ICT (`Asia/Ho_Chi_Minh`) timezone handling for daily/monthly reports.
- FIFO batch expiry guard to prevent selling expired stock.
- Order voiding workflow with audit trail.
- Redis-backed API rate limiting.
- Offline PWA Service Worker (`ngsw-config.json`).

## v0.4.1

**Codebase hardening & WebUSB parity**

- `customer_id` filter validation on order/debt queries.
- Split POS screen into focused child components.
- WebUSB thermal receipt printing parity.
- Added project roadmap (`docs/ROADMAP.md`).

## v0.4.0

**Mom-first POS checkout & debt ledger**

- Interactive cash change calculator.
- VietQR payment code generation, Vietnamese amount-in-words display, and voice readout.
- Held orders queue (park and resume carts).
- Customer debt ledger with partial repayment tracking.

## v0.3.0

**Senior-friendly UI/UX redesign & themes**

- Full senior-friendly UI/UX redesign across POS, inventory, and reporting flows.
- 5 eye-comfort color themes selectable at runtime.
- Centralized Settings hub.
- Expanded UI walkthrough screenshots (36 screenshots in `docs/screenshots/`).

## v0.2.0

**CQT e-invoices, wholesale tiers & offline queue**

- Vietnamese CQT electronic invoice integration.
- Wholesale quantity pricing tiers and customer debt tracking.
- Inventory CRUD with MinIO image upload.
- Offline IndexedDB sales queue.
- 80mm thermal receipt printing.

## v0.1.0

**Initial MVP baseline**

- Go 1.23 backend (Clean Architecture) + Angular 19.2 frontend + PostgreSQL 16 + Redis 7.4 + MinIO.
- WCAG AAA high-contrast POS with multi-unit conversions, weight-based touch keypad, FIFO batch expiry alerts, immutable tax snapshotting, and embedded Roboto PDF invoice generation.
- Full technical wiki baseline (imported into the other sections of this documentation tree).
