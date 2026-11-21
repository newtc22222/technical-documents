---
id: database-schema
title: "Database Schema Dictionary"
sidebar_label: "Database Schema"
sidebar_position: 2
description: "Database Schema — Grocery Store POS & Tax Application."
---
# Database Schema Dictionary

This document provides the full data dictionary for all tables in PostgreSQL (`salesdb`). The database schema is initialized using `pgcrypto` for UUID generation and enforces strict data integrity constraints.

---

## 1. Table: `users`
Stores system operators, credentials, and access roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique user identifier |
| `username` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | System login handle |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hash (Cost factor 12) |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Display name of the user |
| `role` | `VARCHAR(20)` | `NOT NULL`, `CHECK (role IN ('owner','cashier','viewer'))` | Role for RBAC authorization |
| `is_active` | `BOOLEAN` | `NOT NULL`, Default `true` | Account active status flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `CURRENT_TIMESTAMP` | Timestamp of account creation |

---

## 2. Table: `categories`
Organizes products into display categories for fast POS browsing.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique category identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Category name (e.g., "Thực phẩm tươi") |
| `slug` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` | URL-safe slug identifier |
| `sort_order` | `INT` | `NOT NULL`, Default `0` | Display order in the POS category bar |

---

## 3. Table: `tax_categories`
Configurable tax policy table supporting Vietnamese tax compliance.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique tax category identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Tax class name (e.g., "VAT 8% Hàng giảm thuế") |
| `vat_rate` | `NUMERIC(5,2)` | `NOT NULL` | VAT percentage rate (e.g., 0.00, 5.00, 8.00) |
| `pit_rate` | `NUMERIC(5,2)` | `NOT NULL` | Presumptive Personal Income Tax rate (1.00 for retail) |
| `effective_from`| `DATE` | `NOT NULL` | Date when rate becomes legally active |
| `effective_to` | `DATE` | `NULL` | Expiration date of tax rule (or NULL if ongoing) |
| `notes` | `TEXT` | `NULL` | Legislative references (e.g. Decree 72/2024/NĐ-CP) |

---

## 4. Table: `products`
Master catalog items representing sellable grocery products.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique product identifier |
| `sku` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Stock Keeping Unit / Barcode |
| `name` | `VARCHAR(255)` | `NOT NULL` | Full commercial product name |
| `category_id` | `UUID` | `NOT NULL`, `REFERENCES categories(id) ON DELETE RESTRICT` | Foreign key to `categories` |
| `tax_category_id`| `UUID` | `NOT NULL`, `REFERENCES tax_categories(id) ON DELETE RESTRICT` | Foreign key to `tax_categories` |
| `base_unit` | `VARCHAR(20)` | `NOT NULL` | Primary physical unit (`piece`, `kg`, `bottle`) |
| `image_url` | `TEXT` | `NULL` | S3 URL in MinIO `products` bucket |
| `is_active` | `BOOLEAN` | `NOT NULL`, Default `true` | Product active status flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `CURRENT_TIMESTAMP` | Catalog creation timestamp |

---

## 5. Table: `product_units`
Multi-unit conversions and retail/wholesale price definitions for products.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique unit identifier |
| `product_id` | `UUID` | `NOT NULL`, `REFERENCES products(id) ON DELETE CASCADE` | Parent product reference |
| `unit_name` | `VARCHAR(50)` | `NOT NULL` | Unit label (e.g., "gói", "hộp", "thùng") |
| `conversion_rate`| `NUMERIC(12,4)`| `NOT NULL`, `CHECK (conversion_rate > 0)` | Multiplier relative to `base_unit` (1.0 for base) |
| `price_retail` | `NUMERIC(14,2)`| `NOT NULL` | Standard retail price in VND |
| `price_wholesale`| `NUMERIC(14,2)`| `NULL` | Discounted wholesale unit price in VND |
| `min_wholesale_qty`|`NUMERIC(12,3)`| `NULL` | Threshold quantity to trigger wholesale pricing |
| `is_base` | `BOOLEAN` | `NOT NULL`, Default `false` | Indicates if this record represents the base unit |

---

## 6. Table: `product_batches`
Inventory batch tracking for FIFO cost valuation and perishable expiry alerts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique batch identifier |
| `product_id` | `UUID` | `NOT NULL`, `REFERENCES products(id) ON DELETE CASCADE` | Product in stock |
| `batch_no` | `VARCHAR(50)` | `NOT NULL` | Lot / Batch number from supplier |
| `expiry_date` | `DATE` | `NOT NULL` | Expiration date of the batch |
| `quantity` | `NUMERIC(14,3)`| `NOT NULL` | Remaining quantity in stock |
| `cost_price` | `NUMERIC(14,2)`| `NOT NULL` | Inward acquisition cost per unit |
| `received_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `CURRENT_TIMESTAMP` | Inward warehouse receiving date |

---

## 7. Table: `customers`
Customer directory for accounts, contact numbers, wholesale flags, and credit debt.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique customer identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Customer name or company entity |
| `phone` | `VARCHAR(20)` | `NULL` | Contact phone number |
| `address` | `TEXT` | `NULL` | Delivery or business billing address |
| `is_wholesale` | `BOOLEAN` | `NOT NULL`, Default `false` | Flag to automatically apply wholesale pricing |
| `debt` | `NUMERIC(14,2)`| `NOT NULL`, Default `0` | Outstanding receivable debt in VND |

---

## 8. Table: `orders`
Header table for sales transactions, totals, tax sums, and statuses.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique order identifier |
| `code` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Order code format: `ORD-YYYYMMDD-XXXX` |
| `type` | `VARCHAR(20)` | `NOT NULL`, `CHECK (type IN ('retail','wholesale','weight'))` | Transaction sales channel |
| `customer_id` | `UUID` | `NULL`, `REFERENCES customers(id) ON DELETE SET NULL` | Linked customer reference (or null for walk-ins) |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES users(id) ON DELETE RESTRICT` | Cashier or operator placing the transaction |
| `subtotal` | `NUMERIC(14,2)`| `NOT NULL` | Pre-tax sum of all line item totals in VND |
| `discount` | `NUMERIC(14,2)`| `NOT NULL`, Default `0` | Order-level discount amount in VND |
| `vat_total` | `NUMERIC(14,2)`| `NOT NULL` | Total calculated VAT across all lines |
| `grand_total` | `NUMERIC(14,2)`| `NOT NULL` | Final invoice total (rounded to nearest 100 VND) |
| `status` | `VARCHAR(20)` | `NOT NULL`, `CHECK (status IN ('draft','paid','cancelled'))`| Order settlement status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `CURRENT_TIMESTAMP` | Order timestamp |

---

## 9. Table: `order_items`
Line item details for each order, including immutable tax snapshots.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique line item identifier |
| `order_id` | `UUID` | `NOT NULL`, `REFERENCES orders(id) ON DELETE CASCADE` | Parent order reference |
| `product_id` | `UUID` | `NOT NULL`, `REFERENCES products(id) ON DELETE RESTRICT` | Sold product reference |
| `unit_id` | `UUID` | `NOT NULL`, `REFERENCES product_units(id) ON DELETE RESTRICT`| Specific unit selected |
| `quantity` | `NUMERIC(12,3)`| `NOT NULL` | Quantity purchased (e.g. 2 pieces or 0.7 kg) |
| `weight_kg` | `NUMERIC(10,3)`| `NULL` | Electronic scale weight in kg (for weight items) |
| `unit_price` | `NUMERIC(14,2)`| `NOT NULL` | Effective unit price at time of sale |
| `line_total` | `NUMERIC(14,2)`| `NOT NULL` | Subtotal for this line: `unit_price * quantity` |
| `vat_rate` | `NUMERIC(5,2)` | `NOT NULL` | **Snapshot:** Effective VAT percentage (0%, 5%, 8%) |
| `vat_amount` | `NUMERIC(14,2)`| `NOT NULL` | **Snapshot:** Calculated VAT amount in VND |

---

## 10. Table: `audit_logs`
Immutable security and mutation log for auditing administrative and financial actions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default `gen_random_uuid()` | Unique log identifier |
| `user_id` | `UUID` | `NULL`, `REFERENCES users(id) ON DELETE SET NULL` | Operator initiating the action |
| `action` | `VARCHAR(50)` | `NOT NULL` | Action type (e.g., `POST`, `PUT`, `DELETE`) |
| `entity` | `VARCHAR(50)` | `NOT NULL` | Target resource (e.g., `products`, `orders`) |
| `entity_id` | `VARCHAR(100)`| `NULL` | Primary key identifier of target entity |
| `payload` | `JSONB` | `NULL` | JSON serialization of request payload |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, Default `CURRENT_TIMESTAMP` | Timestamp of log event |
