# 📄 Consolidated Design Document

This document summarizes and categorizes the key architectural, database, and business-logic decisions made during the development of the Laptech E-commerce application.

---

## 1. 💾 Database Design & Analysis

### 1.1. Optimization of the Initial Database Design

| Aspect                     | Initial Weakness       | Optimization Strategy                                                                             | JPA Technique                                   |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Performance**            | Missing indexes        | Add indexes for common query columns (`product_name`, `category_id`).                             | Use `@Index` in Entity.                         |
| **Data Management**        | Lacked soft delete     | Add `is_deleted` (boolean) column.                                                                | `@Where(clause = "is_deleted = false")`.        |
| **Many-to-Many Relations** | Suboptimal join tables | Use `@ManyToMany` and enhanced join tables with extra metadata (`product_tags`, `user_vouchers`). | `@JoinTable` or `@EmbeddedId`.                  |
| **Technology**             | Raw database usage     | Migrate to **JPA** (Java Persistence API).                                                        | `@Entity`, `@Transactional`, `@GeneratedValue`. |

### 1.2. Complete Database Table List

Includes 17 core tables, grouped by domain:

* **User & Security**: `users`, `roles`, `addresses`
* **Product & Inventory**: `products`, `brands`, `categories` (supports parent–child), `inventories`, `tags`, `product_tags`
* **Orders & Transactions**: `orders`, `order_details`, `carts`, `cart_items`, `payments`, `shipments`
* **Promotion**: `vouchers`, `user_vouchers`

---

## 2. 🏗️ Architecture & Folder Structure (Spring Boot)

### 2.1. Recommended Folder Structure (Modular Monolith)

This modular structure separates business domains for better maintainability and scalability.

```txt
src/main/java/com/laptech/
├── common        // Shared utilities: BaseEntity, exception, security (JwtTokenProvider)
├── config        // System configurations (SwaggerConfig, HikariConfig)
├── module        // Individual business modules
│   ├── user      // (users, roles, addresses, auth)
│   ├── product   // (products, brands, categories, inventories, image)
│   ├── order     // (orders, order_details)
│   ├── payment   // (payments, PaymentProvider interface)
│   ├── shipment  // (shipments, ShipmentProvider interface)
│   └── cart      // (carts, cart_items)
└── Application.java
```

### 2.2. Handling Special Cases in Architecture

* **Many-to-Many relations**: Use join tables with `@ManyToMany` + `@JoinTable`.
* **Security**: Spring Security + JWT placed in `common.security`.
* **Payment/Shipment**: Apply **Strategy Pattern** (`PaymentProvider` interface) to support multiple vendors.

---

## 3. 🎯 Entity Design & JPA Best Practices

### 3.1. Base Entity & Audit Trail

* Define an abstract `BaseEntity` with:

  * `id` (`Long`, auto-generated)
  * `createdAt`, `updatedAt`
  * `isDeleted` (boolean, for soft delete)
* **Audit trail** fields (`created_by`, `updated_by`) are optional unless required.

### 3.2. Relationship Management

* **Category Hierarchy**: Use `@ManyToOne` on `Category` referencing its own `parent_id`.
* **Many-to-Many with extra fields**: Implement as a separate entity (e.g., `UserVoucher`) with composite key via `@EmbeddedId`.

### 3.3. Special Data Handling

* **SKU/Variants**: Store dynamic configuration as **JSON** in a `specifications` column.
* **Enum**: Place in `common.enums` and store using `@Enumerated(EnumType.STRING)`.

### 3.4. Lombok & DTO Best Practices

* Use Lombok (`@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`).

  * Avoid `@ToString` to prevent lazy-loading issues.
  * Manually override `equals()` and `hashCode()` to ensure valid entity comparison.
* Use **DTOs** or **Java Records** for immutable API responses.

---

## 4. ⚙️ Business Logic & Development Best Practices

### 4.1. Inventory Management & Transactions

* **Bulk product import**: Wrap operations in `@Transactional` to ensure integrity.
* **Inventory updates**: Use `@Transactional` + **Pessimistic Locking (`PESSIMISTIC_WRITE`)** to avoid race conditions during checkout.

### 4.2. Service & Controller Design Principles

* **Controller**: Handle requests, responses, and basic validation only.
* **Service**: Store all business logic, use `@Transactional` for transactional methods.
* **Mapper**: Use MapStruct to map DTO ↔ Entity cleanly.

### 4.3. Core Business Logic

* **Order integrity**: Save **product snapshots** (name, price) in `OrderDetail` to avoid price drift.
* **Voucher handling**:

  * Store applied voucher info in `order_details`.
  * Use comparison strategies to find the optimal discount.
* **Slug generation**: Use `unidecode` to convert Vietnamese diacritics to URL-friendly strings.

---

## 5. 🧪 Testing

### 5.1. Tools & Strategies

* **Tools**: JUnit 5, Mockito, Spring Boot Test
* **Strategy**:

  * **Repository**: Skip unit tests (rely on Spring Data JPA)
  * **Unit Tests**: Focus on service logic and shared utilities
  * **Integration Tests**: Use `@SpringBootTest` for end-to-end flows like `ProductController`

### 5.2. Common Test Errors & Fixes

| Common Error                               | Fix                                                  |
| ------------------------------------------ | ---------------------------------------------------- |
| **ServletWebServerFactory bean not found** | Add `@SpringBootTest(webEnvironment = RANDOM_PORT)`. |
| **ProductService bean not found**          | Use `@MockBean ProductService`.                      |
| **jpaMappingContext bean not found**       | Ensure `@EnableJpaAuditing` is configured.           |

---

## 6. 🔗 Integrations & Environments

* **Database Configuration**: Use HikariCP for connection pooling (`maximum-pool-size: 10`, `minimum-idle: 5`).
* **OpenAPI/Swagger UI**: Add OpenAPI 3.x dependency for automatic API docs.
* **Sample Data**: Use `@PostConstruct` or SQL scripts for initialization.
* **JPA Errors**: Set `spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect`.

---

## 7. 🚀 Transition to Microservices (Future Plan)

### 7.1. Domain Breakdown

Split application into independent microservices:

* User Service
* Product Service
* Order Service
* Payment Service
* Shipment Service
* Cart Service

### 7.2. Communication & Data Design

* **Communication**: Use **REST API** or **gRPC** between services.
* **API Gateway**: Implement **Spring Cloud Gateway**.
* **Data Architecture**:

  * Adopt **Database per Service**.
  * Use **Kafka/RabbitMQ** for event-driven communication (Event Sourcing/CQRS).
* **Deployment**: Manage via **Docker** and **Kubernetes**.
