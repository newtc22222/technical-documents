---
id: ai-feature-guide
title: AI Feature Implementation Guide
sidebar_label: AI Feature Guide (Spec)
sidebar_position: 3
description: Self-contained implementation blueprint for adding LLM-powered features to LinguFlow.
---

# AI Feature Implementation Guide

This document is a **self-contained implementation blueprint** for adding LLM-powered features to LinguFlow. Read this file in full before writing any code. Do not assume any other guide document exists.

## 1. Feature Overview

LinguFlow is a keyboard-driven flashcard app (Vue 3 + Vite + TailwindCSS v4 frontend, Python/FastAPI + PostgreSQL backend) with Spaced Repetition (SM-2) and a certification exam simulator (TOEIC, IELTS, HSK, JLPT). This guide adds an **AI service layer** that powers four discrete product features, built in this order:

1. **Provider-agnostic AI client** (foundation, no user-facing routes) — a single interface the rest of the backend calls instead of importing an LLM SDK directly.
2. **Explain** — on-demand grammar/vocab explanations for a flashcard or a completed exam answer.
3. **AI question generator** — asynchronously generates new questions into the shared question bank from a prompt/topic.
4. **Non-spoiling exam hints** — an in-session hint that nudges the learner without revealing the correct answer.

Today, `GEMINI_API_KEY` and `OPENAI_API_KEY` exist only as reserved, empty-by-default config fields — **no code calls an LLM anywhere in this codebase yet.** This guide is building that integration from scratch.

## 2. Goals & Scope

**In scope:**

1. A provider-agnostic AI client abstraction (Gemini + OpenAI backends).
2. `POST /api/ai/explain` and `POST /api/ai/explain-card`.
3. An async question-generation job (`POST /api/ai/generate-questions`, `GET /api/ai/jobs/{jobId}`) that inserts into the existing shared question bank.
4. `POST /api/ai/hint` for in-progress exam sessions.
5. Making all of the above fail gracefully — a down/misconfigured/slow AI provider must never crash a request, never return a raw 500, and never block any non-AI feature.

**Out of scope (do not implement here):**

- Any UI/backend work for audio/speech features (Listening/Speaking phases — different, later effort, gated behind this one).
- Redis-backed job queues — v1 uses a Postgres job table (see §4). Only revisit this if the codebase's own scale notes say a measured trigger has been hit.
- Fine-tuning, embeddings, vector search, or RAG — none of the four features listed need it.
- Any change to exam session authz rules beyond reusing the existing ones (see §7's invariants — reuse, don't redesign).

## 3. Key Requirements

**Functional:**

- Registered (non-guest) users can request an explanation for a card or a completed exam answer.
- Registered users can submit a prompt to generate new questions asynchronously and poll for the result; successful generations land in the question bank as their own (non-public) questions.
- A user with an in-progress exam session can request a hint for a question in that session; the hint must never contain or imply the correct answer.
- All three product endpoints are rate-limited and registered-users-only (no guests, no anonymous access).

**Non-functional:**

- **No AI provider secrets ever reach the frontend.** All LLM calls happen server-side; the frontend only calls LinguFlow's own `/api/ai/...` routes.
- **Every AI-backed endpoint fails closed with a clean 503** on any provider error (timeout, HTTP error from Gemini/OpenAI, malformed/unparseable structured output) — never a 500, never a leaked stack trace or raw provider error message.
- **The app's core flows are never gated on AI availability.** Card CRUD, SM-2 review grading, and exam session create/submit/answer-recording must work identically whether or not any AI provider is configured or reachable.
- Bounded timeouts and retries on every provider call; never log raw API keys.
- CI must never make a live call to Gemini or OpenAI — all provider interaction is mocked in tests.
- All new user-facing strings go through i18n (`en`/`vi`); Vietnamese text must use `font-body`/`font-label`, never `font-pixel`.

## 4. Architecture / Structure

**Backend (`backend/app/`):**

- New package: `services/ai/` — `client.py` (the provider-agnostic interface + factory) plus per-provider adapter modules, e.g. `openai_adapter.py`, `gemini_adapter.py`. Nothing outside this package should ever import an LLM SDK directly.
- `config.py` — `Settings` (Pydantic Settings, `get_settings()`, lru-cached) already has `GEMINI_API_KEY` and `OPENAI_API_KEY`, both defaulting to `""`. The AI client factory must handle empty keys as "provider unavailable," not crash.
- `core/dependencies.py` — has `get_current_user` (401 if missing/invalid token) and `require_root_admin`. AI routes require an authenticated, **non-guest** user — check `current_user.is_guest` explicitly (see `require_root_admin` in that file for the exact pattern of checking `is_guest`), since `get_current_user` alone does not exclude guests.
- `core/rate_limit.py` — has `SlidingWindowLimiter` (constructor: `max_calls`, `window_seconds`, `name`) plus existing instances `login_limiter`, `register_limiter`, `guest_limiter`, each wired to a router via a small `async def rate_limit_x(request)` dependency function. Follow this exact pattern: create new limiter instance(s) for AI routes — do not reuse the auth limiters, and do not build a new rate-limiting mechanism.
- `core/exam_type_catalog.py` — existing categorization of exam types (e.g. which are CJK vs. English). Reuse this to decide default provider routing (Gemini for HSK/JLPT, OpenAI for TOEIC/IELTS) rather than inventing a second categorization.
- `jobs/cleanup_guests.py` — the existing one-shot background job entrypoint pattern (opens its own `AsyncSessionLocal`, commits at the end, exits non-zero on failure). The question-generation worker should follow this same shape for its execution path, even if triggered in-process rather than as a separate CLI command (see §5, Step 3).
- `routers/exam_types.py` + `services/exam_type_flag_service.py` — an existing DB-backed feature-flag pattern (public `GET`, root-admin-only `PATCH`). Strongly consider reusing this exact pattern for an "AI enabled" kill switch (see §5, Step 1) — it lets an admin instantly disable all AI routes without a deploy.
- `routers/health.py` — `/api/health` (pure liveness) and `/api/health/ready` (DB-only `SELECT 1`). **Do not add a provider ping to either route** — a transient Gemini/OpenAI outage must never cause a healthy pod restart.
- New Alembic migration under `backend/alembic/versions/` for the question-generation job table (see §4 Data model below). Follow the existing migration naming pattern (`000N_description`).
- New routers: `routers/ai_explain.py`, `routers/ai_generate.py` (or similar — one router per feature is fine, or a single `routers/ai.py` if the codebase's convention favors fewer files; check existing router granularity first), each registered in `main.py` via `app.include_router(...)`, prefixed `/api/ai/...`.

**Frontend (`frontend/src/`):**

- `utils/api.ts` (`apiFetch`) — the only sanctioned HTTP primitive for all three features' calls.
- Explain: an action/button on the exam-results view and on card study/detail views.
- Generate: UI lives in the question bank / exam composer area (wherever admins/users currently manage questions) — new generator form + job-status polling.
- Hint: a control inside the exam-taking view (`features/exam/`), keyboard-accessible, opt-in (a button the user must click — never auto-fires).
- **Every AI UI control must be self-contained: local `try/catch` and a local error `ref`, not a shared/store-level error state.** A failed AI call must never taint or block unrelated parts of the view it lives in.

**Data model (new):**

- A job table for async question generation — columns roughly: `id`, `user_id`, `status` (`pending`/`running`/`succeeded`/`failed`), `payload` (the generation request/prompt), `result` (generated question IDs or raw output), `error`, `created_at`, `updated_at`.
- No new columns needed on `Question`/`AnswerRecord`/`ExamTemplate` for explain or hints — both read existing data, they don't need new storage (explain may optionally cache its output; see §5).

## 5. Implementation Steps

Work in this order; each step is intended to land as its own PR/commit.

### Step 1 — AI client foundation (no product routes yet)

1. Build `services/ai/client.py` exposing one interface, e.g.:

   ```python
   class AIClient:
       async def complete(self, messages, *, model_hint=None, response_schema=None, timeout=...) -> AIResponse: ...
   ```

   Callers pass structured `messages` and optionally a `response_schema` for structured/JSON output; they never see which vendor served the request.
2. Implement `gemini_adapter.py` and `openai_adapter.py` behind that interface.
3. Build a factory function (mirroring `config.py`'s `get_settings()` lru-cache style) that picks a provider based on `core/exam_type_catalog.py`'s CJK/English split, overridable via settings, and returns a clearly-typed "unavailable" state (not an exception at construction time) when the relevant API key is empty.
4. Bound every provider call with a timeout and a small retry count (e.g. 1–2 retries on transient errors only, not on 4xx).
5. Never log raw API keys or full request/response bodies containing user content at a level that would leak them to persistent logs — log only metadata (provider, latency, success/failure) at info level.
6. **This step ships no HTTP routes.** It's pure library code, covered entirely by unit tests that mock the HTTP/SDK layer — no live provider calls in CI, ever.
7. Optional but recommended: add the AI-enabled kill switch here, reusing `exam_type_flag_service.py`/`exam_types.py`'s exact pattern (a DB-backed flag, public `GET`, root-admin `PATCH`). If added, every route in Steps 2–4 must check it and short-circuit to 503 when disabled — cheaper than waiting for per-call error handling to absorb an ongoing provider incident.

### Step 2 — Explain (`/api/ai/explain`, `/api/ai/explain-card`)

1. New router, registered users only (explicitly reject guests — check `current_user.is_guest`), new `SlidingWindowLimiter` instance applied as a route dependency.
2. `explain-card`: caller must own the card (reuse whatever ownership check the existing card service already uses — do not write a second one).
3. `explain` (for a completed exam answer): **only ever allowed for a completed session review, never mid-exam** — this is a hard requirement, since exposing an explanation mid-attempt could leak the correct answer. Reuse the existing exam authz pattern (`ExamService.readable_template_or_404` — `is_public OR owned`, else 404 never 403) for any template/session lookup involved; do not bypass or reimplement it.
4. Add a cache keyed by `(kind, subject_id_or_content_hash, locale)` — a small Postgres table or in-process LRU is sufficient; **do not introduce Redis** for this.
5. Wrap the AI client call: any exception (timeout, provider error, malformed response) $\rightarrow$ 503, never 500.
6. Frontend: an "Explain" action on the exam-results view and on card study/detail views, each with its own local loading/error state.

### Step 3 — AI question generator (async job)

1. Write the Alembic migration for the job table (see §4 Data model).
2. `POST /api/ai/generate-questions` validates the request, inserts a `pending` job row, and returns `202 {"jobId": ...}` immediately — it must not block on the actual generation.
3. The generation work itself runs as an in-process background task (acceptable for a single-worker deployment) structured like `jobs/cleanup_guests.py`: it opens its own session, does the work, and commits/updates the job row itself — the request-handling transaction (owned by `get_db()`) must not be the one that commits this background work.
4. On success, the generated content is validated against the bank's schema using the client's `response_schema` param from Step 1, then inserted as `Question` rows owned by the requesting user (`user_id = caller`). **Never auto-attach generated questions to a public/built-in exam template** — they land in the bank as the user's own, unattached questions, consistent with the existing "questions are a shared bank, not exam property" model.
5. `GET /api/ai/jobs/{jobId}` returns status/result/error; scope it to the requesting user (a job belongs to whoever created it — reject or 404 on cross-user access, same reasoning as the media-key scoping pattern elsewhere in this codebase).
6. Frontend: a generator form in the question bank / exam composer area, with job-status polling (simple interval poll is fine for v1 — no websockets/SSE), i18n'd in both locales.

### Step 4 — Non-spoiling exam hints

1. `POST /api/ai/hint` takes `sessionId` + `questionId`.
2. The caller must own an **in-progress** session (not completed, not someone else's).
3. The question must appear in that session's frozen `AnswerRecord` snapshot for that session — **resolve from `AnswerRecord`, not the exam template's current/live question set.**
4. The prompt sent to the AI client, and any post-processing of its response, must guarantee `correct_answer` (and anything that trivially implies it, e.g. "the answer is not X, Y, or Z" when only one option remains) never appears in the hint payload returned to the client. Write this as an explicit assertion in the response-building code, not just an instruction in the LLM prompt.
5. Server-side exam time limits/grace period continue to apply unchanged — a hint call must not extend or pause the exam clock.
6. Frontend: a hint control in the exam-taking view, keyboard-accessible, opt-in only (never auto-fires on question load).

## 6. Interfaces / Contracts

**`services/ai/client.py`**

```python
class AIResponse:
    content: str  # or parsed structured object, when response_schema was passed
    provider: str
    ...

class AIClient:
    async def complete(
        self,
        messages: list[dict],
        *,
        model_hint: str | None = None,
        response_schema: dict | None = None,
        timeout: float = ...,
    ) -> AIResponse: ...
```

No code outside `services/ai/` should import `openai` or `google.generativeai` (or equivalent) directly — always go through this interface.

**`POST /api/ai/explain`** — auth required, non-guest. Body identifies the completed session + question (or card). Response: explanation text/object. 503 on any provider failure. 404 if the session/template isn't visible to the caller (reusing `readable_template_or_404`'s rule).

**`POST /api/ai/explain-card`** — auth required, non-guest, card ownership required. Response: explanation text/object. 503 on provider failure, 404 if the card doesn't belong to the caller.

**`POST /api/ai/generate-questions`** — auth required, non-guest. Body: generation prompt/parameters (exact shape is an implementation decision — keep it minimal: topic/subject, exam type, question count, difficulty). Response: `202 {"jobId": string}`.

**`GET /api/ai/jobs/{jobId}`** — auth required, scoped to the job's owner. Response: `{"status": "pending"|"running"|"succeeded"|"failed", "result": ..., "error": ...}` (adjust field names to match the project's existing camelCase schema convention).

**`POST /api/ai/hint`** — auth required, non-guest, caller must own an in-progress session containing the given question in its `AnswerRecord` set. Response: hint text, guaranteed free of the correct answer. 503 on provider failure, 404/403 if the session/question pairing is invalid.

## 7. Dependencies & Assumptions

- **External libraries:** an OpenAI SDK and a Gemini SDK (add to `backend/requirements.txt`).
- **Environment variables:** `GEMINI_API_KEY`, `OPENAI_API_KEY` — both optional, default `""`. The client factory must treat an empty key as "this provider is unavailable," not throw at import/startup time.
- **Existing invariants this guide must not violate (from the project's own documented rules):**
  - `ExamService.readable_template_or_404` is the only path for by-id template reads (`is_public OR owned`, else 404 never 403). Explain/hint routes that touch a template must go through it.
  - Session answer keys are gated on the **session's** status (`completed`), not on question ownership — built-in/seeded questions have no owner (`user_id = NULL`), so gating on question ownership instead would break every seeded exam's results page.
  - Questions are a shared, mutable bank; an answered question's `options`/`correct_answer` are frozen once any `AnswerRecord` references it (409 on attempted edit) — the question generator in Step 3 only ever *inserts new* questions, it must never modify an existing question's content.
  - `get_db()` is the sole HTTP-request commit point; services `flush()` but never `commit()`/`rollback()`. The Step 3 background job is the deliberate exception (like `cleanup_guests.py`), since it isn't running inside a request's transaction.
- **Assumption:** registered, non-guest users only for every AI route.

## 8. Edge Cases & Error Handling

- **API key missing/empty for the selected provider:** client factory returns "unavailable" cleanly; the calling route maps this to 503 immediately, without attempting a network call.
- **Provider call times out:** bounded timeout fires, mapped to 503; do not let a hung provider call hold the request (or a worker) indefinitely.
- **Provider returns a 4xx/5xx:** caught and mapped to 503 (the AI provider's specific error code is an internal detail — never forward it raw to the client, and never turn it into a 500).
- **Provider returns malformed/unparseable structured output** (fails `response_schema` validation): treated as a failure, mapped to 503 (explain/hint) or a `failed` job status with a generic error message (generate) — never let a bad model response propagate as an unhandled exception.
- **Hint requested for a completed or foreign session:** 403/404 per the session-ownership convention; never silently return a hint anyway.
- **Hint response accidentally contains the answer** (model didn't follow instructions): must be caught by the explicit post-processing check in Step 4.5, not assumed away.
- **Generation produces zero valid questions** (e.g. schema validation fails on every candidate): job ends in `failed` status with an error message, not a `succeeded` status with an empty result.
- **Guest user calls any AI route:** 403.
- **Rate limit exceeded:** 429 with `Retry-After`, following `SlidingWindowLimiter`'s existing response shape exactly.
- **AI kill switch disabled (if implemented per Step 1.7):** every `/api/ai/*` route short-circuits to 503 before attempting any provider call.
- **App/health checks during a full provider outage:** `/api/health` and `/api/health/ready` must show green throughout — neither route touches AI providers.

## 9. Testing Checklist

Backend (`cd backend && ./venv/Scripts/python.exe -m pytest`):

- [ ] `services/ai/client.py` unit tests: provider selection logic, empty-key $\rightarrow$ unavailable behavior, timeout/retry behavior — all with the HTTP/SDK layer mocked, zero live provider calls.
- [ ] `explain`/`explain-card`: happy path, 401 (no token), 403/404 (guest or non-owner), 503 (mocked provider exception), 503 (mocked malformed response).
- [ ] `generate-questions`: happy path returns 202 + jobId; job polling reflects `pending` $\rightarrow$ `succeeded`/`failed`; generated questions land unattached to any public template; a second user cannot read the first user's job.
- [ ] `hint`: happy path; rejected for a completed session; rejected for a question not in that session's `AnswerRecord` set; **explicit regression test asserting the hint response never contains the session's `correct_answer` value for that question**.
- [ ] Re-run `backend/tests/test_exam_visibility.py` after wiring generate/hint, since both touch exam/session authz paths — confirm zero regressions on the existing invariants.
- [ ] A "provider down" test per new endpoint confirming 503 (never 500) and no stack trace in the response body.

Frontend (`cd frontend`):

- [ ] `npm run build`, `npm run lint:js`, `npm run lint:style`, `npm test` all pass.
- [ ] Manual/mocked smoke test of each of the three UI surfaces (explain button, generate form + polling, hint control) — confirm each has its own isolated loading/error state that doesn't affect the rest of the view on failure.
- [ ] i18n: both `en` and `vi` strings present for all new UI copy; Vietnamese strings use `font-body`/`font-label`.

**Degraded-mode smoke test (required before considering this guide done):**

- [ ] Blank out `GEMINI_API_KEY`/`OPENAI_API_KEY`, restart the backend, and manually confirm: app boots, health checks pass, card CRUD works, flashcard study/grading works, and a full exam attempt (create session $\rightarrow$ answer $\rightarrow$ submit $\rightarrow$ view results) works end-to-end — only the AI-specific buttons (explain/generate/hint) should show an error state, and none of them should be reachable from a blocking/required step in any of those flows.
