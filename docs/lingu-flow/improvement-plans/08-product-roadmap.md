---
id: 08-product-roadmap
title: 08 — Product Roadmap
sidebar_label: 08 Product Roadmap
sidebar_position: 9
description: Product roadmap across Phases 2 through 5 with system-design gates.
---

# 08 — Product Roadmap (Phases 2–5) with System-Design Gates

Open GitHub issues already track product work. This document sequences them against foundation work and adds capacity/abuse constraints so AI and social features do not re-break integrity.

---

## Gate: Foundation first

| Gate | Required before |
|------|-----------------|
| Horizon A security (F-01–F-03) | Any public launch push; any AI that reads private exams |
| Horizon A integrity (F-04, F-08) | Any multi-step AI write (generate + attach questions) |
| Horizon A ops (F-06) | Replicas > 1 or multi-worker |
| Horizon B rate limits | Guest + AI endpoints public |
| Spend budget + job queue design | Phase 2 AI ship |

---

## Phase 2 — AI features (issues #8–#11)

| Issue | Title | System-design notes |
|-------|-------|---------------------|
| #8 | Provider-agnostic AI client | Single interface; timeout; no secrets in FE; map to `GEMINI_API_KEY` / `OPENAI_API_KEY` |
| #9 | AI question generator | **Async job**; write to bank as draft; human confirm before attach; rate limit per user/day |
| #10 | Grammar & vocab explainer | Cache explanations by `(question_id, locale)` to control cost; never leak keys in prompts |
| #11 | Smart hints in ExamRoom | Hints must **not** include correct answer; log hint usage for analytics later |

---

## Phase 3 — Adaptive learning & analytics (#12–#16)

| Issue | Title | Design notes |
|-------|-------|--------------|
| #12 | AI flashcards from text | Same job pipeline as #9; bulk card insert transaction (F-04 pattern) |
| #13 | User analytics engine | **Read models** / nightly aggregates; do not scan raw cards on dashboard (extends F-07) |
| #14 | Adaptive exam mode | Select from bank by tags/difficulty; freeze selection in AnswerRecords at start |
| #15 | Personalized study plan | Derived from SRS + weak tags; store plan snapshots |
| #16 | PDF progress reports | Worker + R2 storage; time-limited download URL |

---

## Phase 4 — Social & gamification (#17–#18)

| Issue | Title | Design notes |
|-------|-------|--------------|
| #17 | Community exam & deck library | Visibility model expands (public/unlisted/private); clone-on-fork; license/report abuse |
| #18 | Achievements, badges, leaderboard | Write-heavy streaks; leaderboard = periodic recompute or Redis sorted set |

---

## Phase 5 — Listening / writing (#19–#20)

| Issue | Title | Design notes |
|-------|-------|--------------|
| #19 | Listening simulator (TTS) | Audio assets on R2; player UI; parts with image+audio; bandwidth/CDN |
| #20 | AI writing grader | Long-running jobs; rubric storage; human appeal path optional |

---

## Next

→ [09 — Implementation Backlog](./09-implementation-backlog.md) for executable tickets.
