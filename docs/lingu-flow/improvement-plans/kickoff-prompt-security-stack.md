---
id: kickoff-prompt-security-stack
title: Kickoff Prompt — Security Stack (A1–A3)
sidebar_label: Kickoff — Security Stack
sidebar_position: 11
description: Paste-ready kickoff prompt for the Horizon A security stack (JWT, Exam Visibility, Answer Keys, Remove SSE).
---

# Kickoff Prompt — Horizon A security stack (A1–A3)

> **How to use:** Copy everything below the horizontal rule into a **fresh** agent session as the first message. Do not paraphrase — the checklists and file paths matter.

---

Implement the **Horizon A security PR stack** for LinguFlow in this repo.

**Issues (must close together in one logical PR, or a tight PR stack):**

| Backlog | GitHub | Finding | Topic |
|---------|-------:|---------|--------|
| A1 | [#44](https://github.com/newtc22222/lingu-flow/issues/44) | F-01 | Production JWT guard reads wrong `ENVIRONMENT` source |
| A2 | [#45](https://github.com/newtc22222/lingu-flow/issues/45) | F-02, F-03 | Private exam IDOR + session details leak answer keys |
| A3 | [#46](https://github.com/newtc22222/lingu-flow/issues/46) | F-09 | Remove unused SSE `/api/events` (JWT in query string) |

**Specs (read before writing code):**

1. `plans/03-security-hardening.md` — full design for F-01, F-02, F-03, F-09
2. `plans/09-implementation-backlog.md` — packages A1–A3
3. `CLAUDE.md` — project commands and conventions
4. GitHub issue bodies for #44, #45, #46 (acceptance criteria)

Deep design lives in plan 03; this prompt is the **execution contract**. Do not expand into Horizon B (exam server timer F-05, rate limits, dashboard, transactions F-04, seed F-06) unless a fix is a one-line dependency of A2.

---

## Mission

Ship a **backend security fix** that:

1. **Never boots production** with the committed/dev JWT secret, whether `ENVIRONMENT=production` comes from process env **or** `backend/.env`.
2. **Never leaks** private exam templates/questions by UUID alone; only `is_public` or owner may read.
3. **Never returns `correctAnswer` / full answer-key fields** on session details until the session is `completed`, and only to the **session owner**.
4. **Deletes** the unused SSE endpoint so long-lived JWTs are not accepted in query strings.

This was probe-verified in an architecture review: the bugs are real, not theoretical.

---

## Scope

### In scope

- `backend/app/config.py` + `backend/tests/test_config.py`
- `backend/app/services/exam_service.py` (visibility helpers, `create_session`, `get_session_details`)
- `backend/app/routers/exams.py` (auth deps on template-by-id / questions / details as needed)
- `backend/app/schemas/exam.py` only if a clean DTO split is required (prefer runtime gating via existing `build_question_response` / public schema path first)
- Remove SSE: `backend/app/routers/events.py`, registration in `backend/app/main.py`, related tests (e.g. anything under `test_seed_and_events.py` that hits `/api/events`), and any docs that claim the endpoint is live product surface
- New pytest module(s) for the security matrix (suggested: `backend/tests/test_exam_visibility.py` and extend `test_config.py`)

### Out of scope (do not do in this stack)

- F-04 service `commit()` refactor / transaction ownership
- F-05 server-side exam timer enforcement (Horizon B #53)
- F-06 seed move to entrypoint
- F-08 Postgres-only harness (SQLite pytest is enough for these cases)
- Frontend changes unless a test proves ExamResults breaks without a tiny contract tweak (prefer backend remaining FE-compatible for completed sessions)
- Rate limiting, Redis, observability

### Product rules that stay true

- Prefer **404 over 403** for non-readable templates/sessions (no existence oracle).
- Public templates remain readable anonymously (list already does this).
- Answer keys on **template question list** for non-owners stay withheld (already partially done — do not regress).
- Question-bank invariants (soft delete, frozen answered options, session snapshot via `AnswerRecord`) — do not “simplify” them.

---

## Implementation checklist

### A1 — JWT guard (#44 / F-01)

**File:** `backend/app/config.py` — `JWT_SECRET` field validator.

**Bug:** validator uses `os.getenv("ENVIRONMENT")` while Settings also loads `ENVIRONMENT` from `.env`. Production in `.env` alone does **not** reject the fallback secret `lingu_dev_jwt_secret_key_change_in_production_99`.

**Fix:**

- Use `info.data.get("ENVIRONMENT")` (field is declared **above** `JWT_SECRET`, so it is available).
- Keep rejecting empty/known-weak secrets when environment is `production`.
- Keep development fallback secret for local dev.

**Tests** (`backend/tests/test_config.py`):

- Keep existing process-env production test if present.
- **Add:** temp `.env` (or `Settings` with `_env_file=...`) where `ENVIRONMENT=production` and JWT is missing/default $\rightarrow$ **raises**.
- **Add:** production + strong random secret $\rightarrow$ **accepts**.
- Development + default secret $\rightarrow$ still works.

Clear `get_settings` lru_cache between tests if the suite caches Settings.

---

### A2 — Visibility + answer keys (#45 / F-02, F-03)

**Primary files:** `exam_service.py`, `routers/exams.py`.

**F-02 — readable predicate**

Add a helper parallel to existing `_owned_template_or_404` (around `exam_service.py` ~198):

```text
_readable_template_or_404(db, template_id, user | None) -> ExamTemplate
  allow if template.is_public OR (user and template.user_id == user.id)
  else 404
```

Wire it into:

- `GET /api/exams/templates/{id}` — currently little/no auth
- `GET /api/exams/templates/{id}/questions` — optional user, no visibility filter
- `create_session` — today uses unfiltered `get_template_by_id` (~435); **must** use readable predicate so private exams cannot be sat by strangers

Re-read the router signatures before editing: attach optional/required `current_user` consistently so the service receives the viewer.

**F-03 — session details**

In `get_session_details` (~486+):

1. Require authenticated **session owner** (`session.user_id == current_user.id`); else 404.
2. Build question payloads through the same ownership/key-redaction path used elsewhere (`build_question_response` / public question schema) — **do not** `QuestionResponse.model_validate(q)` for full keys blindly.
3. **Answer key rule:**
   - `session.status == "completed"` **and** owner $\rightarrow$ include `correctAnswer` / explanations (ExamResults needs this).
   - `in-progress` (or any non-completed) $\rightarrow$ questions without answer keys even for the owner.

Optional hardening (include if cheap): make `finish_session` idempotent if you touch that method — **not required** for this stack (that is B3 / #53).

**Do not break** the live exam UI: it must not depend on mid-exam `/details` for keys (review confirmed it does not). Still verify completed results path.

---

### A3 — Delete SSE (#46 / F-09)

- Unregister `events` router from `main.py`.
- Delete or gut `routers/events.py` (prefer delete if nothing else imports it).
- Remove tests that only exist for `/api/events`.
- Grep for `EventSource`, `/api/events`, `sse` in repo docs/comments and fix stale claims in files you already touch; do **not** start a full docs PR (that is #50).

---

## Security test matrix (must be green)

Add automated tests covering:

| # | Case | Expected |
|---|------|----------|
| 1 | Settings from temp `.env` with `ENVIRONMENT=production` + weak/default JWT | Boot/config **fails** |
| 2 | Anon `GET` private template by id | **404** |
| 3 | User B `GET` user A private template + questions | **404** |
| 4 | User B `POST` session on A’s private template | **404** |
| 5 | Owner mid-exam `GET` session details | **200**, body has **no** `correctAnswer` (check camelCase JSON) |
| 6 | Owner completed session details | **200**, **with** `correctAnswer` / explanations usable by results UI |
| 7 | User B `GET` A’s session details | **404** |
| 8 | Public template still readable (anon or any user) | **200** |

Also:

- Non-owner (or anon) on public template questions still must **not** receive answer keys if that was existing behavior.
- After A3: `GET /api/events` is **404** (or not mounted).

---

## How to work

1. Read the four sources listed at the top (plans + issues + CLAUDE.md).
2. Grep current code paths before editing:
   - `os.getenv("ENVIRONMENT")` in config
   - `get_template_by_id` call sites in exams router/service
   - `get_session_details` / `QuestionResponse.model_validate`
   - `include_router(events`
3. Implement A1 $\rightarrow$ A2 $\rightarrow$ A3 (order reduces risk of mixing concerns).
4. Write/adjust tests as you go; do not leave the matrix for “later.”
5. Run backend tests:

```bash
cd backend
./venv/Scripts/python.exe -m pytest -q
```

6. If you change any response shape the FE might read, check `frontend/src/features/exam/` call sites (`examStore.ts`, `ExamResultsView.vue`) — prefer no FE change.

7. **Do not commit unless the user asks.** If asked to commit: Conventional Commits, **no** AI co-author trailers. Suggested message:

```text
fix(security): JWT prod guard, exam visibility, session key policy; remove SSE

Closes #44, #45, #46
```

---

## Definition of done

- [ ] All eight matrix cases pass in pytest
- [ ] Full `pytest -q` green
- [ ] No service-layer drive-by refactors (no F-04 commit stripping in this PR)
- [ ] No new linter/type issues introduced on touched files
- [ ] Issue acceptance criteria in #44, #45, #46 are each satisfied
- [ ] Brief PR/summary note listing files changed and residual risks (e.g. client-side timer F-05 still open as #53)

---

## Ground rules

- **Backend-first.** Match existing router $\rightarrow$ service $\rightarrow$ schema layering.
- CamelCase on the wire via Pydantic aliases; assert tests against the JSON the client sees when using the test client.
- Prefer 404 for authz misses on templates/sessions.
- If the code disagrees with this prompt after you read the files, **stop and report the conflict** with file:line evidence before inventing a third design.
- Report what you verified with command output; do not claim “tests pass” without running them.
- Never add Claude/Anthropic/AI as commit co-author.

---

## Suggested verification commands (end of work)

```bash
cd backend
./venv/Scripts/python.exe -m pytest -q tests/test_config.py
./venv/Scripts/python.exe -m pytest -q tests/test_exam_visibility.py
./venv/Scripts/python.exe -m pytest -q
```

When finished, reply with: what changed, test results, any FE impact, and whether #44/#45/#46 are ready to close.
