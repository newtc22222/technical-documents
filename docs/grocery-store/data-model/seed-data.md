---
id: seed-data
title: "Seed Dataset Matrix"
sidebar_label: "Seed Dataset"
sidebar_position: 4
description: "Seed Dataset — Grocery Store POS & Tax Application."
---
# Seed Dataset Matrix

The application includes an automated database seeder (`backend/cmd/seed` / `make seed`) that populates `salesdb` with realistic sample data for local development, automated testing, and store demonstrations.

---

## 1. System Users & Seeded Credentials

All passwords are encrypted with bcrypt (cost factor 12).

| Username | Plaintext Password | Role | Full Name | Description & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| `owner` | `Owner@123` | `owner` | Nguyễn Văn An | Full management access: catalog CRUD, POS cashiering, inventory receipts, monthly reports, tax export. |
| `cashier` | `Cashier@123` | `cashier` | Trần Thị Bình | Operational cashier access: POS transactions, customer checkouts, inventory stock checks. |
| `viewer` | `Viewer@123` | `viewer` | Lê Văn Cường | Read-only analytics access: daily & monthly sales metrics, tax summaries. |

---

## 2. Product Categories (`categories`)

| Category Name (Vi) | Category Slug | Sort Order | Default Tax Profile |
| :--- | :--- | :--- | :--- |
| **Văn phòng phẩm** (Stationery) | `van-phong-pham` | 1 | VAT 8% (Reduced Rate) |
| **Mỹ phẩm & Chăm sóc cá nhân** (Cosmetics) | `my-pham` | 2 | VAT 8% (Reduced Rate) |
| **Thực phẩm tươi** (Fresh Food) | `thuc-pham-tuoi` | 3 | VAT 0% (Tax Exempt) |
| **Đồ ăn vặt & Đóng gói** (Snacks & Packaged Food) | `do-an-vat` | 4 | VAT 8% (Reduced Rate) |

---

## 3. Tax Categories (`tax_categories`)

| Tax Category Name | VAT Rate | PIT Rate | Effective From | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **VAT 0% - Hàng tươi sống** | `0.00%` | `1.00%` | `2025-01-01` | Miễn thuế GTGT hàng nông, thủy, hải sản chưa qua chế biến. |
| **VAT 8% - Hàng tiêu dùng giảm thuế** | `8.00%` | `1.00%` | `2025-01-01` | Nghị định 72/2024/NĐ-CP giảm 2% thuế GTGT cho nhóm hàng hóa bán lẻ thông thường. |

---

## 4. Master Products Catalog (21 Seeded Items)

### 4.1 Fresh Food (`thuc-pham-tuoi` — VAT 0%)
Items sold primarily by weight (kg) with decimal support down to grams.

| SKU | Product Name | Base Unit | Retail Price / kg | Expiry Window |
| :--- | :--- | :--- | :--- | :--- |
| `TP-001` | Thịt bò Úc tươi | `kg` | 250,000 đ | 3 – 5 ngày (🚨 Cận date) |
| `TP-002` | Thịt ba chỉ heo sạch | `kg` | 140,000 đ | 4 – 6 ngày (🚨 Cận date) |
| `TP-003` | Cá hồi phi lê Na Uy | `kg` | 420,000 đ | 2 – 4 ngày (🚨 Cận date) |
| `TP-004` | Tôm sú tươi sống | `kg` | 310,000 đ | 1 – 3 ngày (🚨 Cận date) |
| `TP-005` | Rau muống sạch VietGAP | `kg` | 15,000 đ | 2 – 3 ngày (🚨 Cận date) |

### 4.2 Stationery (`van-phong-pham` — VAT 8%)
Items with multi-unit packaging options (piece vs box vs carton).

| SKU | Product Name | Units & Multipliers | Retail Price | Wholesale Price (Min Qty) |
| :--- | :--- | :--- | :--- | :--- |
| `VPP-001` | Bút bi Thiên Long TL-027 | • Cây (Base, 1×)<br/>• Hộp (20×) | • 5,000 đ / cây<br/>• 90,000 đ / hộp | 85,000 đ / hộp (≥ 5 hộp) |
| `VPP-002` | Tập học sinh 96 trang Vĩnh Tiến | • Cuốn (Base, 1×)<br/>• Lốc (10×) | • 8,500 đ / cuốn<br/>• 80,000 đ / lốc | 75,000 đ / lốc (≥ 10 lốc) |
| `VPP-003` | Bút xóa nước Thiên Long | • Cây (Base, 1×) | • 18,000 đ / cây | — |
| `VPP-004` | Bìa còng 7cm Kokuyo | • Cái (Base, 1×) | • 45,000 đ / cái | 40,000 đ / cái (≥ 10 cái) |
| `VPP-005` | Giấy in A4 Double A 70gsm | • Ram (Base, 1×)<br/>• Thùng (5×) | • 72,000 đ / ram<br/>• 350,000 đ / thùng | 340,000 đ / thùng (≥ 5 thùng) |

### 4.3 Cosmetics & Personal Care (`my-pham` — VAT 8%)

| SKU | Product Name | Base Unit | Retail Price | Expiry Alert Status |
| :--- | :--- | :--- | :--- | :--- |
| `MP-001` | Dầu gội Sunsilk Óng mượt 650g | `chai` | 135,000 đ | > 180 ngày (An toàn) |
| `MP-002` | Sữa tắm Lifebuoy Bảo vệ 850g | `chai` | 165,000 đ | > 180 ngày (An toàn) |
| `MP-003` | Kem đánh răng Colgate Total 180g | `tuýp` | 38,000 đ | > 90 ngày (An toàn) |
| `MP-004` | Xà bông cục Lifebuoy 90g | `cục` | 14,000 đ | > 120 ngày (An toàn) |
| `MP-005` | Nước rửa tay Lifebuoy 500ml | `chai` | 78,000 đ | > 150 ngày (An toàn) |

### 4.4 Snacks & Packaged Food (`do-an-vat` — VAT 8%)

| SKU | Product Name | Units & Multipliers | Retail Price | Wholesale Price (Min Qty) |
| :--- | :--- | :--- | :--- | :--- |
| `DAV-001` | Mì Hảo Hảo tôm chua cay 75g | • Gói (Base, 1×)<br/>• Thùng (30×) | • 4,500 đ / gói<br/>• 125,000 đ / thùng | 120,000 đ / thùng (≥ 5 thùng) |
| `DAV-002` | Sữa tươi tiệt trùng Vinamilk 1L | • Hộp (Base, 1×)<br/>• Thùng (12×) | • 32,000 đ / hộp<br/>• 370,000 đ / thùng | 360,000 đ / thùng (≥ 3 thùng) |
| `DAV-003` | Snack khoai tây Lay's Natural 56g | • Gói (Base, 1×) | • 12,000 đ / gói | — |
| `DAV-004` | Nước ngọt Coca-Cola 320ml | • Lon (Base, 1×)<br/>• Lốc (6×)<br/>• Thùng (24×) | • 10,000 đ / lon<br/>• 58,000 đ / lốc<br/>• 225,000 đ / thùng | 215,000 đ / thùng (≥ 3 thùng) |
| `DAV-005` | Bánh ChocoPie Orion hộp 12 cái | • Hộp (Base, 1×) | • 54,000 đ / hộp | 50,000 đ / hộp (≥ 5 hộp) |
| `DAV-006` | Nước khoáng Lavie 500ml | • Chai (Base, 1×)<br/>• Thùng (24×) | • 5,500 đ / chai<br/>• 105,000 đ / thùng | 98,000 đ / thùng (≥ 5 thùng) |

---

## 5. Seeded Customer Profiles (`customers`)

| Customer Name | Phone | Address | Is Wholesale | Debt Balance |
| :--- | :--- | :--- | :--- | :--- |
| **Đại lý Tạp hóa Hoàng Mai** | `0903123456` | 142 Lê Lợi, P. Bến Thành, Q.1, TP.HCM | `true` | 5,400,000 đ |
| **Cửa hàng Bánh mì & Nước giải khát Cô Ba** | `0987654321` | 55 Nguyễn Huệ, Q.1, TP.HCM | `true` | 1,250,000 đ |
| **Chị Lan (Khách mua lẻ thân thiết)** | `0918889900` | Căn hộ 402, Chung cư Sunrise, Q.7, TP.HCM | `false` | 0 đ |
