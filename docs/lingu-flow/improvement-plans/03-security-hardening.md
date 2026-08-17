---
id: 03-security-hardening
title: 03 — Security Hardening
sidebar_label: 03 Security Hardening
sidebar_position: 4
description: Deep dive on security hardening, JWT validation, exam visibility, answer keys, and timing integrity.
---

# 03 — Security Hardening (Deep Dive)

**Findings covered:** F-01, F-02, F-03, F-05 (integrity angle), F-09  
**Horizon:** A (P0)  
**Effort:** ~0.5–1 day for P0; F-05 product decision may extend

---

## Threat model (pragmatic)

| Threat | Impact | Likelihood today | Mitigations |
|--------|--------|------------------|-------------|
| Forge JWT with known secret | Full account takeover | High if F-01 path used | Fix guard; rotate secrets; never commit secrets |
| Enumerate private exam UUID | Content theft, spoilers | Medium (UUIDs hard but shareable/leaked) | Visibility predicate on all reads |
| Read answer key mid-exam | Cheating / spoilers | High via API | Gate details on `completed` + ownership |
| JWT in URL (SSE) | Log/history leak | Low (endpoint unused) | Remove or ticket-based auth |
| Client-only exam timer | Inflated scores / practice abuse | High for “cert simulator” pitch | Server deadline or product honesty |
| Auth brute force | Account takeover | Medium | Rate limit (Horizon B) |

---

## F-01 — Production JWT guard must always fire

### Problem

```python
# config.py validator (conceptual)
env = os.getenv("ENVIRONMENT", "development")  # ignores .env-loaded field
```

Pydantic loads `ENVIRONMENT=production` from `backend/.env`, but the validator still thinks “development” and accepts the hardcoded fallback secret that appears in repo + docker-compose.

### Fix design

1. In `JWT_SECRET` validator, use `info.data.get("ENVIRONMENT")` (field order already declares `ENVIRONMENT` first).
2. Keep process-env override semantics: if both set, Pydantic Settings merge rules already apply — do not reintroduce `os.getenv` for this check.
3. Tests:
   - **Existing:** `os.environ["ENVIRONMENT"]="production"` + empty/default secret → raises (keep).
   - **New:** temporary `.env` file with `ENVIRONMENT=production` and no `JWT_SECRET` / default secret → `Settings()` raises (covers F-01).
   - **New:** production + strong random secret → accepts.

### Ops follow-up

- Rotate production `JWT_SECRET` if any environment ever ran with the committed default.
- Ensure Railway dashboard shows real secret (not compose default).
- **Required:** fail boot if secret length < 32 bytes in production (enforced in `config.py` alongside fallback rejection).

---

## F-02 — Template visibility predicate

### Problem

| Endpoint | Auth | Visibility |
|----------|------|------------|
| `GET /api/exams/templates` | optional | Correct: public OR owned |
| `GET /api/exams/templates/{id}` | **none** | **None** |
| `GET /api/exams/templates/{id}/questions` | optional | **None** (only key redact) |

### Design

Introduce one helper next to `_owned_template_or_404`:

```text
_readable_template_or_404(db, template_id, user | None) -> ExamTemplate
  allow if template.is_public OR (user and template.user_id == user.id)
  else 404  # prefer 404 over 403 to avoid existence oracle
```

Apply to:
- `GET /templates/{id}`
- `GET /templates/{id}/questions`
- Any other by-id read that currently uses unfiltered `get_template_by_id`

---

## F-03 — Session details answer-key policy

### Problem compound

1. `create_session` uses unfiltered template lookup → any user can start private exams (via F-02).
2. `GET .../sessions/{id}/details` returns full `QuestionResponse` including `correctAnswer` regardless of `status` and weak ownership story.

### Design

**A. create_session**
- Resolve template via `_readable_template_or_404`.
- Only allow session creation on public OR owned (same predicate).

**B. get_session_details**
- Require authenticated owner of the session (`session.user_id == current_user.id`) — return 404 otherwise.
- Map questions through `build_question_response`.
- **Answer key rule:**
  - Include `correctAnswer` / explanations **only if** `session.status == "completed"` (and caller is owner).
  - While `in-progress` / `abandoned`, return public-shaped questions (stem, options, media) without key.

---

## F-05 — Exam timing (product + security)

### Recommendation: Soft enforce + lazy check on answer/finish

```text
on record_answer / finish_session:
  if now > started_at + time_limit + 30s grace:
    auto-transition to completed (score what is answered) OR 400 with code EXAM_EXPIRED
  if status already completed: finish is idempotent no-op (return current score)
```

---

## F-09 — Deprecate or remove unused SSE endpoint

The `/api/events` endpoint accepted a JWT token in the query string and was not consumed by the Vue frontend.

### Fix
1. Remove `backend/app/routers/events.py` and decouple `sse-starlette` from requirements.
2. If real-time event streaming is needed in future phases (e.g. for AI generation job progression), implement a secure ticket-based or cookie-authenticated streaming channel.
