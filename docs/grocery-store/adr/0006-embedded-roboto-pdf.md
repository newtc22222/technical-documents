---
id: 0006-embedded-roboto-pdf
title: "ADR 0006: Native Vietnamese PDF Invoices with Roboto TTF"
sidebar_label: "0006: Embedded Roboto TTF"
sidebar_position: 7
description: "0006: Embedded Roboto TTF — Grocery Store POS & Tax Application."
---
# ADR 0006: Native Vietnamese PDF Invoices with Roboto TTF

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Backend Order Agent, Technical Orchestrator

---

## Context
Sales receipts and VAT invoices in Vietnam must render authentic Vietnamese diacritics ("HÓA ĐƠN BÁN HÀNG", "Đơn giá", "Thành tiền", "Nguyễn Văn An"). Standard PDF generation libraries often default to Western European ASCII fonts (Helvetica, Times-Roman, Courier), resulting in dropped vowel diacritics, garbled characters, or unreadable question marks (`???`). Installing system fonts inside container images creates host environment dependencies and bloat.

## Decision
We embed Google's TrueType fonts (**`Roboto-Regular.ttf`** and **`Roboto-Bold.ttf`**) directly into the Go backend binary using Go 1.16+ `//go:embed` directives inside `backend/internal/invoice`:

```go
//go:embed Roboto-Regular.ttf
var robotoRegular []byte

//go:embed Roboto-Bold.ttf
var robotoBold []byte
```

During initialization of the Maroto PDF builder, we register these fonts via `m.AddUTF8FontFromBytes("Roboto", ...)` and mark Roboto as the default document typography.

## Consequences

### Positive
- Produces authentic, high-fidelity native UTF-8 Vietnamese PDF invoices with full diacritical support.
- Fully portable: zero external system font dependencies, zero Alpine Linux font package bloat (`font-noto`, etc.).
- Generated invoices are lightweight (~24 KB) and load instantly in modern browser PDF viewers and thermal printer spoolers.

### Negative / Tradeoffs
- Embeds ~1 MB of font asset binary data into the compiled Go binary.
