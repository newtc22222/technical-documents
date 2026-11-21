---
id: improvements
title: Roadmap & Planned Improvements
sidebar_label: Roadmap & Improvements
sidebar_position: 2
description: Current platform milestones and planned roadmap phases for Laptech Store.
---

# Roadmap & Planned Improvements

## Completed Milestones

- **Phase 1 (Stabilized / GA):** Storefront QA, VND currency formatting and budget tiers, PBAC seeding & lock hardening, distributed Redis access-token revocation, CSRF guard (`X-Laptech-Client: web`), and admin release (`release/admin-2026-10-28`).
- **Phase 4 (Stabilized / GA):** Admin Workbench redesign on React 19, Vite 8, and Ant Design 6 (flat layout, Be Vietnam Pro typography, WCAG AA contrast checks, `PermissionGuard`-only PBAC, command palette, single-flight token refresh).

## Planned Roadmap Phases (Ready for Implementation)

### Phase 2 — Checkout & Payment Providers
- Wire live sandbox integrations and server-to-server webhook/callback verification for **VNPay** and **Stripe** (currently strategy stubs alongside `COD`).
- Finalize checkout promotion/voucher integration once discount rules are enabled (currently `discountTotal` and `shippingFee` are `0` per [ADR-0002](../adr/0002-order-snapshot-and-checkout-price.md)).

### Phase 3 — Inventory Reservation & Content Hardening
- Implement the asynchronous **RabbitMQ inventory reservation consumer** (listen to `OrderCreated`, temporarily reserve stock, commit on `PaymentSucceeded`, release on failure/expiry) with DLQ handling and scheduled stale-reservation cleanup.
- Harden content moderation and finalize remaining review/comment response contracts.

### Phase 5 — Build & Runtime Upgrades
- Migrate `laptech-api` from Maven 3.9 / Java 21 / Spring Boot 3.5.8 / Spring Cloud 2025.0.0 to **Gradle 9.8.0**, **JDK 25**, **Spring Boot 4.1.1**, and **Spring Cloud 2025.1.3**.

## Remaining Auth & Security Backlog

- Implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` flows.
- Add rate limiting on authentication endpoints to mitigate brute-force attempts.
- Evaluate OAuth2 social login and optional MFA for admin/manager accounts.
- Periodic JWT signing-key rotation strategy.
