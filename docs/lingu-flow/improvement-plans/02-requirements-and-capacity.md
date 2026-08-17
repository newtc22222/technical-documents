---
id: 02-requirements-and-capacity
title: 02 — Requirements & Capacity Planning
sidebar_label: 02 Requirements & Capacity
sidebar_position: 3
description: Functional and non-functional requirements, QPS and storage estimates, and capacity planning.
---

# 02 — Requirements & Capacity (System Design Step 1)

## Clarifying assumptions

These are **working assumptions** for LinguFlow as a growing indie/education product. Adjust numbers if product goals change; architecture gates below are expressed in terms of thresholds, not absolute dates.

| Assumption | Value |
|------------|-------|
| Primary market | Learners (VN + global EN), web-first, desktop keyboard UX |
| Auth model | Guest + registered + Google OAuth |
| Content model | Shared public bank + user-owned private templates/questions |
| Near-term DAU (6–12 mo) | 1,000 – 10,000 |
| Medium-term DAU (12–24 mo) | 50,000 – 100,000 |
| Peak concurrency | ~5–10% of DAU in evening study window |
| Media | Images for cards/exams via R2; audio later (Phase 5) |
| Consistency | Strong for exam scoring / SRS writes; eventual OK for analytics |

---

## Functional requirements

### Must have (current product — maintain)

1. **Auth:** register/login, guest session, guest upgrade without data loss, Google OAuth, JWT session.
2. **Flashcards:** deck/card CRUD, reorder, Unfiled, SM-2 review, Learn, Match.
3. **Exams:** browse public/owned templates, compose from bank, timed session, answer, finish, results with explanations.
4. **Question bank:** filter by type/part/tags, CRUD with soft-delete and answer-key freeze rules.
5. **Dashboard:** streak, XP-ish progress, deck “worlds,” exam readiness summary.
6. **Settings/profile:** locale and UI prefs persistence.
7. **Media:** presigned upload/download for images.

### Must have (gaps from review — treat as requirements)

8. **Authorization:** private templates/questions/session details only for entitled principals.
9. **Exam integrity:** answer keys only after completion (or never for non-owners mid-exam).
10. **Atomic session creation:** session row + answer snapshot commit together.
11. **Safe multi-instance boot:** seeding not racy across workers/replicas.
12. **Honest production secrets:** app refuses to boot production with known-dev JWT secret regardless of env source.

### Should have (near-term quality)

13. Server-side exam deadline enforcement (or explicit “practice only / honor system” product flag).
14. Dashboard O(1)/O(decks) queries, not full card load.
15. UTC-consistent streak calculation for multi-timezone users.
16. Single primary deployment story documented for humans and agents.

### Later (product phases — see 08)

17. AI generation / explain / hints (Phase 2).
18. Analytics engine, adaptive mode, PDF reports (Phase 3).
19. Community library, gamification (Phase 4).
20. Listening TTS, writing grader (Phase 5).

### Explicit out of scope for Horizon A/B

- Native mobile apps
- Multi-region active-active
- Real-time collaborative editing
- Payment / subscriptions (unless product prioritizes)

---

## Non-functional requirements

| NFR | Near-term target | Notes |
|-----|------------------|-------|
| **Availability** | 99.5% (~3.6 h/mo) | Single Railway service OK; backups required |
| **API latency p95** | < 300 ms for CRUD; < 500 ms dashboard | Without AI |
| **API latency p95 AI** | < 15 s streaming or async job | Phase 2 |
| **Exam write consistency** | Strong / single-row atomic | F-04 fix |
| **Auth security** | No known-dev secrets in prod; bcrypt passwords | F-01 |
| **Data durability** | RPO ≤ 24 h, RTO ≤ 4 h initially | Improve with managed Postgres PITR |
| **Privacy** | Private exams not enumerable by UUID alone | F-02/F-03 |
| **Token handling** | No long-lived JWT in query strings | F-09 |
| **Test gate** | pytest green on CI; cascade tests on Postgres | F-08 |
| **Frontend gate** | `vue-tsc` + ESLint + stylelint + production build | Already exists |

---

## Back-of-the-envelope estimates

### Traffic (near-term: 10k DAU)

Assume average user actions/day ≈ 40 (study reviews, list fetches, exam answers, dashboard opens).

```
Avg QPS  = 10_000 × 40 / 86_400 ≈ 4.6 QPS
Peak QPS ≈ 4.6 × 4 ≈ 20 QPS
```

Even at **100k DAU** with 60 actions:

```
Avg QPS  ≈ 70 QPS
Peak QPS ≈ 200–350 QPS
```

**Conclusion:** A single well-tuned FastAPI + Postgres instance handles near-term load easily. **Do not** introduce microservices, Kafka, or multi-shard Postgres for traffic reasons before ~1k peak QPS.

### Storage (5 years, rough)

| Entity | Size/row | Volume assumption | 5y rough |
|--------|----------|-------------------|----------|
| Cards | ~1 KB | 10k users × 200 cards = 2M | ~2 GB |
| Questions (bank) | ~2 KB | 100k total bank | ~200 MB |
| Answer records | ~200 B | 10k users × 50 sessions × 40 Q | ~4 GB |
| Sessions meta | ~300 B | smaller | < 1 GB |
| Media (R2) | 100 KB–2 MB | highly variable | **dominates** |

**Conclusion:** Postgres stays small; **object storage and AI token spend** dominate cost long-term, not row storage.

### Bandwidth

- API JSON: negligible at tens of QPS.
- SPA static assets: CDN/Vercel edge.
- R2 images: put behind public URL or short-lived GET; cache aggressively.

### Server count (order of magnitude)

| Component | Near-term | When to scale |
|-----------|-----------|---------------|
| API (uvicorn) | 1 instance, 1–2 workers | CPU > 70% sustained or p95 regression |
| Postgres | 1 primary | Read replica when read QPS >> write and dashboard/analytics heavy |
| Redis | 0 | When hot keys (session template, bank browse) show DB pressure |
| Workers | 0 continuous | Phase 2 AI jobs / email / PDF |

---

## Scaling triggers (decision table)

| Signal | First response | Avoid until needed |
|--------|----------------|--------------------|
| Dashboard slow for power users | SQL aggregates (F-07) | Redis |
| Read-heavy bank browse | Indexes + pagination audit | Full-text engine |
| AI generation bursts | Queue + worker | Sync LLM in request path |
| Multi-region latency | CDN only (static) | Multi-primary DB |
| Auth abuse | Rate limit + lockout | Complex WAF first |
| >1 API replica | Move seed out of lifespan (F-06) | Advisory lock alone as long-term |
