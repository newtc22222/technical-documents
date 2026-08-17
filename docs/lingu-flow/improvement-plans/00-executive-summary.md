---
id: 00-executive-summary
title: 00 — Executive Summary
sidebar_label: 00 Executive Summary
sidebar_position: 1
description: Executive summary, system diagnostic, and prioritized goals for LinguFlow.
---

# 00 — Executive Summary

## Purpose

Produce a concrete, sequenced plan to harden and grow **LinguFlow** (keyboard-driven flashcards + certification exam simulator) without throwing away the domain work that is already strong.

This plan merges:

1. **Live codebase review** on `main` (Vue 3 + FastAPI + PostgreSQL, post Phase 1.5/1.6, library console redesign, settings, guest lifecycle).
2. **Architecture artifact review** (14 findings, 6 probe-verified against pytest) from Claude Code session 2026-08-08.

It follows the system-design process: requirements first, then architecture, deep dives on the riskiest components, then tradeoffs and a backlog.

---

## Product in one paragraph

LinguFlow is a **learning platform for language certifications** (TOEIC, IELTS, HSK, JLPT) plus **SM-2 spaced-repetition flashcards**. Users study decks (keyboard-first arcade UI), take timed mock exams from a **shared question bank**, and (later) will get AI help, analytics, listening/writing modes, and social features. Today it ships as a **modular monolith**: one FastAPI service, one Postgres database, a static Vue SPA (Vercel) talking to Railway-hosted API, media on Cloudflare R2.

---

## What is already excellent (do not “simplify” away)

The artifact review and code agree: **domain modelling is better than most projects of this size**.

| Area | Why it matters |
|------|----------------|
| Question-bank invariants | Soft-delete, session `AnswerRecord` snapshot + `order_index`, 409 on mutating answered options — finished exams cannot be retroactively rewritten |
| Seed identity | `seed_key` + `seed_version` update templates **in place** so historical sessions keep valid FKs |
| Guest lifecycle | Thoughtful orphan vs. “someone sat this exam” handling |
| Ownership stamping | `build_question_response` withholds answer keys from non-owners when used |
| Design system | Tokens + ESLint/stylelint mechanically enforce arcade pixel UI rules |
| Exam clock UI | Timestamp-based deadline (not tick drift) — only the **trust boundary** is wrong (F-05) |

**Implication:** improvement work is **boundary hardening and operations**, not a rewrite.

---

## System design diagnostic (current → target)

Score = round(passed / 8 × 10). Artifact + code review:

| Diagnostic row | Today | Target after this plan |
|----------------|-------|------------------------|
| Functional & non-functional requirements listed | Partial (GitHub phases; no capacity/SLA doc) | Explicit in [02](./02-requirements-and-capacity.md) |
| QPS & storage estimate | No | Near-term + growth scenarios documented |
| Every component redundant | No (single Railway replica, single Postgres) | Accept single-node for v1; document multi-AZ when DAU warrants |
| DB scaling strategy defined | Implicit vertical only | Vertical → replicas → shard last ([06](./06-performance-and-scale.md)) |
| Cache for read-heavy paths | No (`REDIS_URL` unused F-14) | Introduce Redis only at measured triggers |
| Async paths via queues | No (seed on startup, guest cleanup one-shot job) | Seed/migration path; queue only for Phase 2 AI |
| Monitoring & alerting plan | Minimal (Vercel Speed Insights) | Health + error + latency + auth anomaly basics |
| Deployment strategy defined | Split story (compose vs Vercel/Railway F-11) | Declare **primary** topology + secondary local compose |

**Current score: ~3/10** (works as a product prototype; fails security, estimation, ops, and transaction diagnostics).  
**Target after P0–P2: ~7/10** (secure, integrity-tested, deploy-clear, observed).  
**Target at Phase 3 scale: ~9/10** (caching, queues for AI, redundancy where cost-justified).

---

## Problems that block “good enough to trust”

Three boundaries are open today (artifact wording preserved in substance):

1. **Who may read what** — private exams and mid-session answer keys (F-02, F-03).
2. **Where a transaction begins and ends** — services commit mid-request (F-04).
3. **Which process owns startup work** — multi-worker seed races (F-06).

Plus one that can mint tokens for any user if `.env` sets production without process env (F-01).

These are **not** “nice to have”; they are prerequisites before Phase 2 AI (which multiplies blast radius: more secrets, more async jobs, more cost).

---

## Phased outcomes

### Horizon A — Secure & correct (1–2 weeks)

- JWT production guard always fires.
- Exam visibility + session details authorization closed.
- Single commit owner per request; Postgres integration tests for cascades.
- Seed moved off multi-worker race path; dead SSE removed or redesigned.
- Docs/skills match reality.

**Exit criteria:** probe-style security tests green on CI; no answer key before `completed`; no silent prod fallback secret from `.env`.

### Horizon B — Fast & operable (2–4 weeks)

- Dashboard aggregates in SQL; streak dates UTC-consistent.
- Deploy topology primary documented; compose healthchecks.
- Basic metrics/logging; rate limit on auth.
- Frontend data-access convention chosen and applied to new code.

**Exit criteria:** dashboard p95 stable with 5k cards/user; cold-start compose reliable; agents read accurate CLAUDE.md.

### Horizon C — Product growth (per GitHub phases)

- Phase 2 AI client + generators (behind feature flags, async jobs).
- Phase 3 analytics / adaptive exams / PDF reports.
- Phase 4 community + gamification.
- Phase 5 listening TTS / writing grader.

**Exit criteria:** each phase has capacity estimate, abuse controls, and cost budget before implementation.

---

## Explicit non-goals (this plan)

- Rewriting FastAPI → microservices.
- Replacing Postgres with a document store.
- Introducing Redis “because config mentions it” without a measured bottleneck.
- Building frontend test suite for 100% coverage in one pass (start with contract smoke + critical stores).
- Replacing SM-2 or the arcade design system.

---

## Recommended first merge train

1. **Security PR** — F-01 + F-02 + F-03 + tests (half day).
2. **Docs PR** — F-10 + F-11 clarity (1 hour) — unblocks agents immediately.
3. **Harness PR** — F-08 Postgres job or testcontainers (1 day).
4. **Transaction PR** — F-04 flush-only services (1–2 days) with harness green.
5. **Ops PR** — F-06 seed relocation + F-09 delete SSE (half day).

Then product work (Phase 2) resumes with a trustworthy base.

---

## Owners & tracking

| Workstream | Primary plan | Suggest tracking |
|------------|--------------|------------------|
| Security | 03 | New GitHub issues `security` label or milestone “Horizon A” |
| Integrity | 04 | Same milestone |
| Ops | 05 | `infrastructure` label |
| Perf | 06 | `performance` |
| Frontend | 07 | `frontend` + `ui` |
| Product | 08 | Existing `phase-2`…`phase-5` issues |

Do **not** open duplicate phase-2+ feature issues; use `gh issue list` first (see project memory / roadmap).
