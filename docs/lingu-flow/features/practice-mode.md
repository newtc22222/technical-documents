---
id: practice-mode
title: Practice Mode
sidebar_label: Practice Mode
sidebar_position: 6
description: Untimed or soft-timed practice drills, notes, and instant feedback.
---

# 🎯 Practice Mode

How LinguFlow runs **practice drills** — untimed or soft-timed sittings that
reuse the same attempt machinery as certification exams, without exam lobby
rules, section locks, or dashboard score pollution.

**Audience:** developers changing practice setup, attempt mode gates, notes,
immediate feedback, or the `/api/practice/*` surface. Product readers can stop
after [What this is](#-what-this-is).

**Related pages:** [Question & Exam Design](../architecture/question-and-exam-design.md) (shared
domain model) · [API Documentation](../architecture/api-documentation.md) ·
[Exam-Type Feature Flags](./exam-type-feature-flags.md) ·
[AI Features](./ai-features.md) (mid-drill explain)

> **Assessment v2.** Practice is **not** a separate session table. It is
> `attempts.mode = 'practice'` plus `practice_spec`, optional clocks, and
> `question_notes`. The older v1 design (`PracticeSession` / `PracticeAnswer`)
> in `docs/superpowers/specs/2026-08-18-practice-mode-design.md` was superseded
> by the exam/practice split and was never shipped.

---

## 🎯 What this is

Practice is the study path for everything the exam runtime refuses:

| | Exam attempt | Practice attempt |
|---|---|---|
| Entry | Exam lobby (`blueprint_met` only) $\rightarrow$ `POST /api/attempts` | `/practice` $\rightarrow$ `POST /api/practice/from-exam` or `/from-bank` |
| Paper source | Full published `ExamVersion` | Subset of an exam **or** bank draw |
| `exam_version_id` | Required | Required for exam-sourced; **null** for bank draws |
| Navigation | Section-ordered; locks on finish / deadline | Free jump across the paper |
| Timer | Hard countdown; auto-submit | Untimed (count-up), custom minutes, or copy the exam limit — pause/resume allowed |
| Feedback | Withheld until finish | Optional `feedbackMode: immediate` |
| AI explain | Completed attempts only | Allowed mid-sitting, including unanswered items |
| Notes | — | Per-question upsert; resurfaces on later drills |
| Guests | Product-dependent | **Refused** (`403 Registered account required`) |
| Dashboard / exam history | Included (`mode = 'exam'`) | Excluded |

Legacy exams demoted with `blueprint_met = false` stay sittable **only** through
Practice (exam lobby hides them). Practice setup lists every visible exam,
including those demoted papers.

---

## 🧭 User flow

1. Open **`/practice`** (`PracticeSetupView.vue`).
2. Choose a tab:
   - **From an exam** — pick exam $\rightarrow$ tick section/part keys $\rightarrow$ optional count $\rightarrow$
     time mode $\rightarrow$ feedback mode $\rightarrow$ Start.
   - **Custom** — bank filters (`examType`, `section`, `skill`, `difficulty`,
     `tags`, `locale`) + required count $\rightarrow$ time $\rightarrow$ feedback $\rightarrow$ Start.
3. Backend creates an `Attempt` with `mode=practice`, freezes `attempt_items`
   (version-pinned, same as exams), stores `practice_spec`, returns
   `AttemptPaperOut`.
4. Router navigates to `/attempts/:attemptId` — the shared `AttemptView` /
   `attemptStore`, mode-aware via practice flags (free nav, pause, notes,
   optional check panel).
5. Finish $\rightarrow$ `/attempts/:attemptId/results`. Resit the same draw later with
   `POST /api/practice/drills/{id}/resit` (identical `questionIds`).

---

## 🗃️ Data model

### `attempts` (practice columns)

| Column | Meaning |
|---|---|
| `mode` | `'exam'` \| `'practice'` (indexed) |
| `exam_version_id` | Nullable **only** for bank-drawn practice |
| `practice_spec` | JSONB draw record (source, filters / node keys, `questionIds`, limits) |
| `feedback_mode` | `'none'` \| `'immediate'` |
| `paused_at` / `resumed_at` / `accumulated_seconds` | Pause-aware elapsed time |

Elapsed time is one function: banked seconds while paused, otherwise banked +
current stretch. Exam mode never pauses, so its deadline math stays identical.

### `practice_spec` shapes

**From exam:**

```json
{
  "source": "exam",
  "examId": "…",
  "examVersionId": "…",
  "nodeKeys": ["part5", "part6"],
  "count": 20,
  "questionIds": ["…"],
  "timeLimitSeconds": null,
  "feedbackMode": "none"
}
```

**From bank:**

```json
{
  "source": "bank",
  "filters": {
    "examType": "toeic",
    "section": "part5",
    "skill": null,
    "difficulty": "medium",
    "tags": ["business"],
    "locale": "en"
  },
  "count": 20,
  "questionIds": ["…"],
  "timeLimitSeconds": null,
  "feedbackMode": "immediate"
}
```

`questionIds` records the resolved draw. **Resitting repeats the same paper** —
progress on a fixed set, not a fresh shuffle. A new draw is a new drill from
setup. `count` is **clamped** to available items (asking for 30 of 12 yields 12,
not an error). Bank draws sample from the **full** matching published set the
caller can read — not “newest N then shuffle”.

### `question_notes`

| Column | Notes |
|---|---|
| `(user_id, question_id)` | Unique — one note per learner per **question identity** |
| `note_text` | Upsert; empty string **deletes** the row |

Notes follow the question identity across version edits (typo fixes do not
orphan them). They are private: never returned on bank listings; attached to
paper items and results for the author only.

---

## 🌐 API

Router: `backend/app/routers/assessment_practice.py`. Sitting after start uses
the shared attempt routes.

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/practice/from-exam` | `{examId, nodeKeys, count?, timeLimitSeconds?, feedbackMode}` $\rightarrow$ `201 AttemptPaperOut` |
| `POST` | `/api/practice/from-bank` | `{filters, count, timeLimitSeconds?, feedbackMode}` $\rightarrow$ `201 AttemptPaperOut` |
| `POST` | `/api/practice/drills/{id}/resit` | Owner only; same `practice_spec` / `questionIds` |
| `PUT` | `/api/practice/notes` | `{questionId, noteText}` upsert; empty deletes |
| `POST` | `/api/attempts/{id}/pause` · `/resume` | Practice only; exam $\rightarrow$ **409** |
| `POST` | `/api/attempts/{id}/responses/{position}/check` | Immediate feedback; exam / non-immediate $\rightarrow$ **403** |
| `POST` | `/api/attempts/{id}/items/{position}/explain` | Allowed for in-progress **practice**; still blocked for in-progress **exam** |

### Authz & gates (do not weaken)

- **Registered account** — guests get `403` with `Registered account required`
  on practice start / resit.
- **Exam-type kill switch** — disabled types $\rightarrow$ `403 This exam type is currently unavailable`
  (same control as exam start; practice must not bypass it).
- **Visibility** — unreadables $\rightarrow$ **404**, never 403 (don’t confirm existence).
- **Another user’s drill / note** $\rightarrow$ **404**.
- Bank draws respect `services/assessment/access.py` — practice is not a path
  to private bank items.

---

## 🖼️ Frontend

| Path | Role |
|---|---|
| `features/assessment/practice/PracticeSetupView.vue` | `/practice` setup UI |
| `features/assessment/practice/practiceSpec.ts` | Body builders, section options, time/feedback helpers |
| `features/assessment/runtime/AttemptView.vue` | Shared booth; practice notes + check/explain panels |
| `features/assessment/runtime/attemptStore.ts` | Pause-aware elapsed; mode flags |
| `api/client.ts` $\rightarrow$ `practice.*` | Typed wrappers |

Mode differences should stay behind one composable / store getters
(`canNavigateFreely`, `canPause`, `revealsFeedback`, …) rather than
`mode === 'practice'` scattered through templates.

---

## 🔗 Why not separate practice tables?

A second subsystem would duplicate scoring, review projection, stimulus
resolution, and response inputs. A hidden `Exam` per drill would force every
exam query to remember an exclusion. `mode = 'practice'` makes “keep practice
out of exam history” a filter on what the row **is**, and version-pinning on
`attempt_items` still protects finished review from bank edits.

Design source of truth (repo, not wiki):
`docs/superpowers/specs/2026-09-08-exam-practice-split-design.md`.

---

## ⚠️ Gotchas

- **Lobby vs practice list.** Exam lobby = `blueprint_met` only. Practice setup =
  all readable exams (including demoted legacy papers).
- **Immediate feedback is opt-in.** Default `feedbackMode` is `none`; `/check`
  stays 403 until immediate is set.
- **Explain gate is mode-scoped only.** Do not add client flags or ownership
  shortcuts that could reopen mid-exam explain.
- **Silent `??` fallbacks.** `examId` / `examName` are optional on `AttemptOut`
  for bank drills — treat null explicitly.
- **Contract regen.** After schema changes:
  `cd frontend && npm run gen:api && npx prettier --write src/api/ && git diff --exit-code src/api/`.
