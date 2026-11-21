---
id: overview
title: "System Architecture Overview"
sidebar_label: "System Overview"
sidebar_position: 1
description: "System Overview — Grocery Store POS & Tax Application."
---
# System Architecture Overview

The **Sales Management POS & Tax Application** is structured as a modern, decoupled client-server architecture containerized via Docker Compose. It is optimized for high reliability, minimal cognitive load for elderly retail workers, strict compliance with Vietnamese tax statutes, and local deployment in small grocery shops.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph UserInterface ["Client Device (Desktop / Tablet Touchscreen)"]
        Browser["Modern Web Browser<br/>(Chromium / Safari / Firefox)"]
        AngularApp["Angular 20 Single Page Application<br/>- Standalone Components<br/>- Reactive Signals Architecture<br/>- WCAG AAA Accessible Custom Theme<br/>- Vietnamese Localization"]
        Browser --> AngularApp
    end

    subgraph ContainerStack ["Docker Compose Environment (WSL2 / Linux)"]
        subgraph WebTier ["Web Tier"]
            NginxOrNode["Web Container (sales-web)<br/>Port 4200"]
        end

        subgraph APITier ["Backend API Tier"]
            GinApp["Go 1.23 REST API Service (sales-api)<br/>Port 8080"]
            AuthMod["Authentication & RBAC<br/>(JWT HS256)"]
            CatalogMod["Product & Unit Catalog"]
            InventoryMod["Batch & Expiry Tracker (FIFO)"]
            OrderMod["Order Engine & VAT Snapshots"]
            TaxMod["Vietnamese Tax Engine"]
            ReportMod["Daily/Monthly & Tax Reporting"]
            DocEngines["Maroto PDF & Excelize Exporters"]
        end

        subgraph StorageTier ["Data & Storage Tier"]
            PG[("PostgreSQL 16 Database<br/>salesdb • Port 5432<br/>(ACID Transactions, UUIDs, Decimal)")]
            Redis[("Redis 7.4 In-Memory Store<br/>Port 6379<br/>(Sessions & Fast Caches)")]
            MinIO[("MinIO S3 Compatible Storage<br/>Ports 9000 / 9001<br/>(Buckets: products, invoices)")]
        end
    end

    AngularApp -->|HTTP / REST (Port 4200)| NginxOrNode
    AngularApp -->|JSON REST Requests + JWT Bearer (Port 8080)| GinApp

    GinApp --> AuthMod
    GinApp --> CatalogMod
    GinApp --> InventoryMod
    GinApp --> OrderMod
    GinApp --> TaxMod
    GinApp --> ReportMod
    GinApp --> DocEngines

    GinApp -->|GORM / pgx TCP (Port 5432)| PG
    GinApp -->|Redis Protocol TCP (Port 6379)| Redis
    GinApp -->|S3 REST API (Port 9000)| MinIO
    Browser -->|Direct Image URL / MinIO Web Console (Port 9001)| MinIO
```

---

## 2. Technology Stack & Component Responsibilities

| Layer | Technology | Version | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Angular | 20.x | Single Page Application (SPA), Standalone Components, Angular Signals for reactive state, Angular Material foundation. |
| **Styling & Accessibility** | SCSS + Custom Tokens | WCAG AAA | Custom accessible theme ensuring ≥ 18px text, ≥ 7:1 contrast ratios, and oversized 96px touch targets. |
| **Backend Runtime** | Go (Golang) | 1.23 | High-throughput, low-latency compiled REST API server with low memory footprint suitable for edge/local shop PCs. |
| **Web Routing Framework** | Gin Web Framework | v1.10+ | Fast HTTP request routing, middleware chain execution, JSON binding and validation. |
| **ORM / Data Access** | GORM | v1.25+ | Object-Relational Mapping, schema management, preloading relations, transactional order placement. |
| **Database** | PostgreSQL | 16-alpine | Primary transactional store, pgcrypto UUID generator, decimal numeric types for financial accuracy. |
| **In-Memory Cache** | Redis | 7.4-alpine | Session state management, rate limiting, and frequently read catalog caches. |
| **Object Storage** | MinIO | 2025.7 | Local S3-compatible object storage for product images and generated PDF invoice archives. |
| **PDF Invoice Generation** | Maroto (UniPDF/Maroto) | v0.42 | High-speed PDF rendering with embedded Google Roboto UTF-8 fonts for native Vietnamese diacritics. |
| **Spreadsheet Reporting**| Excelize | v2.9+ | Generation of `.xlsx` multi-sheet financial and tax reports for accounting. |
| **Orchestration** | Docker Compose | v2+ | Single-command local provisioning (`make up`), multi-container networking, healthchecks. |

---

## 3. Core Architectural Principles

### 3.1 Strict Financial Accuracy (Zero `float64` for Money)
Vietnamese Dong (VND) transactions must not experience floating-point truncation or off-by-one errors common to IEEE-754 numbers:
- All monetary representations in Go are wrapped in `pkg/money.VND` as `int64`.
- High-precision multipliers, weight quantities (kg down to grams), and unit conversion factors use `github.com/shopspring/decimal`.
- Final cash checkout totals are rounded to the nearest 100 VND using a dedicated half-up rounding algorithm per Vietnamese retail cash practices.

### 3.2 Immutable Tax Snapshots
Tax legislation changes periodically (e.g., Vietnam's temporary 2% VAT reduction from 10% to 8%). When an order is placed:
- The Tax Engine calculates the tax rate and tax amount for each line item.
- The exact `vat_rate` and `vat_amount` are copied directly into the `order_items` table.
- Future rate modifications in `tax_categories` will never modify historical invoices, maintaining complete legal auditability.

### 3.3 Elderly-First Ergonomics
The client application is custom-engineered for elderly users:
- Typography: body text ≥ 18px, inputs 18px, headers 24px-32px, total displays 32px-36px.
- High Contrast: all foreground-to-background combinations exceed 7:1 (WCAG AAA).
- Oversized Action Targets: primary checkout ("THANH TOÁN") and cancel ("HỦY ĐƠN") buttons are styled with a massive **96px** height.
- Accidental Click Prevention: 2-step confirmation dialog on order cancellation.

### 3.4 Multi-Container Topology
The system runs via Docker Compose with dedicated containers for `postgres`, `redis`, `minio`, `api`, and `web`. Healthchecks ensure that dependent services boot in the correct order, and the entire stack can be initialized with a single `make up` command.
