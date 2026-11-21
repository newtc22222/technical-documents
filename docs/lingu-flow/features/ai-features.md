---
id: ai-features
title: AI Features (User Guide)
sidebar_label: AI Features (User Guide)
sidebar_position: 1
description: User guide for AI explain, question generation, and assessment assistance.
---

# AI Features (User Guide)

LinguFlow can explain flashcards and attempt answers, and generate new practice questions.

These tools are **optional**. Study, grading, and exams work the same way if AI is off or the provider is down — you only see an error on the AI button you clicked.

Ships in [PR #96](https://github.com/newtc22222/lingu-flow/pull/96) (`feature/ai_generation` → `staging`). Developers: see [AI Service Layer](./ai-service-layer.md).

---

## Who can use it

| Account | Access |
|---|---|
| **Client** (default for new email / Google accounts) | Explain, hints, listening/TTS. The question-bank **AI** tab is hidden. |
| **Operator** | Client access, plus AI question generate and regenerate |
| **Root admin** (`ROOT_ADMIN_EMAILS`) | Operator capabilities, and the admin console (assign roles) |
| Guest | Core app only — AI buttons return “unavailable” / 403 |
| Signed out | Must log in |

Role rules: [Roles and Permissions](./roles-and-permissions.md).

An admin can turn **all AI** off instantly (kill switch). When that happens, every AI control shows a temporary-unavailable message — including for operators and root admins. Cards, SM-2 review, and exams keep working.

---

## 1. Explain a flashcard

Use this after you have seen the answer — it is a tutor, not a sneak peek.

| Where | When it appears |
|---|---|
| **Review** | After you flip the card (`Space`) |
| **Learn** | After you pick an option (MCQ) |

Click **Explain**. LinguFlow sends the card’s front, back, and notes to the AI and shows a short grammar/vocab explanation. Vietnamese UI strings use the body font so diacritics render correctly.

You can only explain **your own** cards.

---

## 2. Explain an attempt answer

On the **results** screen (after you submit), or via the ask panel in **practice**,
request **Explain** for an item.

- **Exam mode:** available after the attempt is **completed** — not mid-exam (that
  would leak the key).
- **Practice mode:** explain is allowed while the drill is in progress.
- The explanation uses the **pinned question version** you sat, including your
  answer vs the key — not today’s live bank row.

---

## 3. Generate questions

**Operators and root admins only.** Clients do not see the AI tab. Calling the API anyway returns 403.

In the **Question Bank**, open a new single question or passage set and choose the **AI** tab.

1. Enter a **topic** (required).
2. Choose exam type, count, and difficulty.
3. Click **Generate**. The call runs in that request (there is no background job). While it runs, the bank list keeps your filters and shows a placeholder row at the top for each requested question (at least one).
4. New questions land as **drafts**. They are not published and not attached to an exam until someone does that by hand. The status filter stays where you left it: on **any status** the drafts replace the placeholders and are marked as just generated; a filter that hides drafts does not show them.

Listening script / TTS generation is separate and stays available to clients. Synthesize has one overall deadline — see [TOEIC Listening](./toeic-listening.md).

---

## Keyboard recap

| Context | Key | Action |
|---|---|---|
| Live exam / practice | `A` `B` `C` `D` | Select an option (where MCQ) |
| Review | `Space` | Flip, then **Explain** if you want it |

---

## If something fails

| What you see | What it usually means |
|---|---|
| “AI is temporarily unavailable.” | Keys not configured, provider timeout, kill switch off, or a bad/spoiling model reply |
| Button does nothing useful as a guest | Register or convert your guest account |
| Generate stays failed | Topic too thin, or the model returned unusable questions — try a clearer topic |

None of these block finishing an exam or grading a card. Close the panel and continue.

---

## Privacy (short version)

- API keys never live in the browser. The SPA calls LinguFlow’s `/api/ai/...` and
  attempt explain routes (`/api/attempts/.../explain`).
- Explanations may be cached so the same card/answer + language is not regenerated every time.
