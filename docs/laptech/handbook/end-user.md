---
title: End User
sidebar_label: End User
sidebar_position: 7
---

## Welcome to Laptech!
Laptech is a modern, fast, and secure E-commerce platform. This document outlines how client applications (Web, Mobile) and end users interact with the system.

## Getting Started: Authentication
To use protected features of the platform, you must first register and log in.
1. **Register**: Send your details to the Identity service's registration endpoint.
2. **Login**: Authenticate with your username and password. The server will return a **JSON Web Token (JWT)**.
3. **Using the Token**: For all subsequent API requests that require authentication (like viewing your cart or placing an order), include this token in the HTTP headers:
   `Authorization: Bearer <your_jwt_here>`

## Core User Flows

### Browsing the Catalog
Users can browse products, categories, and brands with combinable search, price range, brand, category, and tag filters, or use the storefront's **Shop by Need / Laptop Finder** and side-by-side **Compare** tool.

### Shopping Cart
* Guests can add products to a local cart (`laptech_cart`), which automatically merges with their server cart upon signing in.
* Totals are calculated from the snapshotted cart unit prices (vouchers and shipping fee calculations are planned for a future release).

### Checkout & Payment
1. **Place Order**: Submit your cart (`POST /api/orders`). Checkout verifies that catalog prices still match your cart prices before creating the order.
2. **Payment**: Supports `COD` today, with live `VNPay` and `Stripe` redirect/callback flows scheduled for Phase 2 of the roadmap.
3. **Confirmation**: Track order status updates from your account or the admin workbench.

### Reviews & Feedback
After receiving a product, you can use the Content service to leave ratings and written reviews, which helps other users make informed decisions.

## Access Levels
Your account has specific roles. A standard user can manage their own profile and orders. Administrator roles have access to back-office endpoints to manage the catalog, view platform-wide orders, and configure promotions.
