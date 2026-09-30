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
Users can freely browse products, categories, and brands. The Catalog API is highly optimized (using Redis caching) to deliver lightning-fast search results and product details.

### Shopping Cart
* You can add products to your cart via the Order service.
* The system automatically calculates totals and applies any valid promotions or discounts that you qualify for.

### Checkout & Payment
1. **Place Order**: Submit your cart. The system will secure the items in inventory for a short period.
2. **Payment**: You will be provided with payment options (e.g., Credit Card, VNPay, Momo). Proceed with payment via the Payment service.
3. **Confirmation**: Once payment is successful, your order is finalized, and shipping is arranged.

### Reviews & Feedback
After receiving a product, you can use the Content service to leave ratings and written reviews, which helps other users make informed decisions.

## Access Levels
Your account has specific roles. A standard user can manage their own profile and orders. Administrator roles have access to back-office endpoints to manage the catalog, view platform-wide orders, and configure promotions.
