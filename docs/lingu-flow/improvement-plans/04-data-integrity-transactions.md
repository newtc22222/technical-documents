---
id: 04-data-integrity-transactions
title: 04 — Data Integrity & Transactions
sidebar_label: 04 Data Integrity
sidebar_position: 5
description: Single transaction ownership, commit boundaries, and PostgreSQL test harness.
---

# 04 — Data Integrity & Transaction Boundaries (Deep Dive)

**Findings covered:** F-04, F-08  
**Horizon:** A (P1) — **after** security P0, **before** large feature work  
**Effort:** 2–3 days total (harness day + refactor day)

---

## Why this is structural

Question-bank invariants are documented and mostly enforced in happy paths:

- Answer records are the composition snapshot.
- Soft-delete preserves history.
- Answered options freeze.

Those rules assume **one atomic write** for “create session + N answer rows.”

`guest_service.purge_guest_user` already states the correct rule: **“does not commit — caller owns the transaction boundary.”** Promote that to a project-wide convention.

---

## F-04 — Single commit owner

### Current pattern

```text
Request
  └─ get_db() yields session
       ├─ service method A → commit()
       ├─ service method B → commit()
       └─ get_db finally → commit() again
```

Problems:
1. Partial failure leaves inconsistent rows (orphan sessions, half-updated decks).
2. Nested commits make rollback at router level useless.
3. Tests override `get_db` without commit wrapper → **false confidence**.

### Target pattern

```text
Request
  └─ get_db() yields session
       ├─ service methods only flush() / add() / delete()
       ├─ need PK early? → await db.flush()
       └─ get_db on success → commit(); on error → rollback()
```

Jobs (guest cleanup) and CLI scripts own their own `session.commit()` explicitly at the top level — not buried in service helpers used by HTTP.

### create_session specific fix

```text
Before:
  insert ExamSession; commit
  insert N AnswerRecords; commit

After:
  insert ExamSession; flush  # get session.id
  insert N AnswerRecords
  return  # get_db commits once
```

On failure, no session row is visible to other requests.

---

## F-08 — Test harness that can see the truth

### Gaps today

| Gap | Effect |
|-----|--------|
| SQLite in-memory | FKs off by default; cascades not enforced |
| `postgresql.UUID` / JSON dialects | Subtle type differences |
| `get_db` override bare yield | Never tests real commit/rollback |
| No Postgres CI job | Cascades only fail in prod |

### Target testing pyramid

```
┌─────────────────────────────────────┐
│  Optional: FE contract smoke (node) │  existing verify-library-contracts
├─────────────────────────────────────┤
│  Postgres integration (slow job)    │  NEW — cascades, transactions, seed
├─────────────────────────────────────┤
│  SQLite unit/API tests (fast)       │  KEEP — majority of 70+ tests
└─────────────────────────────────────┘
```

### Tests that must run on Postgres

1. Hard-delete question blocked / soft-delete keeps `AnswerRecord` resolvable.
2. Delete template removes links not questions.
3. `create_session` atomicity under forced error.
4. User delete cascades decks/cards; template SET NULL behavior per model.
5. Unique `seed_key` constraint.
6. Guest cleanup cascade paths that SQLite silently skips.
