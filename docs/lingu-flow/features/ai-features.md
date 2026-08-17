---
id: ai-features
title: AI Features (User Guide)
sidebar_label: AI Features (User Guide)
sidebar_position: 1
description: How to use AI flashcard explain, exam answer explain, question generate, and live exam hints.
---

# AI Features (User Guide)

LinguFlow can explain flashcards and exam answers, generate new practice questions, and offer a **non-spoiling hint** during a live exam.

These tools are **optional**. Study, grading, and exams work the same way if AI is off or the provider is down — you only see an error on the AI button you clicked.

Ships in [PR #96](https://github.com/newtc22222/lingu-flow/pull/96) (`feature/ai_generation` → `staging`). Developers: see [AI Service Layer](./ai-service-layer.md).

---

## Who can use it

| Account | Access |
|---|---|
| Registered (email / Google) | Explain, generate, hint |
| Guest | Core app only — AI buttons return “unavailable” / 403 |
| Signed out | Must log in |

An admin can turn **all AI** off instantly (kill switch). When that happens, every AI control shows a temporary-unavailable message. Cards, SM-2 review, and exams keep working.

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

## 2. Explain an exam answer

On the **results** screen (after you submit), expand a question and click **Explain**.

- Available only on a **finished** exam — never mid-attempt (that would leak the key).
- The explanation uses the question as you sat it, including your answer vs the key.
- Bank-authored explanations (if any) still appear above; AI explain is extra.

---

## 3. Generate questions

In the **Question Bank** (`BANK` in the nav), the compose column has **Generate with AI**.

1. Enter a **topic** (required).
2. Choose exam type (TOEIC / IELTS / HSK / JLPT / custom), count (1–10), and difficulty.
3. Click **Generate**. The job is queued immediately — you do not wait on the model in the same click.
4. Status updates every couple of seconds (`pending` → `running` → `succeeded` or `failed`).
5. On success, the new questions appear in **your** bank.

Generated questions:

- Belong to **you**.
- Are **not** attached to any exam (including built-ins). Attach them yourself in the exam composer if you want them in a set.
- Never overwrite an existing question.

If every candidate fails validation, the job is **failed** (not “success with zero questions”).

---

## 4. Hint during an exam

In a **live** sitting, a **Hint (H)** control sits under the question.

- Opt-in only — it never fires when the question loads.
- Keyboard: press **`H`** (ignored while you are typing in a field).
- Does **not** pause or extend the exam clock.
- The hint must not name the correct letter or quote the winning option. If the model slips, LinguFlow discards the text and you see “AI is temporarily unavailable” instead of a spoiler.

Hints are only for **your** in-progress session, and only for a question that is actually on that exam.

---

## Keyboard recap

| Context | Key | Action |
|---|---|---|
| Live exam | `A` `B` `C` `D` | Select an option |
| Live exam | `H` | Request a hint (opt-in) |
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

- API keys never live in the browser. The SPA only calls LinguFlow’s `/api/ai/...` routes.
- Explanations may be cached so the same card/answer + language is not regenerated every time.
- Hints are not cached (they are session-specific).
