---
id: kickoff-prompt-a6-seed-ownership
title: "Kickoff Prompt — A6 Seed Ownership (#49 / F-06)"
sidebar_label: Kickoff — A6 Seed Ownership
sidebar_position: 13
description: Paste-ready kickoff prompt for the Horizon A6 seed ownership and advisory lock refactor.
---

# Kickoff Prompt — Horizon A6 seed ownership (#49 / F-06)

> **How to use:** Copy everything below the horizontal rule into a **fresh** agent session as the first message.

---

Implement **Horizon A package A6**: move built-in exam seeding out of multi-worker FastAPI lifespan into the container entrypoint (after migrate), with an advisory lock and hard fail on seed error in production.

**Issue:** [#49](https://github.com/newtc22222/lingu-flow/issues/49)  
**Artifact finding:** F-06  
**Plan:** [05 — Reliability, Deployment & Operations](./05-reliability-and-ops.md)  
**Prereq:** A4/A5 preferred but not strictly required (independent of transactions)

---

## Mission

`lifespan` currently runs `seed_builtin_exams` in **every** worker/replica. On a `seed_version` bump, concurrent processes race (duplicate composition / unique key collisions). Failures are swallowed with a warning.

**Target:** migrate $\rightarrow$ seed once $\rightarrow$ serve. Seeder takes a Postgres advisory lock for version bumps. Production seed failure fails the deploy.

---

## Work

- [ ] Run seed in `backend/entrypoint.sh` after `alembic upgrade head`
- [ ] Advisory lock inside seeder around version-bump path
- [ ] Remove (or no-op) lifespan seed in `main.py`
- [ ] Fail deploy on seed error when `ENVIRONMENT=production`
- [ ] Keep seeder idempotent

## Definition of done

- [ ] Dual concurrent seed cannot double composition
- [ ] API process boot does not mutate seed data
- [ ] Failed seed fails production deploy
- [ ] Closes #49

## Suggested branch

```text
fix/ops-seed-entrypoint-a6
```
