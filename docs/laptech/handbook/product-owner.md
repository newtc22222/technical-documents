---
title: Product Owner
sidebar_label: Product Owner
sidebar_position: 2
---

## Overview
Laptech API is an advanced E-commerce platform. For the Product Owner, the primary focus is on how this system supports business goals, scales with demand, and encapsulates distinct business domains.

## Business Capabilities by Domain
The system is divided into bounded contexts (domains) to align with business functions:
* **Identity**: Manages users, authentication (JWT + rotated HttpOnly refresh cookie + Redis revocation), and Permission-Based Access Control (PBAC — 5 seeded roles, 69 permissions, role hierarchy DAG).
* **Catalog**: Manages products, combinable search/filters, categories, brands, tags, attributes, and Cloudflare R2 media. Uses Redis caching for fast storefront browsing.
* **Inventory**: Tracks stock levels and warehouses. *(Async RabbitMQ stock reservation during checkout is scheduled for Phase 3.)*
* **Order**: Manages guest-to-server shopping cart merge, checkout with catalog price verification ([ADR-0002](../adr/0002-order-snapshot-and-checkout-price.md)), order lifecycle, and admin status counts.
* **Payment**: Manages payment initiation (`COD`, `MOMO`, `VNPAY`, `STRIPE` strategy) and admin payment-provider configuration. *(Live VNPay/Stripe sandbox callbacks are scheduled for Phase 2.)*
* **Promotion**: Promotion and voucher domain. *(Checkout voucher/discount wiring is planned; currently `discountTotal` is `0`.)*
* **Content**: Manages product reviews and threaded comments (including `[deleted]` placeholder retention for active reply threads).

## Web Applications
* **Storefront (`laptech-client-web-ui`)**: Next.js 16 customer experience with Shop by Need / Laptop Finder, VND currency tiers, brand/price/tag filters, search, compare, and guest/server cart checkout.
* **Admin Workbench (`laptech-admin-web-ui`)**: Ant Design 6 flat workbench with `PermissionGuard` PBAC for catalog, R2 media, orders, users, roles/permissions, and payment provider settings.

## Strategic Value
* **Modular Monolith Architecture**: Provides the simplicity of a monolith with the strict boundaries of microservices. This means faster initial delivery, easier maintenance, and the ability to seamlessly split into microservices in the future when traffic demands it.
* **Scalability & Reliability**: With asynchronous communication via RabbitMQ, a spike in order volume won't crash the payment or inventory services.
* **Granular Security**: PBAC allows for highly customizable user roles, empowering precise control over who can perform specific actions (e.g., managing products, processing refunds).

## Roadmap Considerations
* Transitioning high-load modules (like Catalog or Order) into standalone microservices.
* Integrating additional payment gateways.
* Advanced analytics and reporting derived from domain events.
