---
id: backup-and-recovery
title: "Backup & Disaster Recovery Runbook"
sidebar_label: "Backup & Disaster Recovery"
sidebar_position: 5
description: "Backup & Disaster Recovery — Grocery Store POS & Tax Application."
---
# Backup & Disaster Recovery Runbook

To guarantee data safety for small businesses, this runbook outlines procedures for backing up and restoring PostgreSQL databases (`salesdb`) and MinIO S3 object buckets (`products`, `invoices`).

---

## 1. Automated PostgreSQL Database Backup (`pg_dump`)

### 1.1 On-Demand Database Backup
To create a compressed SQL dump file on the host machine:

```bash
# Create backups directory
mkdir -p ./backups

# Execute pg_dump inside postgres container and stream to host
docker compose exec -T postgres pg_dump -U sales -d salesdb -F c -b -v \
  > ./backups/salesdb_backup_$(date +%Y%m%d_%H%M%S).dump
```

- `-F c`: Custom compressed format (optimal for `pg_restore`).
- `-b`: Include large binary objects.
- `-v`: Verbose progress mode.

### 1.2 Automated Nightly Cron Job
Add the following line to `crontab -e` on the WSL2 or Linux host to run daily at 02:00 AM:

```bash
0 2 * * * /usr/bin/docker compose -f /path/to/grocery-store/docker-compose.yml exec -T postgres pg_dump -U sales -d salesdb -F c | gzip > /path/to/backups/salesdb_$(date +\%Y\%m\%d).dump.gz
```

---

## 2. MinIO S3 Object Storage Backup

Product images and generated PDF invoices stored in MinIO can be synchronized to an external directory or cloud bucket using the MinIO Client (`mc`):

```bash
# Set alias for local MinIO server
mc alias set localminio http://localhost:9000 minioadmin minioadmin

# Mirror buckets to local disk backup directory
mc mirror localminio/products ./backups/minio/products/
mc mirror localminio/invoices ./backups/minio/invoices/
```

---

## 3. Database Restoration Runbook

In the event of database corruption, accidental table deletion, or hardware migration:

```bash
# 1. Stop the application API to prevent incoming mutations
docker compose stop api web

# 2. Drop existing database and recreate a clean instance
docker compose exec -T postgres dropdb -U sales salesdb --if-exists
docker compose exec -T postgres createdb -U sales salesdb

# 3. Restore schema and data from backup dump
cat ./backups/salesdb_backup_YYYYMMDD_HHMMSS.dump | \
  docker compose exec -T postgres pg_restore -U sales -d salesdb -v

# 4. Restart application services
docker compose start api web

# 5. Execute smoke tests to verify integrity
bash scripts/test_smoke.sh
```

---

## 4. Disaster Recovery Validation Drill
It is strongly recommended to rehearse database recovery quarterly in a test environment:
1. Initialize a temporary container stack with `make reset`.
2. Apply the latest backup dump.
3. Verify that orders, products, and customer debts match prior financial totals.
