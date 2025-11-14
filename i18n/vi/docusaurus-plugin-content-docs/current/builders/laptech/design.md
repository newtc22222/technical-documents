# Tài liệu Tổng hợp Thiết kế Ứng dụng

Tài liệu này tổng hợp và phân loại các quyết định chính về thiết kế kiến trúc, cơ sở dữ liệu và nghiệp vụ đã được thảo luận trong quá trình xây dựng ứng dụng E-commerce Laptech.

-----

## 1. Thiết kế & Phân tích Cơ sở Dữ liệu (CSDL)

### 1.1. Tối ưu hóa Thiết kế CSDL Ban đầu

| Khía Cạnh | Điểm Yếu Ban Đầu | Chiến Lược Tối Ưu Hóa | Kỹ Thuật JPA |
| :--- | :--- | :--- | :--- |
| **Hiệu suất** | Thiếu chỉ mục (index) | Thêm chỉ mục cho các cột truy vấn phổ biến (`product_name`, `category_id`). | Sử dụng `@Index` trong Entity. |
| **Quản lý dữ liệu** | Thiếu xóa mềm (soft delete). | Thêm cột `is_deleted` (boolean). | `@Where(clause = "is_deleted = false")`. |
| **Quan hệ N-N** | Chưa tối ưu bảng trung gian. | Tận dụng `@ManyToMany` và tạo bảng trung gian có thông tin phụ (`product_tags`, `user_vouchers`). | Sử dụng `@JoinTable` hoặc `@EmbeddedId`. |
| **Công nghệ** | CSDL thuần. | Chuyển đổi sang sử dụng **JPA** (Java Persistence API). | `@Entity`, `@Transactional`, `@GeneratedValue`. |

### 1.2. Danh sách Bảng CSDL Hoàn chỉnh

Bao gồm 17 bảng chính, được phân loại theo chức năng:

* **Người dùng & Bảo mật**: `users`, `roles`, `addresses`.
* **Sản phẩm & Kho**: `products`, `brands`, `categories` (hỗ trợ cha-con), `inventories`, `tags`, `product_tags`.
* **Đơn hàng & Giao dịch**: `orders`, `order_details`, `carts`, `cart_items`, `payments`, `shipments`.
* **Khuyến mãi**: `vouchers`, `user_vouchers`.

-----

## 2. Kiến trúc & Cấu trúc Thư mục (Spring Boot)

### 2.1. Cấu trúc Thư mục Đề xuất (Modular Monolith)

Áp dụng cấu trúc module hóa để tách biệt các miền nghiệp vụ, tăng tính bảo trì và mở rộng.

```txt
src/main/java/com/laptech/
├── common     // Tiện ích chung: BaseEntity, exception, security (JwtTokenProvider)
├── config     // Cấu hình hệ thống (SwaggerConfig, HikariConfig)
├── module     // Các Module nghiệp vụ riêng biệt
│   ├── user     // (users, roles, addresses, auth)
│   ├── product // (products, brands, categories, inventories, image)
│   ├── order   // (orders, order_details)
│   ├── payment // (payments, PaymentProvider interface)
│   ├── shipment// (shipments, ShipmentProvider interface)
│   └── cart    // (carts, cart_items)
└── Application.java
```

### 2.2. Xử lý Các Trường hợp Đặc biệt trong Kiến trúc

* **Quan hệ N-N**: Sử dụng bảng trung gian, ánh xạ bằng `@ManyToMany` với `@JoinTable`.
* **Bảo mật**: Spring Security và JWT được đặt trong `common.security`.
* **Payment/Shipment**: Sử dụng **Strategy Pattern** (ví dụ: `PaymentProvider` interface) để dễ dàng hỗ trợ nhiều nhà cung cấp.

-----

## 3. Thiết kế Entity & Best Practice JPA

### 3.1. Base Entity và Audit Trail

* Định nghĩa `BaseEntity` (abstract class) chứa các trường cơ bản:
  * `id` (`Long`, `@Id`, `@GeneratedValue(strategy = GenerationType.IDENTITY)`).
  * `createdAt`, `updatedAt` (`LocalDateTime`).
  * `isDeleted` (`boolean`) cho **Xóa mềm**.
* **Audit Trail**: Không bắt buộc thêm `created_by`, `updated_by` trừ khi có yêu cầu theo dõi chi tiết.

### 3.2. Quản lý Quan hệ

* **Danh mục Cha-Con**: Sử dụng `@ManyToOne` trên chính Entity `Category` để trỏ về `parent_id` của nó.
* **N-N (Có thông tin phụ)**: Sử dụng Entity trung gian (`UserVoucher`) với khóa tổng hợp (`@EmbeddedId`).

### 3.3. Xử lý Dữ liệu Đặc biệt

* **SKU/Biến thể**: Thay vì ánh xạ trực tiếp, lưu thông tin cấu hình dưới dạng **JSON** trong cột `specifications` (sử dụng `columnDefinition = "JSON"`).
* **Enum**: Đặt các Enum (`OrderStatus`) trong `common.enums`, sử dụng `@Enumerated(EnumType.STRING)` để lưu chuỗi trong CSDL.

### 3.4. Best Practice Lombok & DTO

* **Lombok**: Sử dụng `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor` cho Entity.
  * **Lưu ý**: Cần **tránh** `@ToString` để ngăn tải lazy-loaded relationships không cần thiết, và **ghi đè** thủ công `equals()`/`hashCode()` để đảm bảo so sánh Entity chính xác.
* **DTO**: Sử dụng DTO (Data Transfer Object) và **Java Record** (nếu dùng Java 16+) để đảm bảo tính **Immutable** (bất biến) và tách biệt Entity khỏi API response.

-----

## 4. Logic Nghiệp vụ & Best Practice Lập trình

### 4.1. Quản lý Tồn kho và Giao dịch

* **Import sản phẩm hàng loạt**: Phải sử dụng `@Transactional` để đảm bảo toàn vẹn dữ liệu trong quá trình đọc/ghi file.
* **Quản lý Tồn kho**: Bắt buộc sử dụng `@Transactional` kết hợp với **Khóa Bi Quan** (`PESSIMISTIC_WRITE`) để ngăn chặn **Race Condition** khi nhiều người dùng cùng mua một sản phẩm.

### 4.2. Nguyên tắc Thiết kế Service & Controller

* **Controller**: Chỉ xử lý HTTP request/response, validation cơ bản.
* **Service**: Chứa toàn bộ **Logic Nghiệp vụ** phức tạp và áp dụng `@Transactional` cho các phương thức cần giao dịch.
* **Mapper (MapStruct)**: Sử dụng MapStruct (`@Mapper(componentModel = "spring")`) để chuyển đổi DTO sang Entity và ngược lại, giảm boilerplate code.

### 4.3. Các Logic Nghiệp vụ Quan trọng

* **Toàn vẹn Đơn hàng**: Khi tạo đơn hàng, cần **lưu snapshot** (giá, tên) của sản phẩm vào `OrderDetail` để đảm bảo đơn hàng không bị ảnh hưởng nếu giá sản phẩm thay đổi sau này.
* **Xử lý Voucher**:
  * Lưu thông tin voucher áp dụng trong `order_details`.
  * Sử dụng thuật toán so sánh để tính toán và áp dụng giảm giá tối ưu.
* **Generate Slug**: Sử dụng thư viện `unidecode` để chuyển tiếng Việt có dấu thành chuỗi không dấu, thân thiện với URL.

-----

## 5. Kiểm thử (Testing)

### 5.1. Công cụ và Chiến lược

* **Công cụ**: JUnit 5, Mockito, Spring Boot Test.
* **Chiến lược**:
  * **Repository**: Không Unit Test (tin tưởng Spring Data JPA).
  * **Unit Test**: Dành cho `Service` (Logic nghiệp vụ), `common`, `config`, `utils` với Mockito.
  * **Integration Test**: Sử dụng `@SpringBootTest` cho các luồng nghiệp vụ lớn (ví dụ: `ProductController` end-to-end).

### 5.2. Khắc phục Lỗi Phổ biến khi Test

| Lỗi Thường Gặp | Giải Pháp |
| :--- | :--- |
| **ServletWebServerFactory bean not found** | Thêm `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)`. |
| **ProductService bean not found** | Sử dụng `@MockBean ProductService` trong class test. |
| **jpaMappingContext bean not found** | Đảm bảo `@EnableJpaAuditing` đã được cấu hình. |

-----

## 6. Tích hợp & Môi trường

* **Cấu hình CSDL**: Sử dụng HikariCP cho Connection Pooling.
  * **Cấu hình ví dụ**: `maximum-pool-size: 10`, `minimum-idle: 5`.
* **Tích hợp OpenAPI/Swagger UI**: Chỉ cần thêm dependency (OpenAPI 3.x) để tự động tạo tài liệu API.
* **Tạo dữ liệu mẫu**: Sử dụng `@PostConstruct` hoặc SQL scripts để nạp dữ liệu khởi tạo.
* **Khắc phục lỗi JPA**: Cấu hình `spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect` để đảm bảo tương thích SQL Dialect.

-----

## 7. Kế hoạch Chuyển đổi sang Microservices (Tương lai)

### 7.1. Phân tích Miền Nghiệp vụ

Tách ứng dụng thành các Microservices độc lập:

* `User Service`
* `Product Service`
* `Order Service`
* `Payment Service`
* `Shipment Service`
* `Cart Service`

### 7.2. Thiết kế Giao tiếp và Dữ liệu

* **Giao tiếp**: Sử dụng **REST API** hoặc **gRPC** giữa các service.
* **API Gateway**: Triển khai **Spring Cloud Gateway** để làm điểm truy cập duy nhất.
* **Quản lý Dữ liệu**: Áp dụng mô hình **Database per Service** (mỗi service CSDL riêng).
  * Sử dụng **Message Broker** (Kafka/RabbitMQ) để đồng bộ dữ liệu giữa các service (Event Sourcing/CQRS).
* **Triển khai**: Sử dụng **Docker** và **Kubernetes** để quản lý Container.
