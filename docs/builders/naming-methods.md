# Quy tắc đặt tên phương thức cho Controller, Service, và Repository

Việc áp dụng một quy tắc đặt tên nhất quán trên toàn bộ dự án giúp giảm thiểu sự nhầm lẫn, tăng tốc độ phát triển và làm cho mã nguồn trở nên chuyên nghiệp hơn. Dưới đây là các quy tắc được khuyến nghị cho từng lớp trong kiến trúc Spring Boot.

## 1. Lớp Repository (Lớp truy cập dữ liệu)

Lớp này chỉ có một nhiệm vụ: tương tác với cơ sở dữ liệu. Tên phương thức phải phản ánh rõ ràng hành động truy vấn dữ liệu.

### 1.1. Quy tắc

- **Tuân thủ quy ước của Spring Data JPA**: Tận dụng tối đa khả năng tự tạo truy vấn từ tên phương thức.
- Bắt đầu bằng các tiền tố:
  - `find...`, `read...`, `query...`, `get...` để truy vấn dữ liệu.
  - `count...` để đếm số lượng bản ghi.
  - `exists...` để kiểm tra sự tồn tại.
  - `delete...` hoặc `remove...` để xóa dữ liệu.
- Sử dụng `By` để ngăn cách các điều kiện truy vấn.

### 1.2. Ví dụ

| Mục đích                          | Tên phương thức                                       |
| --------------------------------- | ----------------------------------------------------- |
| Tìm một sản phẩm bằng ID          | `Optional<Product> findById(Long id);`                |
| Tìm một sản phẩm bằng tên         | `Optional<Product> findByName(String name);`          |
| Lấy tất cả sản phẩm theo danh mục | `List<Product> findAllByCategory(Category category);` |
| Đếm số sản phẩm trong kho         | `long countByStockGreaterThan(int quantity);`         |
| Kiểm tra email đã tồn tại chưa    | `boolean existsByEmail(String email);`                |
| Xóa tất cả sản phẩm hết hàng      | `void deleteByIsAvailableFalse();`                    |

## 2. Lớp Service (Lớp nghiệp vụ)

Đây là nơi chứa logic nghiệp vụ. Tên phương thức phải mô tả hành động hoặc quy trình nghiệp vụ mà nó thực hiện, không phải là một hành động CRUD đơn thuần.

### 2.1. Quy tắc

- Sử dụng **động từ mạnh mẽ**, mang tính nghiệp vụ: Tên phương thức nên trả lời câu hỏi "Phương thức này làm gì cho doanh nghiệp?".
- **Tránh các tên CRUD chung chung**: Thay vì `saveUser`, hãy dùng `registerNewUser` hoặc `updateUserProfile`. Thay vì `getOrder`, hãy dùng `getOrderDetail` hoặc `getPurchaseHistory`.
- Bao gồm cả **đối tượng và hành động**: (Động từ) + (Đối tượng/Ngữ cảnh).
- Tên phương thức nên rõ ràng đến mức người không phải lập trình viên cũng có thể hiểu được mục đích của nó.

### 2.2. Ví dụ

| Mục đích                            | Tên phương thức                                                   |
| ----------------------------------- | ----------------------------------------------------------------- |
| Đăng ký một người dùng mới          | `UserDTO registerNewUser(SignUpRequest request);`                 |
| Xử lý một đơn hàng mới              | `OrderDTO processNewOrder(CreateOrderRequest request);`           |
| Áp dụng mã giảm giá vào giỏ hàng    | `CartDTO applyVoucherToCart(String voucherCode, Long cartId);`    |
| Hủy một đơn hàng                    | `void cancelOrder(Long orderId);`                                 |
| Lấy lịch sử mua hàng của người dùng | `List<OrderSummaryDTO> getPurchaseHistory(Long userId);`          |
| Tạo báo cáo doanh thu hàng tháng    | `MonthlySalesReport generateMonthlySalesReport(YearMonth month);` |

## 3. Lớp Controller (Lớp giao tiếp)

Lớp này xử lý các yêu cầu HTTP. Tên phương thức nên phản ánh hành động của API và tài nguyên mà nó tác động, tuân thủ các nguyên tắc RESTful.

### 3.1. Quy tắc

- Gắn liền với các **động từ HTTP**:
  - **GET**: `get...`, `find...`, `list...`, `search...`
  - **POST**: `create...`, `add...`, `register...`
  - **PUT / PATCH**: `update...`, `modify...`, `change...`
  - **DELETE**: `delete...`, `remove...`
- Bao gồm **tên của tài nguyên**: (Hành động) + (Tên tài nguyên).
- Tên phương thức nên **đơn giản và trực tiếp**, vì ngữ cảnh đã được cung cấp bởi annotation (`@GetMapping`, `@PostMapping`...) và URL.

### 3.2. Ví dụ

| HTTP Method & URL            | Tên phương thức                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| GET     `/api/products/{id}` | `public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id)`                                           |
| GET     `/api/products`      | `public ResponseEntity<List<ProductDTO>> getAllProducts()`                                                          |
| POST    `/api/products`      | `public ResponseEntity<ProductDTO> createProduct(@RequestBody CreateProductRequest request)`                        |
| PUT     `/api/products/{id}` | `public ResponseEntity<ProductDTO> updateProduct(@PathVariable Long id, @RequestBody UpdateProductRequest request)` |
| DELETE  `/api/products/{id}` | `public ResponseEntity<Void> deleteProduct(@PathVariable Long id)`                                                  |
| POST    `/api/auth/register` | `public ResponseEntity<?> registerUser(@RequestBody SignUpRequest request)`                                         |

## Bảng tổng hợp: Luồng hoạt động CRUD cho "Product"

| Lớp            | Tên phương thức (Ví dụ)  | Trách nhiệm                                                              |
| -------------- | ------------------------ | ------------------------------------------------------------------------ |
| **Controller** | `createProduct(...)`     | Nhận HTTP Request, xác thực DTO, gọi Service.                            |
| **Service**    | `addNewProduct(...)`     | Xử lý logic nghiệp vụ (kiểm tra tên trùng, tạo slug...), gọi Repository. |
| **Repository** | `save(Product product)`  | Lưu đối tượng Product vào cơ sở dữ liệu.                                 |
| **Controller** | `getProductById(...)`    | Nhận HTTP Request, gọi Service.                                          |
| **Service**    | `getProductDetails(...)` | Lấy dữ liệu từ Repository, xử lý (nếu cần), map sang DTO.                |
| **Repository** | `findById(Long id)`      | Tìm Product trong cơ sở dữ liệu bằng ID.                                 |

Việc tuân thủ các quy tắc này sẽ giúp kiến trúc ứng dụng của bạn trở nên **rõ ràng**, **dễ bảo trì** và **phát triển** sau này.
