---
id: configuration
title: "Environment Configuration Reference"
sidebar_label: "Configuration Reference"
sidebar_position: 3
description: "Configuration Reference — Grocery Store POS & Tax Application."
---
# Environment Configuration Reference

The application configuration is loaded via environment variables defined in the `.env` file at the repository root. A template is provided in `.env.example`.

---

## 1. Complete Environment Variables Dictionary

### 1.1 PostgreSQL Database Settings

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_HOST` | `postgres` (or `localhost`) | Hostname of PostgreSQL server (Use `postgres` inside Docker, `localhost` from host). |
| `POSTGRES_PORT` | `5432` | TCP port for PostgreSQL database connection. |
| `POSTGRES_USER` | `sales` | Database username. |
| `POSTGRES_PASSWORD` | `sales_dev_pw` | Database password. *Change in production!* |
| `POSTGRES_DB` | `salesdb` | Primary relational database name. |
| `POSTGRES_SSLMODE` | `disable` | SSL mode (`disable`, `require`, `verify-full`). |

### 1.2 Redis In-Memory Cache Settings

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `REDIS_HOST` | `redis` (or `localhost`) | Hostname of Redis server. |
| `REDIS_PORT` | `6379` | TCP port for Redis service. |
| `REDIS_PASSWORD` | *(empty)* | Optional Redis password. |

### 1.3 MinIO S3 Object Storage Settings

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MINIO_ENDPOINT` | `minio:9000` (or `localhost:9000`) | S3 API endpoint. |
| `MINIO_ROOT_USER` | `minioadmin` | Root administrative username / Access Key. |
| `MINIO_ROOT_PASSWORD`| `minioadmin` | Root administrative password / Secret Key. |
| `MINIO_USE_SSL` | `false` | Enable TLS (`true` or `false`). |
| `MINIO_BUCKET_PRODUCTS` | `products` | S3 bucket for product image uploads. |
| `MINIO_BUCKET_INVOICES` | `invoices` | S3 bucket for PDF invoice archives. |

### 1.4 Authentication & JWT Security

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `JWT_SECRET` | `secret-key-replace-in-production-12345` | Secret passphrase used for HMAC-SHA256 signing. |
| `JWT_ACCESS_TTL` | `15m` | Lifetime of short-lived access tokens (`15m`). |
| `JWT_REFRESH_TTL` | `168h` | Lifetime of refresh tokens (`7d` / `168h`). |

### 1.5 Application Server & Network CORS

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_PORT` | `8080` | Port on which the Go Gin REST server listens. |
| `APP_ENV` | `development` | Environment mode (`development`, `production`, `test`). |
| `APP_CORS_ORIGINS`| `http://localhost:4200` | Comma-separated list of allowed CORS browser origins. |

---

## 2. Sample `.env` File

```ini
# Application
APP_PORT=8080
APP_ENV=development
APP_CORS_ORIGINS=http://localhost:4200

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=sales
POSTGRES_PASSWORD=sales_dev_pw
POSTGRES_DB=salesdb
POSTGRES_SSLMODE=disable

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_PRODUCTS=products
MINIO_BUCKET_INVOICES=invoices

# JWT
JWT_SECRET=sales-app-super-secret-jwt-signing-key-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h
```

---

## 3. Production Hardening Checklist
1. **Rotate `JWT_SECRET`:** Set to a secure random string of ≥ 32 alphanumeric characters.
2. **Postgres Password:** Generate a cryptographically random password for `POSTGRES_PASSWORD`.
3. **MinIO Root Credentials:** Replace `minioadmin` with unique access and secret keys.
4. **Enable SSL:** Set `POSTGRES_SSLMODE=require` and `MINIO_USE_SSL=true`.
