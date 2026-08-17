---
id: 09-implementation-backlog
title: 09 — Implementation Backlog
sidebar_label: 09 Backlog
sidebar_position: 10
description: Ordered implementation backlog with effort, dependencies, and acceptance criteria.
---

# 09 — Implementation Backlog

Ordered work packages with effort, dependencies, and acceptance criteria. Each package represents a logical PR or PR stack.

---

## Legend

| Field | Meaning |
|-------|---------|
| **Pri** | P0 (now) → P4 (later) |
| **Effort** | Eng-days (1 person) |
| **Deps** | Must complete first |
| **Artifact** | Finding IDs |

---

## GitHub issues

| ID | Issue | Title |
|----|------:|-------|
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

## Horizon A — Secure & correct

### A1. Fix production JWT environment guard · [#44](https://github.com/newtc22222/lingu-flow/issues/44)

| | |
|---|---|
| **Pri** | P0 |
| **Effort** | 0.1 d |
| **Artifact** | F-01 |
| **Files** | `backend/app/config.py`, `backend/tests/test_config.py` |

**Work**
- Read `ENVIRONMENT` from `info.data` in `JWT_SECRET` validator.
- Add temp-`.env` test proving production + weak secret fails.

---

### A2. Exam visibility + session answer-key policy · [#45](https://github.com/newtc22222/lingu-flow/issues/45)

| | |
|---|---|
| **Pri** | P0 |
| **Effort** | 0.5 d |
| **Artifact** | F-02, F-03 |

**Work**
- Add `_readable_template_or_404`.
- Apply to template GET, questions GET, create_session template resolve.
- Session details: owner-only; keys only when `status == completed`; use `build_question_response`.

---

### A3. Remove unused SSE endpoint · [#46](https://github.com/newtc22222/lingu-flow/issues/46)

| | |
|---|---|
| **Pri** | P0 |
| **Effort** | 0.1 d |
| **Artifact** | F-09 |

**Work**
- Remove `routers/events.py` registration, tests, docs mentions.

---

### A4. Postgres integration test harness · [#47](https://github.com/newtc22222/lingu-flow/issues/47)

| | |
|---|---|
| **Pri** | P1 |
| **Effort** | 1 d |
| **Artifact** | F-08 |

**Work**
- `@pytest.mark.postgres` + CI service / compose recipe.
- Run Alembic upgrade on empty DB.
- Cascade/transaction tests.

---

### A5. Single transaction owner · [#48](https://github.com/newtc22222/lingu-flow/issues/48)

| | |
|---|---|
| **Pri** | P1 |
| **Effort** | 1–2 d |
| **Deps** | A4 |
| **Artifact** | F-04 |

**Work**
- Services `flush` only; `get_db` sole commit for HTTP.
- Fix `create_session` atomic snapshot.

---

### A6. Seed ownership (entrypoint + advisory lock) · [#49](https://github.com/newtc22222/lingu-flow/issues/49)

| | |
|---|---|
| **Pri** | P1 |
| **Effort** | 0.5 d |
| **Artifact** | F-06 |

**Work**
- Move seed to entrypoint after migrate.
- Advisory lock inside seeder.

---

### A7. Docs & agent skill accuracy · [#50](https://github.com/newtc22222/lingu-flow/issues/50)

| | |
|---|---|
| **Pri** | P1 |
| **Effort** | 0.2 d |
| **Artifact** | F-10, F-11 |

**Work**
- Refresh CLAUDE.md stale sections.
- Fix project-conventions skill test/lint claims.
- Declare primary deploy topology.

---

## Horizon B — Fast & operable

- **B1**: Dashboard SQL aggregates (F-07)
- **B2**: Streak UTC consistency (F-13)
- **B3**: Exam server-side time enforcement (F-05)
- **B4**: Compose healthchecks + ready endpoint (F-11)
- **B5**: Auth rate limiting
- **B6**: Frontend data-access convention (F-12)
- **B7**: Config hygiene (reserved settings) (F-14)
- **B8**: Observability baseline
- **B9**: Frontend test bootstrap
