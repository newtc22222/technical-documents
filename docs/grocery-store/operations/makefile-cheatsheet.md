---
id: makefile-cheatsheet
title: "Makefile Cheatsheet"
sidebar_label: "Makefile Cheatsheet"
sidebar_position: 2
description: "Makefile Cheatsheet — Grocery Store POS & Tax Application."
---
# Makefile Cheatsheet

The root `Makefile` provides standardized shorthand targets for controlling the Docker Compose environment, running migrations, seeding test data, and executing test suites.

---

## 1. Quick Target Reference

| Target | Underlying Command | Description |
| :--- | :--- | :--- |
| `make up` | `docker compose up -d --build` | Builds container images if needed and starts all 5 services in detached mode. |
| `make down` | `docker compose down` | Stops and removes running containers while preserving data volumes. |
| `make logs` | `docker compose logs -f` | Follows consolidated logs across all containers in real time. |
| `make migrate`| `docker compose exec api ./migrate up` | Executes pending SQL migrations inside the running API container. |
| `make seed` | `docker compose exec api ./seed` | Runs the database seeding binary to inject sample users, catalog items, and batches. |
| `make test` | `docker compose exec api go test -v -cover ./...` | Executes the entire Go test suite and prints statement coverage percentages. |
| `make lint` | `docker compose exec api golangci-lint run` | Runs code quality linter checks on Go source files. |
| `make reset` | `docker compose down -v && docker compose up -d --build` | Wipes PostgreSQL and MinIO persistent volumes and boots a fresh stack. |

---

## 2. Advanced / Direct Container Execution

If you need to execute manual CLI operations inside the running containers:

### 2.1 Backend Container Shell (`api`)
```bash
# Open interactive bash shell inside sales-api
docker compose exec api sh

# Run a specific package test with verbose output
docker compose exec api go test -v ./internal/tax

# Inspect environment variables
docker compose exec api env
```

### 2.2 PostgreSQL Interactive Terminal (`postgres`)
```bash
# Connect to PostgreSQL salesdb as user sales
docker compose exec postgres psql -U sales -d salesdb

# Sample SQL query inside psql:
# salesdb=# SELECT count(*) FROM products;
# salesdb=# \dt
```

### 2.3 Redis CLI (`redis`)
```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Test connectivity:
# 127.0.0.1:6379> ping
# PONG
```

### 2.4 Live Container Logs
```bash
# Follow logs for API service only
docker compose logs -f api

# Follow logs for frontend web service
docker compose logs -f web
```
