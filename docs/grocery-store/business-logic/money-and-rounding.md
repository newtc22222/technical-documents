---
id: money-and-rounding
title: "Money Math & Rounding Rules"
sidebar_label: "Money & Rounding Rules"
sidebar_position: 2
description: "Money & Rounding Rules — Grocery Store POS & Tax Application."
---
# Money Math & Rounding Rules

Financial applications in Vietnam deal with large integer currency amounts (e.g., hundreds of thousands or millions of Vietnamese Dong). Floating-point imprecision cannot be tolerated in commercial invoicing or tax settlement.

---

## 1. Zero `float64` Policy

Standard 64-bit binary floating-point types (IEEE-754) represent decimal numbers as binary fractions. This introduces well-known rounding artifacts (e.g., `0.1 + 0.2 = 0.30000000000000004`). In a high-volume retail POS:
- Floating-point calculations accumulate subtle rounding drift.
- Tax amounts on invoices differ by 1 Dong from the line sum.
- Ledger audits fail verification.

**The Golden Rule:** The codebase forbids the use of `float64` for any monetary computation. All money is modeled as an exact integer `int64` representing Vietnamese Dong.

---

## 2. Type Definition: `money.VND` (`backend/pkg/money/money.go`)

```go
package money

import (
    "github.com/shopspring/decimal"
)

// VND represents an amount in Vietnamese Dong.
// Hard rule: Never use float64 for money.
type VND int64

func (v VND) Int64() int64 {
    return int64(v)
}

func (v VND) Add(other VND) VND {
    return v + other
}

func (v VND) Sub(other VND) VND {
    return v - other
}

func (v VND) Mul(factor int64) VND {
    return v * VND(factor)
}

// MulByDecimal safely multiplies VND by an arbitrary decimal (weights, tax rates)
func (v VND) MulByDecimal(d decimal.Decimal) VND {
    decV := decimal.NewFromInt(int64(v))
    result := decV.Mul(d).Round(0)
    return VND(result.IntPart())
}
```

---

## 3. Cash Payment Rounding to Nearest 100 VND

In Vietnam, physical currency denominations below 1,000 VND (such as 100, 200, or 500 VND notes) are rarely circulated. To simplify cash transactions at the counter, the system applies standard commercial half-up rounding to the nearest **100 VND**:

### Rounding Algorithm (`money.Round`)
```go
func (v VND) Round(to int) VND {
    if to <= 1 {
        return v
    }
    step := int64(to)
    val := int64(v)

    neg := false
    if val < 0 {
        neg = true
        val = -val
    }

    rem := val % step
    half := step / 2

    if rem >= half {
        val = val - rem + step
    } else {
        val = val - rem
    }

    if neg {
        val = -val
    }
    return VND(val)
}
```

### Examples of 100 VND Rounding

| Pre-Round Total (VND) | Remainder (% 100) | Comparison (≥ 50) | Rounded Total (VND) | Note |
| :--- | :--- | :--- | :--- | :--- |
| `220,310` | 10 | < 50 (Round down) | **`220,300`** | Cashier waives 10 đ |
| `220,349` | 49 | < 50 (Round down) | **`220,300`** | Cashier waives 49 đ |
| `220,350` | 50 | ≥ 50 (Round up) | **`220,400`** | Halfway rounded up |
| `220,360` | 60 | ≥ 50 (Round up) | **`220,400`** | Mixed-tax checkout sample |
| `220,399` | 99 | ≥ 50 (Round up) | **`220,400`** | Rounded up |

---

## 4. Decimal Multiplications with Weights & Conversion Factors

When multiplying money by non-integer quantities (e.g., 0.7 kg of beef at 250,000 đ/kg):
1. Convert unit price `250000` to `decimal.Decimal`.
2. Multiply by weight `0.700`.
3. Round the product to 0 decimal places (`Round(0)`).
4. Cast safely back to `int64` / `money.VND`.

```go
weight := decimal.NewFromFloat(0.700)
unitPrice := money.VND(250000)
lineTotal := unitPrice.MulByDecimal(weight) // Result: 175,000 VND
```

This guarantees bit-exact accounting matches between the UI calculator, database records, and printed PDF invoices.
