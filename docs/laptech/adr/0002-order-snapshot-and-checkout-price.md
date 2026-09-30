---
id: 0002-order-snapshot-and-checkout-price
title: "ADR-0002: Order address snapshot, frozen price, and checkout re-validation"
sidebar_label: "0002 Order price and address"
sidebar_position: 2
description: Checkout charges the add-to-cart price only when it still matches the catalog, and does not apply vouchers.
---

# ADR-0002: Order address snapshot, frozen price, and checkout re-validation

## Status

Accepted on 2026-09-30 by the Product Owner (GitLab `laptech/laptech-api#12`, T-030).

The address shape, the add-to-cart price freeze, and the rejection of an address book were already decided by the product owner and are recorded here. The voucher decision and the checkout price check are the T-030 decisions.

## Date

2026-09-30

## Deciders

- Product Owner, for GitLab `laptech/laptech-api#12`.
- Order maintainers for `laptech-order`.

## Context

`POST /api/orders` builds an order from the caller's server-side cart. `OrderAddress` is a required row (`street`, `ward`, `district`, `city`, receiver name, receiver phone). `Order.voucherId` and `Order.discountAmount` exist and are unused. `laptech-promotion` exposes `/api/vouchers` with no HTTP methods. Add-to-cart already calls catalog through `CatalogClient` and stores `unitPrice`, `productName`, and `productSku` on the cart line. Checkout used to copy that snapshot and never call catalog again, so a catalog price change between add and checkout was billed at the old price.

## Decision

1. **Address.** `OrderCreateRequest.shippingAddress` is a structured snapshot: `street`, `ward`, `district`, `city`, `receiverName`, `receiverPhone`. Checkout copies it onto an `OrderAddress` owned by that order. `userAddressId` stays null. There is no address book and no read of a saved identity address.
2. **Frozen price.** Add-to-cart stores the catalog unit price on the cart line. The client does not send a price. A later quantity change does not refresh that price.
3. **Checkout re-validation.** Creating an order re-reads each product from catalog before anything is saved. `BigDecimal.compareTo` decides equality, so scale differences such as `10.0` and `10.00` match. When the catalog price matches the cart price, the order line keeps that price and copies the current catalog name, sku, and `thumbnailUrl` (thumbnail may be null). When it does not match, checkout responds **409** with `errorCode` `PRICE_CHANGED` and the product id. The order is not inserted and the cart is not cleared or repriced. A missing product is **404**. An unreachable catalog or an empty price, name, or sku is **502**. The first failing line stops the checkout.
4. **No vouchers or discounts in this task.** Checkout does not call `laptech-promotion`. `voucherId` stays null. `discountAmount` is stored as zero and is not subtracted. `shippingFee` stays zero. The grand total is the sum of `unitPrice * quantity`. `POST /api/carts/recalculate` does not apply a voucher. Discounts remain on GitLab `laptech/laptech-api#24`.

## Consequences

- A price change after add-to-cart does not silently change the charge and does not bill the old price. The customer must add the product again, which stores the new catalog price, and then check out.
- Promotion, payment capture, inventory reservation, and the storefront checkout page are outside T-030.
- `OrderCreateRequest` does not grow a voucher field.

## Alternatives rejected

- Bill the frozen price even after the catalog price changes. That honors a stale quote and was the previous checkout behavior.
- Replace the cart price with the live catalog price during checkout. That undoes the add-to-cart freeze.
- Apply a voucher code in `laptech-order` while the promotion service has no API.
