---
id: release-v1.2.1
title: LinguFlow 1.2.1
sidebar_label: v1.2.1
sidebar_position: 4
description: Release notes for LinguFlow v1.2.1, including three themes, OMR answer sheet, and accessibility improvements.
---

# LinguFlow 1.2.1

**Release version:** `v1.2.1`  
**Status:** Superseded by [v1.3.0](./release-v1.3.0.md)  
**GitHub Release:** https://github.com/newtc22222/lingu-flow/releases/tag/v1.2.1  
**Previous:** [v1.2.0](./release-v1.2.0.md) · [v1.1.1](./release-v1.1.1.md)

Production cut of staging since v1.2.0. The arcade cabinet gets three palettes,
the exam gets a real answer sheet, and the version now lives in one place instead
of seven.

Version strings are `1.2.1` on the package, `GET /api/health`, OpenAPI, and the
arcade footer.

---

## Product highlights

| Area | What's in 1.2.1 |
| ------ | ------------------ |
| Themes | `light` (paper, the new default), `dark`, and `simple` (answer sheet) |
| Answer sheet | OMR exam card with a rail layout, "mark for review" ticks, and jump-to-next-marked |
| Accessibility | Form controls clear WCAG 2.1 SC 1.4.11 in the `simple` theme |
| Copy | All locale copy is sentence case; arcade chrome re-shouts where the design calls for caps |

Themes are pure token overrides in `styles/tokens.css` — no `if (theme === …)`
branchance — and the choice persists in user settings, retiring the CRT switch.
Review marks are session-local by design: the sitter's own scratch annotation,
not part of the graded record.

---

## New since v1.2.0

### Accessibility and correctness

- Form controls have a perceivable border in the `simple` theme.
  `--surface-panel-border` gave inputs and checkboxes a 1.25:1 edge on a white
  panel (1.05:1 against their own fill), against SC 1.4.11's 3:1 for a control
  boundary. A dedicated `--control-border` now clears 3:1 on every surface an
  input can sit on, without darkening decorative panel edges
- The marked-count button keeps its visible text in its accessible name, so
  speech input can reach it and screen readers keep the count
- `font-numeric` no longer wraps localized text. It resolves to `Press Start 2P`
  on light and dark, which has no Vietnamese diacritic glyphs, so the `à` in
  "3 ngày" rendered as a missing glyph
- The theme survives unavailable `localStorage`. It is applied as an import side
  effect before mount, and storage *throws* rather than returning null in a
  sandboxed iframe or under blocked site data — an unguarded call took the whole
  app down, not just the theme
- `theme` is constrained to the three supported values (422 otherwise). Reading
  stays lenient: an unrecognised or non-string stored value coerces to the
  default rather than 500ing the settings page
- Rendered markdown has a typography layer. Preflight resets list markers and heading sizes, so card markdown typography rules are now applied.
- Answer writes serialize per question, so a slow save can no longer land after a
  later one and persist a stale prefix

### Engineering

- The version is authored once in the root `package.json`. `npm run version:sync`
  writes it into `frontend/package.json` and a generated `backend/app/version.py`,
  and a guard test fails CI on drift
- Sentence starts, the `LINGUFLOW` brand spelling, and a case-mismatched i18n
  placeholder repaired across both locales

---

## Deploy notes (production)

**No migration.** Nothing new under `backend/alembic/versions/` since v1.2.0 —
the theme rides in the existing `user_settings` JSON column.

**Seeder:** one new template, `toeic-lr-full` (`seedVersion` 2), seeded
**non-public**. No existing seed version changes, so no template is rewritten and
no questions are archived.

> The 200-item TOEIC sample is an answer-sheet fixture, not a practice test — all
> 200 items share one option set, there is no audio or photography, and the Part 7
> passages are labels like "Article 1.". It is seeded with `isPublic: False` so
> the answer sheet can be exercised at official length while no user is offered
> it. Flip the flag when the content is real. The seeder now honours a
> per-template `isPublic`; it previously hardcoded `True`.

Confirm `GET /api/health` reports `"version": "1.2.1"`.

---

## Not in this release

- Audio and photography for the TOEIC sample, which is what would make it
  publishable
- Grading of written responses — essays are still captured and excluded from the
  denominator, with no reviewer flow (#20)
- Speaking — no mic capture, no sitter-side upload, no audio playback in results
  (#79, #89, #90, #91)
- Scaled and band scoring — scores remain a raw percentage

---

## Shipped PRs

- #104 three palettes, OMR answer sheet, and TOEIC L&R sample
- #105 this release (staging → main)

## Issues closed

None tracked; this work came from design and review rather than issues.

**Tag:** `v1.2.1` on `main`.

**Next:** [v1.3.0](./release-v1.3.0.md) — AI tutor, flashcard TTS, sheet import, Learn.
