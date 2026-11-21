---
id: troubleshooting
title: "Troubleshooting & Diagnostics"
sidebar_label: "Troubleshooting Guide"
sidebar_position: 4
description: "Troubleshooting Guide — Grocery Store POS & Tax Application."
---
# Troubleshooting & Diagnostics

This runbook covers common setup, runtime, and diagnostic procedures for the **Sales Management POS & Tax Application**.

---

## 1. Common Issues & Diagnostic Resolutions

### 1.1 Port Conflicts (5432, 6379, 8080, 4200, 9000)
- **Symptom:** Docker outputs `Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:5432 failed: port is already allocated`.
- **Cause:** A native instance of PostgreSQL, Redis, or Node dev server is already running on the host OS.
- **Resolution:**
  - On Windows: Stop native services via PowerShell `Stop-Service postgresql*` or disable background services.
  - On Linux/WSL2: Run `sudo systemctl stop postgresql redis-server` or `sudo fuser -k 5432/tcp`.

---

### 1.2 Database Connection Refused During Migration
- **Symptom:** Running `make migrate` immediately after `make up` outputs `dial tcp 127.0.0.1:5432: connect: connection refused`.
- **Cause:** PostgreSQL is still executing its first-time `initdb` scripts inside the container.
- **Resolution:**
  - `docker-compose.yml` includes healthchecks (`pg_isready -U sales -d salesdb`). Wait ~5 seconds for the container status to transition from `starting` to `healthy`:
    ```bash
    docker compose ps
    ```
  - Re-run `make migrate`.

---

### 1.3 MinIO Bucket Initialization Delays
- **Symptom:** Product image upload fails with `Bucket does not exist: products`.
- **Cause:** The `sales-minio-init` container has not yet finished creating the `products` and `invoices` default buckets.
- **Resolution:**
  - Verify container status:
    ```bash
    docker compose logs minio-init
    ```
  - Alternatively, open the MinIO Console at [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`), navigate to **Buckets**, and create `products` and `invoices` with public read permissions.

---

### 1.4 Browser CORS Error on Frontend
- **Symptom:** Browser console logs `Access to XMLHttpRequest at 'http://localhost:8080/api/v1/auth/login' from origin 'http://localhost:4200' has been blocked by CORS policy`.
- **Cause:** The `APP_CORS_ORIGINS` environment variable in `.env` does not match the frontend URL.
- **Resolution:**
  - Check `.env`:
    ```ini
    APP_CORS_ORIGINS=http://localhost:4200
    ```
  - Restart the API container:
    ```bash
    docker compose restart api
    ```

---

### 1.5 Corrupted or Blank PDF Invoices
- **Symptom:** PDF generation throws an error or outputs garbled text.
- **Cause:** Missing TTF font byte definitions during compilation.
- **Resolution:**
  - Verify that `backend/internal/invoice/Roboto-Regular.ttf` and `Roboto-Bold.ttf` are present and exceed 500 KB each.
  - Run the invoice test suite to verify embedding:
    ```bash
    docker compose exec api go test -v ./internal/invoice
    ```

---

## 2. Healthcheck & Inspection Cheat Sheet

```bash
# Check status of all containers
docker compose ps

# Inspect real-time memory and CPU utilization
docker stats --no-stream

# View API logs
docker compose logs --tail=100 -f api

# View PostgreSQL logs
docker compose logs --tail=100 -f postgres

# Run automated smoke test
bash scripts/test_smoke.sh
```
