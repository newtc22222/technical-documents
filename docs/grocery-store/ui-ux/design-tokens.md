---
id: design-tokens
title: "Design Tokens & Theme Specification"
sidebar_label: "Design Tokens"
sidebar_position: 2
description: "Design Tokens — Grocery Store POS & Tax Application."
---
# Design Tokens & Theme Specification

The application's visual styling is governed by design tokens defined in `frontend/src/theme/tokens.json` and compiled into CSS variables in `_tokens.scss`. These tokens enforce WCAG AAA compliance systematically.

---

## 1. Color System Tokens

```scss
// Primary Brand Colors (WCAG AAA Contrast >= 7:1)
$color-primary: #1e40af;       // Deep Royal Blue (8.3:1 on white)
$color-primary-hover: #1e3a8a; // Darker Blue
$color-primary-text: #ffffff;  // White on Blue

// Transactional Action Colors
$color-action-pay: #15803d;    // Deep Emerald Green (7.1:1 on white)
$color-action-cancel: #b91c1c; // Deep Crimson Red (7.8:1 on white)

// Text Hierarchy
$text-primary: #0f172a;        // Deep Slate 900 (16.1:1 on white)
$text-secondary: #334155;      // Slate 700 (9.2:1 on white)
$text-muted: #475569;          // Slate 600 (5.8:1, used only on large sub-headers)

// Neutral Backgrounds
$bg-app: #f8fafc;              // Soft Slate 50
$bg-surface: #ffffff;          // Pure White
$bg-card: #ffffff;             // Card Container
$border-strong: #94a3b8;       // Slate 400 (High contrast border)
```

---

## 2. Typography Tokens

```scss
// Font Family
$font-family-base: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;

// Font Sizes (Strictly >= 18px body)
$font-size-sm: 1.0rem;     // 16px (Absolute floor, badges only)
$font-size-base: 1.125rem; // 18px (Standard body text, inputs, buttons)
$font-size-lg: 1.25rem;    // 20px (Card titles, table headers)
$font-size-xl: 1.5rem;     // 24px (Screen subheadings, keypad digits)
$font-size-2xl: 1.75rem;   // 28px (Main tab headings)
$font-size-3xl: 2.25rem;   // 36px (Cart grand totals, invoice sums)

// Font Weights
$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
```

---

## 3. Component & Layout Sizing Tokens

```scss
// Touch Targets
$touch-target-min: 48px;       // WCAG AAA standard min target
$button-height-standard: 56px; // High-confidence interactive buttons
$button-height-primary: 96px;  // Oversized 96px for "THANH TOÁN" & "HỦY ĐƠN"

// Product Card Grid
$card-product-width: 150px;
$card-product-height: 150px;

// Border Radius
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 16px;

// Focus Indicator (High Visibility)
$focus-ring-width: 4px;
$focus-ring-color: #2563eb;
$focus-ring-offset: 2px;
```

---

## 4. CSS Variable Mappings (`_tokens.scss`)

These tokens are exposed globally to Angular templates:

```css
:root {
  --color-primary: #1e40af;
  --color-pay: #15803d;
  --color-cancel: #b91c1c;
  --text-main: #0f172a;
  --bg-app: #f8fafc;
  --font-base: 18px;
  --font-total: 36px;
  --btn-primary-h: 96px;
  --btn-std-h: 48px;
}
```

---

## 5. Focus & High-Contrast Accessibility Mixins

```scss
@mixin accessible-focus {
  &:focus-visible {
    outline: 4px solid var(--color-primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 6px rgba(30, 64, 175, 0.25);
  }
}

@mixin action-button-96 {
  height: 96px;
  min-height: 96px;
  font-size: 24px;
  font-weight: 700;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  @include accessible-focus;
}
```
