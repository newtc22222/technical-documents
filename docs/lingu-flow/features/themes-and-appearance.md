---
id: themes-and-appearance
title: "Themes & Appearance"
sidebar_label: "Themes & Appearance"
sidebar_position: 10
description: "The four presets, per-user theme overrides, derived contrast, and the exam theme lock."
---

# 🎨 Themes & Appearance

LinguFlow ships four selectable theme presets, and since v2.1.0 each user can layer their own tweaks on top of the chosen preset from **Settings → Appearance**. Exams use a separate locked sheet.

Related: [Database §3.10 `user_settings`](../architecture/database-design.md), [API Documentation §10](../architecture/api-documentation.md). Component and token rules live in the repository (`frontend/COMPONENTS.md`, `.context/ui-guidelines.md`).

---

## 1. Presets

| Preset id | Notes |
| --- | --- |
| `arcade-light` | Light fallback. Also the account default in `settings_service.py` |
| `arcade-dark` | |
| `simple-light` | |
| `simple-dark` | |
| `exam` | **Internal.** Painted while an exam is being sat; not selectable and rejected by the API |

A theme is a *token override*: components read semantic tokens (`--text-primary`, `--surface-page`, `--color-accent`, `--status-*-fill`, …) and never branch on the theme name.

**Legacy ids.** Before v2.1.0 the presets were `light`, `dark` and `simple`. Stored values and tabs that have not reloaded still work: `light → arcade-light`, `dark → arcade-dark`, `simple → simple-light`. The API maps them *before* validation, so an old tab saving `"dark"` neither fails with a 422 nor persists the legacy string.

A saved preset lives in `user_settings.settings.theme` and in `localStorage`, so a 401 redirect to the sign-in page still looks right. The script in `frontend/index.html` paints before the app mounts.

**First visit.** With no `theme` key in `localStorage`, that script and `resolveInitialTheme()` in `src/theme/index.ts` follow `prefers-color-scheme`: dark paints `arcade-dark`, and light or a missing `matchMedia` paints `arcade-light`. The module applies that paint with `persist: false`, so the choice is not written and the next load still follows the OS. A stored preset wins over the OS, including the legacy aliases above. After sign-in, `GET /api/settings` applies the account theme and `setTheme` stores it (`App.vue`). A new account receives `arcade-light`, so a signed-in user stops following the OS from that response on.

---

## 2. Per-user overrides

Stored under `settings.themeOverrides`. Every field is optional; a missing field means "use the preset".

| Field | Type | Allowed values |
| --- | --- | --- |
| `accent` | colour | `#rrggbb` |
| `pageBackground` | colour | `#rrggbb` |
| `panelSurface` | colour | `#rrggbb` |
| `border` | colour | `#rrggbb` |
| `textPrimary` | colour | `#rrggbb` |
| `bodyFont` | font id | `plex-sans`, `plex-mono`, `linguflow-display`, `noto-sans` |
| `displayFont` | font id | same list |
| `fontScale` | number | 0.875 – 1.25 |
| `corners` | enum | `pixel`, `square` |
| `arcadeEffects` | boolean | `true` / `false` |

### API contract

- `PUT /api/settings` treats `themeOverrides` as a **whole object**: omit it to leave the stored set untouched, send `{}` to clear it.
- Writes are strict (`extra="forbid"`): an unknown or UI-only key is a **422**. Colours must be six-digit hex, fonts must come from the list, and `fontScale` must be a real number in range.
- Reads are lenient: a stored field that no longer passes validation is dropped on its own, so one stale value never discards the user's other choices and never 500s `GET /api/settings`.

### Why the client is careful

The stored values end up in `style.setProperty`. They go through exactly one door, `sanitizeThemeOverrides` → `themeOverrideProperties` (`src/theme/overrides.ts`), and a `<style>` string is **never** built from stored data (a `url()` in injected CSS can exfiltrate). The early-paint script in `index.html` repeats the same mapping in ES5, and a test runs that script against the module so the two cannot drift.

---

## 3. Readable colours are derived, not rejected

Instead of refusing a colour that would be hard to read, the app computes the readable variant.

| Derived value | Rule |
| --- | --- |
| Text on an accent (buttons) | Brand ink, then white, then black: the first that reaches **4.5 : 1**. Black is needed because ink-or-white alone leaves some mid-tone accents near 4.25 : 1 |
| The accent used as *text* (`--color-accent`, `--text-label-accent`, focus ring) | Kept as chosen where it already reads; otherwise moved toward the text colour only as far as needed to reach 4.5 : 1 on the page, panel, hover, idle and accent-tinted surfaces |
| Secondary text | Softened by the same method |
| Text on green/red status fills | Always `--text-on-status`, which never follows the accent |

The default amber, for example, is only 3.4 : 1 as text on the light page; derived, it becomes `#73552b` (5.15 : 1) on that preset and is left alone on the dark presets. Because the result depends on the surfaces behind it, derivation takes the preset into account and re-runs when the preset changes. Tints are blended in sRGB and emitted as hex so the contrast figures are exact.

The Settings editor additionally checks pairs the user actually **changed** (page vs. text, panel vs. text, and so on). It does not check the shipped presets' decorative borders, which are deliberately soft.

---

## 4. The Appearance editor

`Settings → Appearance` (`ThemeEditor.vue`) edits a **draft**. Changes are painted live as an unsaved preview and are only written when the user saves. The preview ends when the editor closes, and an exam lock always wins over it.

**Noto Sans** is delivered by `@fontsource-variable/noto-sans` and loaded lazily, only when a user selects it.

---

## 5. Exam lock

While a user sits an exam the app switches to the internal `exam` sheet so every candidate sees an identical paper:

- The lock clears every inline override property, so a custom accent or font cannot leak into the exam.
- The user's chosen preset is **not** changed; `examLockHeld` is true while any lock is held.
- Locks are counted, so nested or overlapping holders cannot release each other, and leaving the exam restores the user's own theme exactly (fixed in v2.1.0 so the lock neither leaks nor sticks).

---

## 6. Related layout changes in v2.1.0

- The signed-in header is its own component (`AppHeader.vue`) with fixed layout, keyboard handling and ARIA.
- Profile and Settings are grouped into sections (`ProfileSection`, `FieldRow`).
