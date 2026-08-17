---
id: improvement-plans-overview
title: LinguFlow Improvement Plans
sidebar_label: Overview
sidebar_position: 0
description: Comprehensive improvement plans, system diagnostic score, and prioritized backlog for LinguFlow.
---

# LinguFlow Improvement Plans

**Created:** 2026-08-08  
**Sources:** Current codebase review (`main` @ `eade46a`) + Claude architecture artifact [LinguFlow Architecture Review](https://claude.ai/code/artifact/3c990b70-7e97-42a2-9d3b-5c9e80751ff9) (session `f3b02765`, 14 findings, 6 probe-verified)  
**Method:** System-design four-step process (requirements → high-level design → deep dives → tradeoffs/roadmap)

---

## How to use this folder

Read **in order** if you are new to the review; jump by file if you are executing a specific workstream.

| # | File | Purpose |
|---|------|---------|
| 00 | [00-executive-summary.md](./00-executive-summary.md) | Goals, diagnostic score, phased outcome |
| 01 | [01-current-state.md](./01-current-state.md) | What exists today + artifact findings map |
| 02 | [02-requirements-and-capacity.md](./02-requirements-and-capacity.md) | Functional/non-functional requirements, QPS/storage estimates |
| 03 | [03-security-hardening.md](./03-security-hardening.md) | F-01 JWT, F-02/F-03 exam visibility, F-09 SSE |
| 04 | [04-data-integrity-transactions.md](./04-data-integrity-transactions.md) | F-04 commit ownership, F-08 test harness |
| 05 | [05-reliability-and-ops.md](./05-reliability-and-ops.md) | F-06 seeding races, deploy topology, observability |
| 06 | [06-performance-and-scale.md](./06-performance-and-scale.md) | F-07 dashboard, caching triggers, scale path |
| 07 | [07-frontend-quality.md](./07-frontend-quality.md) | F-12 data-access, F-13 streaks, UX consistency, FE tests |
| 08 | [08-product-roadmap.md](./08-product-roadmap.md) | Phase 2–5 features gated by foundation work |
| 09 | [09-implementation-backlog.md](./09-implementation-backlog.md) | Ordered backlog with effort, owners, acceptance criteria |

---

## One-page priority

```
P0  Security      F-01 → F-02 → F-03     (minutes → half day)
P1  Integrity     F-08 → F-04            (test harness before transaction refactor)
P2  Ops hygiene   F-06, F-09, F-10, F-11 (half day + hour of docs)
P3  Performance   F-07, F-13             (SQL aggregates, UTC streak)
P4  Consistency   F-12, FE conventions   (data-access rule, shared patterns)
P5  Product       Phase 2 AI → Phase 3–5 (only after P0–P2 land)
```

## GitHub issues (created 2026-08-08)

Labels: `horizon-a`, `horizon-b`, `security` (+ existing backend/frontend/etc.)

| Backlog | Issue | Title |
|---------|------:|-------|
| A1 | [#44](https://github.com/newtc22222/lingu-flow/issues/44) | JWT production guard (F-01) |
| A2 | [#45](https://github.com/newtc22222/lingu-flow/issues/45) | Exam visibility + answer keys (F-02, F-03) |
| A3 | [#46](https://github.com/newtc22222/lingu-flow/issues/46) | Remove unused SSE (F-09) |
| A4 | [#47](https://github.com/newtc22222/lingu-flow/issues/47) | Postgres test harness (F-08) |
| A5 | [#48](https://github.com/newtc22222/lingu-flow/issues/48) | Single transaction owner (F-04) |
| A6 | [#49](https://github.com/newtc22222/lingu-flow/issues/49) | Seed ownership / entrypoint (F-06) |
| A7 | [#50](https://github.com/newtc22222/lingu-flow/issues/50) | Docs / skills / deploy topology (F-10, F-11) |
| B1 | [#51](https://github.com/newtc22222/lingu-flow/issues/51) | Dashboard SQL aggregates (F-07) |
| B2 | [#52](https://github.com/newtc22222/lingu-flow/issues/52) | Streak UTC (F-13) |
| B3 | [#53](https://github.com/newtc22222/lingu-flow/issues/53) | Server exam time + idempotent finish (F-05) |
| B4 | [#54](https://github.com/newtc22222/lingu-flow/issues/54) | Compose healthchecks + ready (F-11) |
| B5 | [#55](https://github.com/newtc22222/lingu-flow/issues/55) | Auth rate limiting |
| B6 | [#56](https://github.com/newtc22222/lingu-flow/issues/56) | FE data-access convention (F-12) |
| B7 | [#57](https://github.com/newtc22222/lingu-flow/issues/57) | Reserved REDIS/AI config (F-14) |
| B8 | [#58](https://github.com/newtc22222/lingu-flow/issues/58) | Observability baseline |
| B9 | [#59](https://github.com/newtc22222/lingu-flow/issues/59) | Frontend Vitest bootstrap |

---

## Artifact finding index

| ID | Severity | Topic | Plan file |
|----|----------|-------|-----------|
| F-01 | Critical | Production JWT guard reads `os.getenv` not Pydantic field | 03 |
| F-02 | Critical | Private exam templates readable unauthenticated | 03 |
| F-03 | Critical | Session details expose answer key mid-exam / to non-owners | 03 |
| F-04 | Critical | Services commit mid-request; no single transaction owner | 04 |
| F-05 | Medium | Exam timing entirely client-side | 03, 08 |
| F-06 | Medium | Startup seed races with multi-worker | 05 |
| F-07 | Medium | Dashboard loads entire user dataset | 06 |
| F-08 | Medium | SQLite tests cannot enforce cascades/transactions | 04 |
| F-09 | Medium | SSE JWT-in-query-string; no frontend consumer | 03, 05 |
| F-10 | Low | CLAUDE.md / project-conventions stale claims | 05, 07 |
| F-11 | Low | Two deploy topologies; compose healthcheck gap | 05 |
| F-12 | Low | Three frontend data-access patterns | 07 |
| F-13 | Low | Streak math mixes UTC and local dates | 07 |
| F-14 | Low | Unused `REDIS_URL` / AI key settings | 06, 08 |

---

## Related in-repo docs

- [`docs/DATABASE.md`](../architecture/database-design.md) — current schema
- [`DEPLOYMENT.md`](../operations/deployment-guide.md) — Vercel + Railway + R2
- GitHub Issues phase labels `phase-2` … `phase-5` (open product work)
