# Database Design

Below is the English translation of your document — clear, practical, and ready to copy/paste into files or a repo. No questions.

---

## 1. What I need (priority by impact)

### **A. Architecture & schema**

* ERD image (or file from dbdiagram, draw.io, Lucidchart).
* Current DDL schema (CREATE TABLE / INDEX / VIEW / FK …).
* DBMS version (e.g. PostgreSQL 14.10, MySQL 8.0.36), extensions in use.
* Size per table/index and growth over the last 3–6 months.

### **B. Actual workload**

* Top 50–100 queries by frequency / total time (parameterized).
* Execution plans (EXPLAIN / EXPLAIN ANALYZE) for slow queries.
* Anonymized sample data (10–1000 rows per table depending on size).
* Sample transactions: frequency, duration, isolation level, locking patterns.

### **C. Performance & ops**

* Slow query logs, wait events / locking (deadlock reports).
* Index statistics (hit ratio, bloat if any), autovacuum / VACUUM history (Postgres).
* DB configuration (max_connections, shared_buffers, work_mem, innodb_buffer_pool_size, …).
* Monitoring snapshot (CPU, RAM, I/O, cache hit, QPS, p95/p99 latency).
* Infrastructure cost (instance type, storage class, provisioned IOPS).

### **D. Availability & processes**

* HA / replication topology, backup/restore (RPO / RTO), DR runbook.
* Migration toolchain (Flyway / Liquibase / Prisma / ActiveRecord), change history highlights.
* Security policy: PII columns, masking strategy, access rights, audit.

### **E. Product context**

* SLA and performance targets (e.g. p95 < 100ms for API X).
* Known bottlenecks (timeouts, queue backlogs, deadlocks, cost spikes, shard imbalances…).
* 6–12 month roadmap (expected traffic growth, new features, analytics, multi-region).

---

## 2. How to package & format (copy–paste runnable)

### **Suggested folder layout**

```txt
db-assessment/
├─ 00_overview/
│  ├─ arch-diagram.png
│  └─ context.md
├─ 10_schema/
│  ├─ schema_ddl.sql
│  ├─ erd.pdf
│  └─ sizes.csv
├─ 20_workload/
│  ├─ top_queries.sql
│  ├─ explain_plans/   (one .txt per query)
│  └─ sample_data/     (anonymized CSVs)
├─ 30_ops_perf/
│  ├─ db_config.txt
│  ├─ slowlog.txt
│  ├─ locks_deadlocks.txt
│  └─ metrics.csv
├─ 40_ha_security/
│  ├─ ha_topology.md
│  ├─ backup_restore.md
│  └─ pii_fields.md
└─ 50_business/
   ├─ sla_targets.md
   └─ known_issues.md
```

### **DDL & size commands**

#### *PostgreSQL*

* Export schema:

```bash
pg_dump -s -f schema_ddl.sql <db>
```

* Table sizes:

```sql
SELECT relname AS table,
       pg_total_relation_size(relid) AS bytes
FROM pg_catalog.pg_statio_user_tables
ORDER BY 2 DESC;
```

#### *MySQL*

* Export schema (no data):

```bash
mysqldump --no-data --routines --events db > schema_ddl.sql
```

* Table sizes: use `INFORMATION_SCHEMA.TABLES` (DATA_LENGTH + INDEX_LENGTH).

### **Top queries & plans**

*Postgres*: enable `pg_stat_statements`, export top N by `total_exec_time` and `calls`; get plans with:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) <your_query>;
```

*MySQL*: use `performance_schema.events_statements_summary_by_digest`, slow query log; use `EXPLAIN ANALYZE` for detailed plans.

### **Data anonymization**

* Hash / tokenize identifiers (SHA256 + salt), generalize dates (to week/month), bin numeric values, drop sensitive columns not needed.
* Provide a `pii_fields.md` describing which columns were masked and how.

---

## 3. Quick-fill template (copy into `context.md`)

```md
## Quick context
- Product: …
- DBMS & version: …
- Data size: … (total, top tables)
- Traffic: … avg QPS / p95 …
- SLA: …
- Current pain points: …
- Upgrade goals: … (performance, cost, maintainability, availability, analytics)

## Primary workload
- Hot tables: …
- Important queries: …
- Access patterns: … (read/write %, batch/stream, peak hours)

## Operations
- Notable config: …
- HA/DR: …
- Backup: … (RPO/RTO)
- Security & compliance: …

## Roadmap
- Next 6–12 months: …
```

---

## 4. Short on time? Minimum package that’s still useful

1. `schema_ddl.sql`
2. Top 50 parameterized queries + `EXPLAIN ANALYZE` for the 10 slowest
3. Table sizes + 3-month growth data
4. `db_config.txt` (all server params)
5. Known issues + goals (p95 target, cost/RPO/RTO)

---

## 5. What I’ll do after I receive the package

* Read schema → detect anti-patterns (N+1, composite key issues, missing FK indexes, bloat, etc.).
* Analyze plans & stats → propose indexes (incl. partial/covering), partitioning, query rewrites.
* Architecture suggestions → connection pooling, read replicas, caching layers, CQRS, sharding if needed.
* Ops tuning → parameter tuning, autovacuum/maintenance windows, backup/restore drills, cost optimization.
* Roadmap → step-by-step upgrade plan, rollback strategy, impact & risk estimates.
