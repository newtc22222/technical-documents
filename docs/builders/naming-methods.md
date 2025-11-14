# Method Naming Conventions for Controller, Service, and Repository

Applying consistent naming rules across your project reduces confusion, speeds up development, and makes your codebase more professional. Below are the recommended naming conventions for each layer in a Spring Boot architecture.

---

## 1. Repository Layer (Data Access Layer)

This layer has a single responsibility: interact with the database.
Method names must clearly reflect the data query action.

### 1.1. Rules

* **Follow Spring Data JPA naming conventions** to fully leverage auto-generated queries.
* Start method names with:

  * `find...`, `read...`, `query...`, `get...` → for retrieving data
  * `count...` → for counting records
  * `exists...` → for existence checks
  * `delete...` or `remove...` → for deletion operations
* Use `By` to separate query conditions.

### 1.2. Examples

| Purpose                              | Method Name                                           |
| ------------------------------------ | ----------------------------------------------------- |
| Find a product by ID                 | `Optional<Product> findById(Long id);`                |
| Find a product by name               | `Optional<Product> findByName(String name);`          |
| Get all products by category         | `List<Product> findAllByCategory(Category category);` |
| Count products with stock > quantity | `long countByStockGreaterThan(int quantity);`         |
| Check if an email already exists     | `boolean existsByEmail(String email);`                |
| Delete all unavailable products      | `void deleteByIsAvailableFalse();`                    |

---

## 2. Service Layer (Business Logic Layer)

This is where business rules live.
Method names should describe **what business action or workflow** they perform, not just basic CRUD behavior.

### 2.1. Rules

* Use **strong, business-oriented verbs**.
  The method should answer: *“What does this do for the business?”*
* **Avoid generic CRUD names**:

  * Instead of `saveUser` → use `registerNewUser` or `updateUserProfile`.
  * Instead of `getOrder` → use `getOrderDetail` or `getPurchaseHistory`.
* Combine **action + context/object**.
* Names should be clear enough that even a non-developer can roughly understand the intent.

### 2.2. Examples

| Purpose                           | Method Name                                                       |
| --------------------------------- | ----------------------------------------------------------------- |
| Register a new user               | `UserDTO registerNewUser(SignUpRequest request);`                 |
| Process a new order               | `OrderDTO processNewOrder(CreateOrderRequest request);`           |
| Apply voucher to cart             | `CartDTO applyVoucherToCart(String voucherCode, Long cartId);`    |
| Cancel an order                   | `void cancelOrder(Long orderId);`                                 |
| Get a user’s purchase history     | `List<OrderSummaryDTO> getPurchaseHistory(Long userId);`          |
| Generate a monthly revenue report | `MonthlySalesReport generateMonthlySalesReport(YearMonth month);` |

---

## 3. Controller Layer (API Layer)

This layer handles HTTP requests.
Method names should reflect the API action and the resource it affects, following RESTful conventions.

### 3.1. Rules

* Stick closely to **HTTP verbs**:

  * **GET**: `get...`, `find...`, `list...`, `search...`
  * **POST**: `create...`, `add...`, `register...`
  * **PUT / PATCH**: `update...`, `modify...`, `change...`
  * **DELETE**: `delete...`, `remove...`
* Include the **resource name**: (Action) + (Resource).
* Keep names **simple and direct**, because annotation + URL already provide context.

### 3.2. Examples

| HTTP Method & URL           | Method Name                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| GET `/api/products/{id}`    | `public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id)`                                           |
| GET `/api/products`         | `public ResponseEntity<List<ProductDTO>> getAllProducts()`                                                          |
| POST `/api/products`        | `public ResponseEntity<ProductDTO> createProduct(@RequestBody CreateProductRequest request)`                        |
| PUT `/api/products/{id}`    | `public ResponseEntity<ProductDTO> updateProduct(@PathVariable Long id, @RequestBody UpdateProductRequest request)` |
| DELETE `/api/products/{id}` | `public ResponseEntity<Void> deleteProduct(@PathVariable Long id)`                                                  |
| POST `/api/auth/register`   | `public ResponseEntity<?> registerUser(@RequestBody SignUpRequest request)`                                         |

---

## Summary Table: CRUD Workflow for “Product”

| Layer          | Method Example           | Responsibility                                                             |
| -------------- | ------------------------ | -------------------------------------------------------------------------- |
| **Controller** | `createProduct(...)`     | Receive HTTP request, validate DTO, call Service.                          |
| **Service**    | `addNewProduct(...)`     | Business logic (duplicate name checks, slug creation...), call Repository. |
| **Repository** | `save(Product product)`  | Persist the Product entity into the database.                              |
| **Controller** | `getProductById(...)`    | Receive HTTP Request, call Service.                                        |
| **Service**    | `getProductDetails(...)` | Fetch data, apply logic if needed, map to DTO.                             |
| **Repository** | `findById(Long id)`      | Query Product by ID.                                                       |
