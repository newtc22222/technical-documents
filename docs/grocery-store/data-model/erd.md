---
id: erd
title: "Entity-Relationship Diagram (ERD)"
sidebar_label: "Entity-Relationship Diagram"
sidebar_position: 1
description: "Entity-Relationship Diagram — Grocery Store POS & Tax Application."
---
# Entity-Relationship Diagram (ERD)

This document visualizes the complete relational data model of the **Sales Management POS & Tax Application**. The database is hosted on **PostgreSQL 16** with UUID primary keys (`gen_random_uuid()`) and exact decimal representations for financial transactions.

---

## 1. Complete System ERD (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places / processes"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    CATEGORIES ||--o{ PRODUCTS : "classifies"
    TAX_CATEGORIES ||--o{ PRODUCTS : "governs tax rate"
    PRODUCTS ||--|{ PRODUCT_UNITS : "has conversions"
    PRODUCTS ||--o{ PRODUCT_BATCHES : "tracked in stock"
    CUSTOMERS ||--o{ ORDERS : "purchases"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "sold as line item"
    PRODUCT_UNITS ||--o{ ORDER_ITEMS : "priced via unit"

    USERS {
        uuid id PK "gen_random_uuid()"
        varchar username UK "unique, 50 chars"
        varchar password_hash "bcrypt cost 12"
        varchar full_name "100 chars"
        varchar role "CHECK ('owner','cashier','viewer')"
        boolean is_active "default true"
        timestamptz created_at "default CURRENT_TIMESTAMP"
    }

    CATEGORIES {
        uuid id PK "gen_random_uuid()"
        varchar name "100 chars"
        varchar slug UK "unique, 100 chars"
        int sort_order "default 0"
    }

    TAX_CATEGORIES {
        uuid id PK "gen_random_uuid()"
        varchar name "100 chars"
        numeric vat_rate "NUMERIC(5,2)"
        numeric pit_rate "NUMERIC(5,2)"
        date effective_from "date valid"
        date effective_to "null if ongoing"
        text notes "legal references"
    }

    PRODUCTS {
        uuid id PK "gen_random_uuid()"
        varchar sku UK "unique, 50 chars"
        varchar name "255 chars"
        uuid category_id FK "REFERENCES categories(id)"
        uuid tax_category_id FK "REFERENCES tax_categories(id)"
        varchar base_unit "20 chars (e.g. piece, kg)"
        text image_url "MinIO S3 URL"
        boolean is_active "default true"
        timestamptz created_at "default CURRENT_TIMESTAMP"
    }

    PRODUCT_UNITS {
        uuid id PK "gen_random_uuid()"
        uuid product_id FK "REFERENCES products(id) ON DELETE CASCADE"
        varchar unit_name "50 chars (piece, box, carton)"
        numeric conversion_rate "NUMERIC(12,4) CHECK > 0"
        numeric price_retail "NUMERIC(14,2)"
        numeric price_wholesale "NUMERIC(14,2) NULL"
        numeric min_wholesale_qty "NUMERIC(12,3) NULL"
        boolean is_base "default false"
    }

    PRODUCT_BATCHES {
        uuid id PK "gen_random_uuid()"
        uuid product_id FK "REFERENCES products(id) ON DELETE CASCADE"
        varchar batch_no "50 chars"
        date expiry_date "expiry threshold"
        numeric quantity "NUMERIC(14,3)"
        numeric cost_price "NUMERIC(14,2)"
        timestamptz received_at "default CURRENT_TIMESTAMP"
    }

    CUSTOMERS {
        uuid id PK "gen_random_uuid()"
        varchar name "100 chars"
        varchar phone "20 chars"
        text address "delivery/billing address"
        boolean is_wholesale "default false"
        numeric debt "NUMERIC(14,2) default 0"
    }

    ORDERS {
        uuid id PK "gen_random_uuid()"
        varchar code UK "unique, ORD-YYYYMMDD-XXXX"
        varchar type "CHECK ('retail','wholesale','weight')"
        uuid customer_id FK "REFERENCES customers(id) ON DELETE SET NULL"
        uuid user_id FK "REFERENCES users(id) ON DELETE RESTRICT"
        numeric subtotal "NUMERIC(14,2)"
        numeric discount "NUMERIC(14,2) default 0"
        numeric vat_total "NUMERIC(14,2)"
        numeric grand_total "NUMERIC(14,2)"
        varchar status "CHECK ('draft','paid','cancelled')"
        timestamptz created_at "default CURRENT_TIMESTAMP"
    }

    ORDER_ITEMS {
        uuid id PK "gen_random_uuid()"
        uuid order_id FK "REFERENCES orders(id) ON DELETE CASCADE"
        uuid product_id FK "REFERENCES products(id) ON DELETE RESTRICT"
        uuid unit_id FK "REFERENCES product_units(id) ON DELETE RESTRICT"
        numeric quantity "NUMERIC(12,3)"
        numeric weight_kg "NUMERIC(10,3) NULL"
        numeric unit_price "NUMERIC(14,2)"
        numeric line_total "NUMERIC(14,2)"
        numeric vat_rate "NUMERIC(5,2) (Snapshot)"
        numeric vat_amount "NUMERIC(14,2) (Snapshot)"
    }

    AUDIT_LOGS {
        uuid id PK "gen_random_uuid()"
        uuid user_id FK "REFERENCES users(id) ON DELETE SET NULL"
        varchar action "50 chars (POST, PUT, DELETE)"
        varchar entity "50 chars (product, order, etc.)"
        varchar entity_id "100 chars"
        jsonb payload "JSON snapshot of mutation"
        timestamptz created_at "default CURRENT_TIMESTAMP"
    }
```

---

## 2. Referential Integrity & Cascade Rules

| Parent Entity | Child Entity | Foreign Key Column | On Delete Action | Business Reason |
| :--- | :--- | :--- | :--- | :--- |
| `products` | `product_units` | `product_id` | **CASCADE** | Deleting a product removes all of its associated unit configurations. |
| `products` | `product_batches` | `product_id` | **CASCADE** | Deleting a product removes its inventory batch records. |
| `categories` | `products` | `category_id` | **RESTRICT** | Prevents accidental deletion of categories that currently contain active products. |
| `tax_categories` | `products` | `tax_category_id` | **RESTRICT** | Prevents deletion of tax rules that are linked to catalog items. |
| `orders` | `order_items` | `order_id` | **CASCADE** | Deleting an order document cascades to its line item constituents. |
| `products` | `order_items` | `product_id` | **RESTRICT** | Historic order records cannot lose their product references. |
| `product_units` | `order_items` | `unit_id` | **RESTRICT** | Historic line items preserve their unit measurement references. |
| `users` | `orders` | `user_id` | **RESTRICT** | Financial orders cannot have their issuing cashier or owner removed. |
| `customers` | `orders` | `customer_id` | **SET NULL** | Deleting an ad-hoc customer keeps the financial transaction intact with an anonymous customer reference. |
| `users` | `audit_logs` | `user_id` | **SET NULL** | Preserves historical audit traces even if an operator account is purged. |
