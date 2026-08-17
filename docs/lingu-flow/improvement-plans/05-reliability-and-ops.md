---
id: 05-reliability-and-ops
title: 05 — Reliability, Deployment & Operations
sidebar_label: 05 Reliability & Ops
sidebar_position: 6
description: Deployment topologies, exam seeding ownership, observability, and disaster recovery.
---

# 05 — Reliability, Deployment & Operations

**Findings covered:** F-06, F-09 (ops angle), F-10, F-11, parts of F-14  
**Horizon:** A/B  
**Effort:** ~1 day ops fixes + ongoing observability

---

## Deployment topologies (F-11)

### Reality today

| Topology | Role | Status |
|----------|------|--------|
| **Vercel SPA + Railway API + Railway Postgres + R2** | Production | Documented in `DEPLOYMENT.md`; `frontend/vercel.json` points at Railway |
| **docker-compose** (postgres, backend, frontend) | Local / demo full stack | Works; no healthcheck on depends_on; no Redis |

### Primary vs Secondary Decision

```text
PRIMARY PRODUCTION: Vercel (frontend) + Railway (API + Postgres) + Cloudflare R2
SECONDARY LOCAL:    docker compose up --build
```

---

## F-06 — Built-in exam seeding ownership

### Problem

`lifespan` runs `seed_builtin_exams` in **every** worker/replica. On `seed_version` bump:
- Concurrent delete links / archive / re-link races
- Unique `seed_key` collisions or duplicate composition rows
- Exceptions swallowed → app serves half-seeded state

### Solution: Single entrypoint + Advisory Lock

1. Move seed call to `entrypoint.sh` after `alembic upgrade head` (one process at container start).
2. Keep seeder idempotent + take `pg_advisory_lock(SEED_LOCK_ID)` for the duration of a version bump.
3. Remove seed from FastAPI lifespan.
4. Do not swallow seed failures in production — exit non-zero so Railway marks deploy failed.

---

## Observability plan

### Minimum viable (Horizon B)

| Pillar | Choice | What to capture |
|--------|--------|-----------------|
| **Metrics** | Railway metrics + extended health endpoint | uptime, DB ping |
| **Logs** | Structured JSON logs | request_id, user_id hash, path, status, latency_ms |
| **Errors** | Sentry (optional) | unhandled exceptions, auth failure rates |
| **Frontend** | Vercel Speed Insights + error boundaries | route, build id |

### Health endpoints

| Endpoint | Meaning |
|----------|---------|
| `GET /api/health` | Process up (pure liveness) |
| `GET /api/health/ready` | DB `SELECT 1` succeeds (for orchestrators) |
