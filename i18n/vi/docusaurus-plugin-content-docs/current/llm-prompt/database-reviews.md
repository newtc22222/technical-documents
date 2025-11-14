# Database Design

## 1. Những gì mình cần (ưu tiên theo mức độ ảnh hưởng)

### **A. Kiến trúc & lược đồ**

* Ảnh ERD (hoặc file từ dbdiagram, draw\.io, Lucidchart).
* DDL schema hiện tại (CREATE TABLE/INDEX/VIEW/FK…).
* Phiên bản DBMS (ví dụ: PostgreSQL 14.10, MySQL 8.0.36), extension đang dùng.
* Kích thước mỗi bảng/index, growth trong 3–6 tháng.

### **B. Workload thực tế**

* Top 50–100 query theo tần suất/thời gian (có tham số hóa).
* Kế hoạch thực thi (EXPLAIN/EXPLAIN ANALYZE). cho các query chậm.
* Mẫu dữ liệu ẩn danh (10–1000 dòng/bảng, tùy kích cỡ).
* Mẫu giao dịch: tần suất, độ dài, isolation level, pattern khóa/lock.

### **C. Hiệu năng & vận hành**

* Slow query logs, wait events/locking (deadlock reports).
* Thống kê index (hit ratio, bloat nếu có), autovacuum/VACUUM history (Postgres).
* Cấu hình DB (max\_connections, shared\_buffers, work\_mem, innodb\_buffer\_pool\_size…).
* Monitoring snapshot (CPU, RAM, I/O, cache hit, QPS, p95/p99 latency).
* Chi phí hạ tầng (instance type, storage class, provisioned IOPS).

### **D. Tính sẵn sàng & quy trình**

* Sơ đồ HA/replication, backup/restore (RPO/RTO), DR runbook.
* Migration toolchain (Flyway/Liquibase/Prisma/ActiveRecord), lịch sử thay đổi nổi bật.
* Chính sách bảo mật: PII fields, masking, quyền truy cập, audit.

### **E. Ngữ cảnh sản phẩm**

* SLA, mục tiêu hiệu năng (VD: p95 < 100ms cho API X).
* Nút thắt đã thấy (timeout, queue backlog, deadlock, chi phí tăng, shard lệch…).
* Roadmap 6–12 tháng (tăng traffic, new features, analytics, multi-region…).

---

## 2. Cách đóng gói & định dạng (để copy–paste là chạy)

### **Thư mục mẫu**

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
│  ├─ explain_plans/   (mỗi query 1 file .txt)
│  └─ sample_data/     (CSV đã ẩn danh)
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

### **DDL & số liệu kích thước**

* PostgreSQL:

  * `pg_dump -s -f schema_ddl.sql <db>`
  * Kích thước bảng:

      ```sql
      SELECT relname AS table, pg_total_relation_size(relid. AS bytes
      FROM pg_catalog.pg_statio_user_tables
      ORDER BY 2 DESC;
      ```

* MySQL:

  * `mysqldump --no-data --routines --events db > schema_ddl.sql`
  * Kích thước bảng: `INFORMATION_SCHEMA.TABLES` (DATA\_LENGTH + INDEX\_LENGTH).

### **Top query & plan**

* PostgreSQL: bật `pg_stat_statements`, xuất top N theo `total_exec_time` và `calls`; lấy plan: `EXPLAIN (ANALYZE, BUFFERS, VERBOSE)`.
* MySQL: `performance_schema.events_statements_summary_by_digest`; slow log + `EXPLAIN ANALYZE`.

### **Ẩn danh dữ liệu**

* Hash/Tokenize định danh (SHA256 + salt), generalize ngày (đến tuần/tháng), binning cho số, drop cột nhạy cảm không cần thiết.
* Kèm file `pii_fields.md` mô tả cột nào đã được mask và cách mask.

---

## 3. Template điền nhanh (copy mẫu này vào `context.md`)

```md
## Context nhanh
- Sản phẩm: …
- DBMS & phiên bản: …
- Quy mô dữ liệu: … (tổng, top bảng)
- Traffic: … QPS trung bình / p95…
- SLA: …
- Đau đầu hiện tại: …
- Mục tiêu nâng cấp: … (hiệu năng, chi phí, bảo trì, khả dụng, phân tích)

## Workload chính
- Bảng nóng: …
- Query quan trọng: …
- Mô hình truy cập: … (đọc/ghi %, batch/stream, giờ cao điểm)

## Vận hành
- Cấu hình nổi bật: …
- HA/DR: …
- Backup: … (RPO/RTO)
- Bảo mật & compliance: …

## Roadmap
- Dự kiến 6–12 tháng: …
```

---

## 4. Bạn bận? Đây là “gói tối thiểu” vẫn đủ để mình tư vấn

1. `schema_ddl.sql`
2. Top 50 query (đã tham số hóa. + `EXPLAIN ANALYZE` cho 10 query chậm nhất)
3. Bảng kích thước + tăng trưởng 3 tháng
4. `db_config.txt` (toàn bộ tham số server)
5. Known issues + mục tiêu (p95, chi phí, RPO/RTO)

---

## 5. Sau khi nhận được, mình sẽ làm gì?

* Đọc schema → phát hiện anti-pattern (N+1, khóa tổng hợp, FK thiếu index, bloat…).
* Phân tích plan & stats → đề xuất index/partial index/covering, partitioning, rewrite query.
* Kiến trúc → connection pooling, read replicas, caching, CQRS, sharding (nếu cần).
* Vận hành → tuning tham số, autovacuum/maintenance window, backup/restore drill, cost-cutting.
* Lộ trình nâng cấp → các bước tuần tự, rollback plan, ước tính tác động & rủi ro.
