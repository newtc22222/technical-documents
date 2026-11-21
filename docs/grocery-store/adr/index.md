---
id: index
title: "Architecture Decision Records (ADR) Index"
sidebar_label: "ADR Index"
sidebar_position: 1
description: "ADR Index — Grocery Store POS & Tax Application."
---
# Architecture Decision Records (ADR) Index

This directory maintains the immutable history of architectural, technical, and domain engineering decisions governing the design and implementation of the **Sales Management POS & Tax Application**.

---

## Decision Log

| ADR # | Title | Date | Status | Impact Area | Summary |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **0001** | [Scaffolding & Docker Architecture](0001-scaffolding-and-docker.md) | 2026-10-07 | **Accepted** | DevOps / Infra | Use lightweight Alpine Docker images and local multi-container Docker Compose stack for single-command bootstrap. |
| **0002** | [Monorepo Executable Binaries](0002-monorepo-binaries.md) | 2026-10-07 | **Accepted** | Backend Architecture | Compile three distinct entrypoints (`/app/api`, `/app/migrate`, `/app/seed`) into the API image to fulfill Makefile targets cleanly. |
| **0003** | [Zero float64 for Money Calculations](0003-zero-float64-money.md) | 2026-10-07 | **Accepted** | Business Domain / Math | Represent all currency in `pkg/money.VND` as `int64` and use `shopspring/decimal` for weights and tax multipliers. |
| **0004** | [Tax Engine Line Snapshotting](0004-tax-snapshotting.md) | 2026-10-07 | **Accepted** | Tax / Database | Snapshot `vat_rate` and `vat_amount` directly onto `order_items` during checkout to guarantee immutable historical audits. |
| **0005** | [Elderly-Friendly WCAG AAA Accessibility](0005-wcag-aaa-accessibility.md) | 2026-10-07 | **Accepted** | Frontend / UI-UX | Mandate ≥ 18px fonts, ≥ 7:1 contrast ratios, 96px giant action buttons, and 2-step destructive cancellation dialogs. |
| **0006** | [Native Vietnamese PDF Invoices with Roboto TTF](0006-embedded-roboto-pdf.md) | 2026-10-07 | **Accepted** | Documents / Invoicing | Embed TrueType Roboto fonts directly into Go binary via `//go:embed` for flawless UTF-8 Vietnamese invoice rendering. |
