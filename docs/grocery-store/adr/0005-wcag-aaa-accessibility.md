---
id: 0005-wcag-aaa-accessibility
title: "ADR 0005: Elderly-Friendly Accessibility (WCAG AAA)"
sidebar_label: "0005: WCAG AAA Accessibility"
sidebar_position: 6
description: "0005: WCAG AAA Accessibility — Grocery Store POS & Tax Application."
---
# ADR 0005: Elderly-Friendly Accessibility (WCAG AAA)

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Frontend Core Agent, Technical Orchestrator

---

## Context
A substantial portion of Vietnamese retail shop owners, grocery clerks, and family business operators are seniors with declining eyesight, reduced motor precision, and limited computer literacy. Traditional dense desktop POS applications feature small fonts (11–13px), subtle contrast ratios, crowded button matrices, and easy-to-trigger destructive actions, resulting in constant operator fatigue and checkout errors.

## Decision
We enforce the Web Content Accessibility Guidelines (**WCAG 2.1 Level AAA**) across the entire frontend architecture:
1. **Typography Hierarchy:** Minimum body text size ≥ 18px, inputs 18px, headers 24px-32px, and grand total displays 36px.
2. **Touch Sizing:** Interactive buttons have a minimum footprint of 48× 48px. The primary transactional buttons ("HỦY ĐƠN" and "THANH TOÁN") are rendered at an oversized **96px** height with bold 24px typography.
3. **Contrast Ratios:** Contrast between text/action elements and backgrounds must strictly exceed **7:1** (WCAG AAA), tested systematically with axe-core.
4. **Accidental Click Protection:** Cancelling an active order requires a 2-step confirmation dialog with default focus set to "KHÔNG, QUAY LẠI".
5. **Simplified Navigation:** Constrain primary top-level navigation to exactly 3 tabs: *Bán hàng*, *Kho hàng*, and *Báo cáo*.

## Consequences

### Positive
- Exceptional readability and ease of use on touchscreen tablets and desktop monitors alike.
- Drastic reduction in accidental order cancellations and mis-clicked items.
- Full compliance with international accessibility standards.

### Negative / Tradeoffs
- Screens display fewer catalog items per viewport row compared to traditional dense POS tables, requiring pagination or smooth category filtering.
