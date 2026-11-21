---
title: Business Analyst
sidebar_label: Business Analyst
sidebar_position: 3
---

## Overview
This document outlines the domain logic, system interactions, and business rules within the Laptech API platform. The system uses Domain-Driven Design (DDD), which closely maps the software architecture to the actual business processes.

## Core Business Workflows

### 1. Order Fulfillment Flow
1. **Cart & Order Creation (Order Service)**: The user converts their server cart into an Order (`POST /api/orders`). Checkout synchronously verifies each cart line's frozen unit price against the current Catalog price (returning `409 PRICE_CHANGED` if it drifted — see [ADR-0002](../adr/0002-order-snapshot-and-checkout-price.md)). Product details are snapshotted onto the order for historical accuracy.
2. **Event Published**: Order lifecycle events are published to RabbitMQ (`laptech.order` exchange).
3. **Inventory Allocation (Inventory Service — Planned Phase 3)**: Async RabbitMQ reservation consumer (temporary stock reservation on `OrderCreated`, permanent deduction on `PaymentSucceeded`, release on failure/expiry) is designed in the Phase 3 roadmap and not yet active at checkout.
4. **Payment Processing (Payment Service)**: Initiates payment via pluggable strategy (`COD`, `MOMO`, `VNPAY`, `STRIPE`). Live VNPay/Stripe sandbox webhook callbacks are scheduled for Phase 2.

### 2. Promotion & Best-Deal Optimization _(Planned)_
* **Promotion Service**: Manages voucher and discount domain rules.
* **Current checkout behavior**: Per [ADR-0002](../adr/0002-order-snapshot-and-checkout-price.md), checkout does not yet accept voucher codes (`discountTotal` and `shippingFee` are `0`) until promotion evaluation is wired into checkout.

### 3. Catalog Management
* **Catalog Service**: The central source of truth for product information.
* **Caching Strategy**: Redis is used to cache catalog data, significantly reducing database load for frequent customer searches and browsing.

## Domain Models (Key Entities)
* **Identity**: `User`, `Role`, `Permission` (PBAC model).
* **Catalog**: `Product`, `Category`, `Brand`, `ProductVariant`.
* **Order**: `Order`, `OrderItem`, `Cart`.
* **Payment**: `PaymentTransaction`, `ShipmentMethod`.

## Communication
* **Synchronous (OpenFeign)**: Used for direct queries (e.g., the Order service asking the Catalog service for current product prices).
* **Asynchronous (RabbitMQ)**: Used for state changes (e.g., an Order being created triggers downstream effects without making the user wait).
