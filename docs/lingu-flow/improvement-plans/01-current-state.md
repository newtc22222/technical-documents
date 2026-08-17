---
id: 01-current-state
title: 01 — Current State Assessment
sidebar_label: 01 Current State
sidebar_position: 2
description: Assessment of current stack, domain map, feature surface, and architecture findings.
---

# 01 — Current State Assessment

## Stack (verified)

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Vue 3 Composition API, Vite, Pinia, vue-router, vue-i18n, Tailwind v4 arcade tokens | Feature folders under `frontend/src/features/*`; shared primitives in `shared/components/` |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 async, Alembic, Pydantic v2 | Routers: auth, cards, dashboard, decks, exams, questions, events, media, settings, health |
| DB | PostgreSQL 16 (prod/Docker); SQLite in-memory for pytest | Migrations `0001`–`0005` |
| Media | Cloudflare R2 via presigned S3 URLs | `services/storage.py` |
| Deploy | Vercel SPA + Railway API/Postgres (documented); `docker-compose` for local full stack | `frontend/vercel.json` rewrites `/api` → Railway |
| Jobs | Guest cleanup one-shot (`python -m app.jobs.cleanup_guests`) | Not continuous worker |
| Realtime | SSE `/api/events` | Heartbeats only; **no frontend `EventSource` consumer** (F-09) |

---

## Domain map

```
users ─┬─ decks ─ cards (SM-2 fields, position, image_url, notes)
       ├─ user_settings
       ├─ exam_templates ── exam_template_questions ── questions (shared bank, soft-delete)
       └─ exam_sessions ── answer_records (frozen order_index snapshot)
```

**Invariants (must remain):**

1. Session results resolve from `AnswerRecord`, not live template composition.
2. Question delete is soft (`archived_at`); hard delete blocked when history exists.
3. Answered question `options` / `correct_answer` freeze (409).

These are correctly implemented; F-04’s multi-commit pattern is the main way they can still be *accidentally* violated under failure.

---

## Feature surface (product)

| Area | Status |
|------|--------|
| Auth (password, Google OAuth, guest → permanent) | Shipped |
| Decks / cards CRUD, reorder, Unfiled | Shipped; full-bleed operator console UI |
| SM-2 review, Learn, Match | Shipped |
| Dashboard progress | Shipped (inefficient F-07) |
| Exam hub, session, results, composer | Shipped |
| Question bank browse/CRUD | Shipped |
| User settings / profile | Shipped |
| Built-in exam seeds (TOEIC Reading + others) | Shipped via lifespan seed |
| AI features (Phase 2+) | Open issues #8–#11 |
| Analytics, adaptive, PDF (Phase 3) | Open #12–#16 |
| Community / gamification (Phase 4) | Open #17–#18 |
| Listening / writing AI (Phase 5) | Open #19–#20 |

Phases 1, 1.5, 1.6 are **closed** on GitHub; remaining open work is Phase 2+.

---

## Architecture diagram (as-is)

```
┌──────────────┐     rewrite /api/*      ┌─────────────────┐
│  Browser SPA │ ──────────────────────► │ Vercel (static) │
│  Vue + Pinia │                         └────────┬────────┘
└──────┬───────┘                                  │ proxy
       │ same-origin /api/*                       ▼
       │                             ┌────────────────────────┐
       └────────────────────────────►│ Railway: uvicorn       │
                                     │ FastAPI (1+ workers?)  │
                                     └─────┬──────────┬───────┘
                                           │          │
                              ┌────────────▼──┐  ┌────▼─────┐
                              │ PostgreSQL    │  │ R2 media │
                              └───────────────┘  └──────────┘

Local alt: docker-compose → postgres + backend + frontend:8080
```

**Gaps vs target production design:** no load balancer redundancy story, no cache, no queue, no centralized logs/metrics, SSE unused, seed in lifespan (multi-process hazard).

---

## Artifact findings — severity board

| Sev | Count | IDs |
|-----|------:|-----|
| Critical | 4 | F-01, F-02, F-03, F-04 |
| Medium | 5 | F-05, F-06, F-07, F-08, F-09 |
| Low / drift | 5 | F-10, F-11, F-12, F-13, F-14 |
| Probe-verified | 6 | F-01, F-02, F-03, F-05, F-09, F-10/F-11 cluster |

### Critical detail (summary)

**F-01 — JWT guard bypass via `.env`**  
`JWT_SECRET` validator uses `os.getenv("ENVIRONMENT")` while Settings loads `ENVIRONMENT` from `.env`. Production mode in `.env` alone does **not** reject the committed dev secret. Railway/compose process env currently masks this; `.env.example` invites the failure path.

**F-02 — Private templates world-readable**  
`GET /templates/{id}` has no auth; `GET .../questions` uses optional user but no visibility filter. List endpoint filters correctly — by-id does not. Answer key withheld for non-owners (good); stem/metadata still leak.

**F-03 — Session details leak keys**  
`SessionDetailsResponse` builds full `QuestionResponse` without `build_question_response`, no `status == completed` gate. Combined with F-02, an attacker can start a session on a private exam and read the key mid-exam via API.

**F-04 — Multi-commit services**  
`get_db()` commits at request end **and** services call `commit()` internally (~20+ sites). `create_session` commits session then answer records separately → crash leaves unplayable session that still appears in history.

---

## Codebase strengths (artifact “what’s well built”)

- Question-bank integrity comments and enforcement
- Seed versioning and in-place template updates
- Guest purge transaction documentation (`purge_guest_user` does not commit)
- Ownership stamping pattern (when applied)
- Design-system CI enforcement
- Client exam timer math (timestamp deadline)

---

## Stale documentation inventory (F-10)

| Claim | Reality |
|-------|---------|
| CLAUDE.md “stale docs” about Express Vercel `api/index.ts` | Path gone; `DEPLOYMENT.md` is Railway+Vercel+R2 |
| project-conventions skill: “no test suite / no lint” | ~18 pytest modules, ESLint custom rule, stylelint, Prettier |
| CLAUDE.md earlier “empty scaffolding” | Fixed for routers; skill file still mid-migration tone |
| CLAUDE.md “no migrations committed yet” | Migrations 0001–0005 exist |
| RELEASE.md “31 tests” | Suite has grown substantially |

---

## Frontend structure snapshot

```
features/
  auth/          AuthView + authStore
  dashboard/     DashboardView + tiles
  exam/          Hub, View, Results, Composer + examStore
  flashcards/    Study, Learn, Match + lobby
  library/       Deck rack + detail console + api.ts
  profile/       Profile + Settings
  question-bank/ Console + questionBankStore
shared/components/  AppButton, ModalShell, KeyboardGridList, PixelFrame, …
utils/api.ts     apiFetch (Bearer + 401 hard redirect)
```

**Data-access triad (F-12):** Pinia stores (exam, bank) vs feature `api.ts` (library) vs inline `apiFetch` (dashboard, flashcards, profile).

---

## Testing reality

| Kind | Status |
|------|--------|
| Backend pytest + httpx AsyncClient | Present; SQLite in-memory |
| FK cascades under test | **Not** enforced (SQLite defaults) |
| `get_db` commit wrapper under test | Overridden away in conftest |
| Frontend unit/e2e | Absent (build + lint only) |
| Contract smoke | `frontend/scripts/verify-library-contracts.mjs` exists |
