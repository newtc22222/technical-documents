---
id: localization-i18n
title: "Vietnamese Localization & Formatting Standards"
sidebar_label: "Vietnamese Localization"
sidebar_position: 4
description: "Vietnamese Localization — Grocery Store POS & Tax Application."
---
# Vietnamese Localization & Formatting Standards

The application is localized 100% in Vietnamese (`vi-VN`) to serve domestic shopkeepers, cashiers, and tax authorities without awkward machine translation or missing diacritical marks.

---

## 1. Terminology Glossary

| English Retail Concept | Vietnamese Standard | Application Usage |
| :--- | :--- | :--- |
| Point-of-Sale / Sell | **Bán hàng** | Primary tab navigation, sell screen header |
| Inventory / Warehouse | **Kho hàng** | Secondary tab navigation, stock catalog |
| Financial Reports | **Báo cáo** | Analytics tab, revenue dashboards |
| Cashier | **Thu ngân** | User profile label, invoice operator stamp |
| Store Owner | **Chủ tiệm** | Administrative role label |
| Shopping Cart | **Giỏ hàng** | POS cart panel |
| Checkout / Pay | **Thanh toán** | Primary 96px action button |
| Cancel Order | **Hủy đơn** | Danger 96px action button |
| Subtotal | **Tiền hàng / Tạm tính** | Pre-tax sum display |
| Value-Added Tax (VAT) | **Thuế giá trị gia tăng (GTGT)** | Tax badges, invoice breakdown, tax reports |
| Personal Income Tax (PIT) | **Thuế thu nhập cá nhân (TNCN)** | Household presumptive 1% tax calculation |
| Grand Total | **Tổng cộng / Khách phải trả** | Final checkout total |
| Cash Rounding | **Làm tròn tiền mặt** | Rounding indicator on invoice |
| Base Unit | **Đơn vị cơ bản** | Inventory definition |
| Expiry Date | **Hạn sử dụng (HSD)** | Batch tracking table |
| Lot / Batch Number | **Số lô** | Inward inventory records |

---

## 2. Currency & Number Formatting

In Vietnam, numbers use a **dot (`.`) as the thousand separator** and a **comma (`,`) as the decimal separator**:

- **Currency Suffix:** `đ` or `VND` placed after the amount with a space:
  - Correct: `220.400 đ` or `250.000 VND`
  - Incorrect: `$220,400`
- **Weight Decimals:**
  - Correct: `0,7 kg` or `0.700 kg` (electronic scale)
  - Displayed in UI as: `0.7 kg` (or `0,7 kg` per locale pipe)

---

## 3. Date & Time Formats

All dates follow the standard Vietnamese day-first convention:
- **Display Date:** `DD/MM/YYYY` (e.g., `22/10/2026`)
- **Display Timestamp:** `DD/MM/YYYY HH:mm` (e.g., `22/10/2026 14:30`)
- **Invoice Timestamp:** `Ngày 22 tháng 10 năm 2026, 14:30:15`
- **Internal Database Storage:** ISO 8601 UTC (`TIMESTAMPTZ` / `2026-10-22T07:30:15Z`)

---

## 4. Native UTF-8 Diacritics in PDF Invoices

A common flaw in software deployed in Vietnam is "character dropped" or corrupted font rendering on PDF invoices when systems rely on basic Western ASCII fonts (e.g. `HãA ÄN BÃN HÃNG` instead of `HÓA ĐƠN BÁN HÀNG`).

The application resolves this permanently by embedding Google's **Roboto TrueType fonts (`Roboto-Regular.ttf` and `Roboto-Bold.ttf`)** directly into the Go binary via `//go:embed` and registering them inside Maroto (`AddUTF8FontFromBytes`). This ensures 100% authentic Vietnamese diacritical rendering across all printer drivers and PDF readers without any operating system font dependencies.
