---
id: 07-frontend-quality
title: 07 — Frontend Quality & Consistency
sidebar_label: 07 Frontend Quality
sidebar_position: 8
description: Frontend data-access patterns, UI consistency, streak date calculation, and Vitest testing.
---

# 07 — Frontend Quality & Consistency

**Findings covered:** F-12, F-13, F-10 (skill accuracy), FE test gap from CLAUDE.md  
**Horizon:** B  
**Effort:** 1–2 days conventions + streak; longer for test bootstrap

---

## Context

Frontend restructure (Phase 1.5) and console redesigns (library, question bank, exam booth, flashcards lobby) left the **product UI strong** and the **data-access story inconsistent**.

---

## F-12 — One data-access convention

### Current triad

| Pattern | Used by | Shape |
|---------|---------|-------|
| Pinia store actions | exam, question-bank, auth | Shared state + API |
| Feature `api.ts` module | library | Thin functions, local view state |
| Inline `apiFetch` in views | dashboard, flashcards, profile | Fast but scatters contracts |

### Decision (recommended)

```text
1. apiFetch is the only HTTP primitive (except public auth pre-token).
2. If state is shared across routes/components → Pinia store in features/<x>/store/
3. If state is single-view → composable or feature api.ts called from the view
4. Never raw fetch with hand-rolled Authorization (except AuthView before token exists)
```

---

## F-13 — Streak date consistency

### Problem

Dashboard streak compares UTC `card.updated_at.date()` with `date.today()` (server local). For UTC+7 learners, early-morning study can land on “yesterday” UTC and break streaks.

### Fix

1. Compute “today” as `datetime.now(timezone.utc).date()` everywhere for streak.
2. Unit-test with fixed freezegun/clock around midnight UTC.

---

## UX / design system (keep winning)

- Tokens only (`tokens.css` + stylelint)
- `AppButton`, `PixelFrame`, `ModalShell`, `KeyboardGridList`
- `font-pixel` never for Vietnamese body copy
- Full-bleed consoles for library/bank

---

## Frontend testing bootstrap (recommended path)

### Phase FE-T1 (half day)
- Add Vitest + Vue Test Utils.
- Test pure helpers: `utils/options.ts`, streak pure function, SM-2 mapping.

### Phase FE-T2 (1 day)
- Store tests: `examStore` finish error handling, timer cleanup on unmount.
- `apiFetch` 401 redirect behavior (jsdom mock).

### Phase FE-T3 (later)
- Playwright smoke: login guest → create deck → review one card → start public exam → finish.

---

## Next

→ [08 — Product Roadmap](./08-product-roadmap.md) — Phase 2–5 gated by foundation.
