---
id: kickoff-prompt-a5-transactions
title: "Kickoff Prompt — A5 Transactions (#48 / F-04)"
sidebar_label: Kickoff — A5 Transactions
sidebar_position: 12
description: Paste-ready kickoff prompt for the Horizon A5 single transaction owner refactor.
---

# Kickoff Prompt — Horizon A5 single transaction owner (#48 / F-04)

> **How to use:** Copy everything below the horizontal rule into a **fresh** agent session as the first message.

---

Implement **Horizon A package A5** for LinguFlow: make `get_db()` the sole commit point for HTTP requests so multi-step mutations (especially `create_session`) are atomic.

**Issue:** [#48](https://github.com/newtc22222/lingu-flow/issues/48)  
**Artifact finding:** F-04  
**Depends on:** A4 Postgres harness ([#47](https://github.com/newtc22222/lingu-flow/issues/47)) — must be merged or on this branch so the atomicity test can go green  
**Plan:** [04 — Data Integrity & Transactions](./04-data-integrity-transactions.md)

---

## Mission

Today services call `await db.commit()` mid-request **and** `get_db()` commits at the end. `create_session` commits the `ExamSession` row, then commits `AnswerRecord` rows separately. A failure between those commits leaves an unplayable session (`total_count = N`, zero answer records) that still appears in history.

**Target:**

```text
HTTP request
  └─ get_db() yields session
       ├─ services only add/flush/delete (never commit/rollback)
       └─ get_db commits once on success, rolls back on error
```

Jobs/CLI (`app/jobs/*`, entrypoint seed) keep their own top-level commit.

---

## Scope

### In scope

- Strip `commit()` from HTTP-path services under `backend/app/services/`
- Use `flush()` when IDs are needed mid-method
- Atomic `create_session` (session + N answer records, one outer commit)
- Remove `xfail` from `test_create_session_is_atomic_under_midway_failure` in `tests/postgres/test_integrity.py` and make it pass
- Document transaction ownership in `CLAUDE.md`
- Optional: grep/CI note that services must not call `commit()`

### Out of scope

- F-06 seed entrypoint move (#49)
- Frontend changes
- New product features
- Changing question-bank soft-delete / freeze rules

---

## Implementation checklist

1. Inventory: `rg "await db.commit|await session.commit" backend/app`
2. For each service method used by routers: replace commit with flush or nothing
3. Keep commits only in: `database.get_db`, jobs entrypoints, seed when run outside request
4. Re-run SQLite suite + Postgres suite
5. Fix any test that assumed intermediate commits

---

## Definition of done

- [ ] Zero `commit()` in service methods invoked from routers
- [ ] `test_create_session_is_atomic_under_midway_failure` **passes** (no xfail)
- [ ] Full `pytest -q` green; `pytest -m postgres` green with `POSTGRES_TEST_URL`
- [ ] `CLAUDE.md` documents transaction ownership
- [ ] Closes #48

## Suggested branch

```text
refactor/transaction-owner-a5
```

## Ground rules

Conventional Commits; no AI co-author; do not commit unless asked. Prefer one focused PR.
