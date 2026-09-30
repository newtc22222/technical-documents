---
title: Quality Assurance
sidebar_label: Quality Assurance
sidebar_position: 6
---

## Testing the Laptech API
As a modular monolith with both synchronous and asynchronous operations, testing Laptech requires checking both API endpoints and background event processing.

## API Documentation (Swagger)
Each individual service hosts its own OpenAPI/Swagger UI. The Gateway aggregates these APIs.
When services are running locally, you can access the interactive docs at:
* **API Gateway**: `http://localhost:8080/swagger-ui.html`
* **Identity**: `http://localhost:8081/swagger-ui.html`
* **Catalog**: `http://localhost:8092/swagger-ui.html`
* **Inventory**: `http://localhost:8083/swagger-ui.html`
* **Order**: `http://localhost:8084/swagger-ui.html`
* **Payment**: `http://localhost:8085/swagger-ui.html`
* **Promotion**: `http://localhost:8086/swagger-ui.html`
* **Content**: `http://localhost:8087/swagger-ui.html`

## Testing Strategies

### 1. Synchronous Endpoint Testing
Test standard REST operations (CRUD). E.g., Use the Catalog API to create a product, then fetch it to ensure it was saved.
**Important:** Most endpoints require a JWT. First, use the Identity service to authenticate and obtain a token, then pass it as a `Bearer` token in the `Authorization` header for subsequent requests.

### 2. Asynchronous Event Testing (Integration)
Because the system is distributed, a single user action may span multiple services.
**Example Scenario: Order Placement**
1. Send a POST request to the Order service to create an order.
2. **Verify**: Order status is `PENDING`.
3. **Verify**: Check the Inventory service database/API to ensure the required product quantity is temporarily reserved.
4. Send a POST request to the Payment service to simulate payment success.
5. **Verify**: The Order service eventually updates the order status to `PAID` (via RabbitMQ event).
6. **Verify**: The Inventory service permanently deducts the stock.

### 3. Edge Cases to Focus On
* **Concurrency**: Multiple users attempting to purchase the last item in stock.
* **Network Failures**: Simulating what happens if the Payment service cannot reach an external provider.
* **Role/Permission Validation**: Attempting administrative actions (e.g., deleting a category) with a standard user's JWT.
