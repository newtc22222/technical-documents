---
title: Business Analyst
sidebar_label: Business Analyst
sidebar_position: 3
---

## Overview
This document outlines the domain logic, system interactions, and business rules within the Laptech API platform. The system uses Domain-Driven Design (DDD), which closely maps the software architecture to the actual business processes.

## Core Business Workflows

### 1. Order Fulfillment Flow
The order lifecycle is highly asynchronous, improving performance and user experience.
1. **Cart & Order Creation (Order Service)**: The user converts their cart into an Order. Product data is denormalized (copied) to ensure historical accuracy of price and details at the time of purchase.
2. **Event Published**: An `OrderCreated` event is published to RabbitMQ.
3. **Inventory Allocation (Inventory Service)**: Listens for the order and temporarily reserves stock.
4. **Payment Processing (Payment Service)**: Handles payment collection. Supports pluggable payment methods.
5. **Finalization**: Upon successful payment, the order status is updated to `PAID`, and inventory reservations are permanently deducted. If payment fails, inventory is released.

### 2. Promotion & Best-Deal Optimization
* **Promotion Service**: Manages vouchers and automated discounts.
* **Business Rule**: The system evaluates all applicable promotions for a user's cart and automatically applies the combination that yields the highest savings ("best-deal optimization").

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
