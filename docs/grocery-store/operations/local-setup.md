---
id: local-setup
title: "Local Development Setup Guide"
sidebar_label: "Local Setup Guide"
sidebar_position: 1
description: "Local Setup Guide — Grocery Store POS & Tax Application."
---
# Local Development Setup Guide

This guide walks through setting up, booting, and verifying the **Sales Management POS & Tax Application** on a local development workstation.

---

## 1. System Prerequisites

Before starting, ensure your machine has the following installed:
- **Operating System:** Windows 10/11 with **WSL2** (Ubuntu 22.04 LTS or newer) OR native Linux (Ubuntu, Debian, Fedora, Arch) OR macOS (Apple Silicon / Intel).
- **Docker Engine & Docker Compose:** Docker Desktop (with WSL2 backend enabled) or native Docker Engine v24+.
- **GNU Make:** Required for running Makefile orchestration commands (`sudo apt-get install make`).

---

## 2. Fast Bootstrap (Single-Command Sequence)

Open your terminal in WSL2/Linux, navigate to the project directory, and execute:

```bash
# 1. Start all Docker containers (Postgres, Redis, MinIO, API, Web)
make up

# 2. Run database migrations to create schema and extensions
make migrate

# 3. Populate database with sample users, catalog items, and batches
make seed

# 4. Verify test suites
make test
```

The entire boot sequence typically finishes in **under 2 minutes** on a standard modern PC.

---

## 3. Verifying Application Services

Once booted, open your browser and verify the operational endpoints:

| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Web Application** | [http://localhost:4200](http://localhost:4200) | Angular 20 POS storefront |
| **REST API Server** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Backend root endpoint |
| **API Healthcheck** | [http://localhost:8080/health](http://localhost:8080/health) | Returns `{"status":"ok"}` |
| **MinIO S3 Console** | [http://localhost:9001](http://localhost:9001) | User: `minioadmin` / Pass: `minioadmin` |
| **PostgreSQL DB** | `localhost:5432` | DB: `salesdb`, User: `sales`, Pass: `sales_dev_pw` |
| **Redis Cache** | `localhost:6379` | Standard Redis port |

---

## 4. Logging In to the Web Application

1. Open [http://localhost:4200](http://localhost:4200) in Google Chrome or Microsoft Edge.
2. The login screen provides **1-tap quick login buttons** for sample personas:
   - **Chủ tiệm (Store Owner):** Username `owner` / `Owner@123`
   - **Thu ngân (Cashier):** Username `cashier` / `Cashier@123`
   - **Xem báo cáo (Auditor / Viewer):** Username `viewer` / `Viewer@123`
3. Click **Thu ngân** to jump straight into the POS selling experience!

---

## 5. Shutting Down & Resetting

```bash
# Stop containers without removing persistent database volumes
make down

# Complete reset: wipes database volumes and re-boots stack
make reset
```
