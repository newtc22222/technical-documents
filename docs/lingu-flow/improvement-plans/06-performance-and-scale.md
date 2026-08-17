---
id: 06-performance-and-scale
title: 06 — Performance & Scale
sidebar_label: 06 Performance & Scale
sidebar_position: 7
description: Dashboard query aggregates, streak calculation, and scaling roadmap.
---

# 06 — Performance & Scale

**Findings covered:** F-07, F-14 (Redis/AI keys), capacity from 02  
**Horizon:** B for F-07; scale blocks for later phases  
**Effort:** 0.5–1 day dashboard; Redis only if triggered

---

## Performance philosophy

LinguFlow near-term traffic is **~5–20 QPS peak** at 10k DAU. Optimize for:

1. **Correctness first** (Horizons A).
2. **Per-user data growth** (power users with thousands of cards) — this bites before global QPS.
3. **AI cost and latency** (Phase 2) — different bottleneck class.

Avoid premature: Redis, read replicas, sharding, microservices.

---

## F-07 — Dashboard full-dataset load

### Current behavior

`get_progress` loads all cards, decks, and completed sessions for a user into Python memory to compute statistics.

### Target queries

| Metric | Approach |
|--------|----------|
| Card counts / XP | `COUNT` / `SUM` SQL with filters on `user_id` |
| Due cards | `COUNT(*) WHERE srs_next_review <= now()` |
| Per-deck progress | `GROUP BY deck_id` with `COUNT` and average repetitions or % mature |
| Exam readiness | Aggregate from `exam_sessions` scores (`AVG`, last N) |
| Worlds UI | Only deck id, name, progress percent — not full card entities |

### Index checklist

- `cards(user_id, srs_next_review)`
- `cards(user_id, deck_id)`
- `exam_sessions(user_id, status, finished_at)`
- `decks(user_id)`

---

## Read path inventory & caching

| Path | Hot? | Strategy now | Later |
|------|------|--------------|-------|
| Dashboard | Per login | SQL aggregates | Cache 30–60s per user if needed |
| Question bank list | Medium | Pagination + indexes | Redis cache public bank pages |
| Exam template public list | Medium | DB | CDN/cache short TTL |
| Session answer PUT | Hot during exam | DB only | No cache |
| SM-2 review POST | Hot | DB only | No cache |
| Media GET | Hot | R2 + browser cache | Cloudflare CDN |

### When to introduce Redis (F-14)

**Introduce Redis when any of:**
- Postgres CPU > 60% sustained from identical read queries
- Public bank list p95 > 200 ms after indexes
- Multi-instance rate limiting needed
- Phase 2 job queue chosen as Redis-backed

Until then: either remove `REDIS_URL` from Settings or mark `# reserved for Phase 2+` in config + `.env.example`.

---

## Database scaling path

```
1. Vertical (Railway plan bump)           ← stay here through 100k DAU likely
2. Connection pooling (PgBouncer)         ← if connection errors / many workers
3. Read replica for analytics/dashboard   ← Phase 3 analytics heavy reads
4. Partition answer_records by time       ← if sessions explode
5. Shard by user_id                       ← only multi-million users
```

---

## Async / queues (scale building block)

Introduce a queue when:
- LLM question generation (5–60s, retries, cost control)
- Bulk card import
- PDF reports
- Fanout notifications

Prefer **Postgres job table** first (one less moving part) if QPS is low; Redis if multi-worker high throughput.
