# Tổng quan về Functional Interface trong Java

Functional Interface là một interface trong Java chỉ chứa **duy nhất một phương thức trừu tượng** (abstract method). Chúng là nền tảng cho việc sử dụng **Lambda Expressions** và **Method References**, giúp viết mã ngắn gọn và biểu cảm hơn.

Annotation `@FunctionalInterface` có thể được sử dụng để đánh dấu một interface là functional. Nó không bắt buộc, nhưng là một thói quen tốt vì trình biên dịch sẽ báo lỗi nếu bạn cố gắng thêm nhiều hơn một phương thức trừu tượng.

## Tại sao Functional Interface quan trọng?

- **Nền tảng cho Lambda Expressions**: Cho phép truyền các hành vi (behavior) như là các tham số cho phương thức.
- **Tích hợp với Stream API**: Hầu hết các phương thức trong Stream API (như `filter`, `map`, `forEach`) đều nhận các functional interface làm tham số.
- **Thúc đẩy lập trình hàm**: Giúp viết mã theo phong cách khai báo (declarative) thay vì mệnh lệnh (imperative), tập trung vào "cái gì" cần làm thay vì "làm như thế nào".

## Các Functional Interface phổ biến nhất

Java cung cấp sẵn một bộ các functional interface thông dụng trong gói `java.util.function`, giúp bạn không cần phải tự định nghĩa cho các trường hợp phổ biến.

### 1. `Predicate<T>`

- **Mục đích**: Kiểm tra một giá trị đầu vào có thỏa mãn một điều kiện nào đó hay không.
- **Phương thức trừu tượng**: `boolean test(T t)`
- **Mô tả**: Nhận vào một đối tượng kiểu `T` và trả về `true` hoặc `false`.
- **Ví dụ**:

  ```java
  Predicate<Integer> isGreaterThan10 = (number) -> number > 10;
  System.out.println(isGreaterThan10.test(5));   // false
  System.out.println(isGreaterThan10.test(20));  // true
  ```

### 2. `Consumer<T>`

- **Mục đích**: Thực hiện một hành động nào đó trên một giá trị đầu vào mà không trả về kết quả.
- **Phương thức trừu tượng**: `void accept(T t)`
- **Mô tả**: "Tiêu thụ" một đối tượng kiểu `T`. Thường được dùng để thực hiện các side effect như in ra màn hình, ghi vào file...
- **Ví dụ**:

  ```java
  Consumer<String> printMessage = (message) -> System.out.println(message);
  printMessage.accept("Hello, Functional Interface!"); // In ra chuỗi
  ```

### 3. `Function<T, R>`

- **Mục đích**: Chuyển đổi (transform) một giá trị đầu vào từ kiểu `T` sang một giá trị kết quả kiểu `R`.
- **Phương thức trừu tượng**: `R apply(T t)`
- **Mô tả**: Nhận vào một đối tượng kiểu `T` và trả về một đối tượng kiểu `R`.
- **Ví dụ**:

  ```java
  Function<String, Integer> getStringLength = (str) -> str.length();
  System.out.println(getStringLength.apply("Java")); // 4
  ```

### 4. `Supplier<T>`

- **Mục đích**: Cung cấp (supply) một giá trị mà không cần bất kỳ đầu vào nào.
- **Phương thức trừu tượng**: `T get()`
- **Mô tả**: Không nhận tham số nào và trả về một đối tượng kiểu `T`. Thường được dùng để tạo đối tượng mới hoặc cung cấp giá trị mặc định.
- **Ví dụ**:

  ```java
  Supplier<LocalDateTime> getCurrentDateTime = () -> LocalDateTime.now();
  System.out.println(getCurrentDateTime.get()); // In ra ngày giờ hiện tại
  ```

## Các biến thể hữu ích khác

Ngoài 4 interface chính ở trên, Java còn cung cấp nhiều biến thể để xử lý các trường hợp cụ thể hơn.

### `UnaryOperator<T>`

- **Mô tả**: Một trường hợp đặc biệt của `Function<T, T>`, nơi kiểu đầu vào và kiểu trả về giống nhau.
- **Phương thức**: `T apply(T t)`
- **Ví dụ**:

  ```java
  UnaryOperator<Integer> square = (number) -> number * number;
  System.out.println(square.apply(5)); // 25
  ```

### `BinaryOperator<T>`

- **Mô tả**: Nhận vào hai tham số cùng kiểu `T` và trả về một kết quả cũng có kiểu `T`. Hữu ích cho các phép toán gộp (reduction).
- **Phương thức**: `T apply(T t1, T t2)`
- **Ví dụ**:

  ```java
  BinaryOperator<Integer> sum = (a, b) -> a + b;
  System.out.println(sum.apply(10, 20)); // 30
  ```

### Các interface cho kiểu nguyên thủy

- Để tránh boxing/unboxing và tăng hiệu năng, Java cung cấp các phiên bản chuyên biệt cho các kiểu nguyên thủy như `IntPredicate`, `LongConsumer`, `DoubleFunction`, v.v.

## Bảng tổng kết thông tin

| Interface           | Phương thức trừu tượng | Mục đích                                  | Ví dụ ứng dụng                            |
| ------------------- | ---------------------- | ----------------------------------------- | ----------------------------------------- |
| `Predicate<T>`      | `boolean test(T t)`    | Kiểm tra điều kiện                        | Kiểm tra số > 10, lọc danh sách           |
| `Consumer<T>`       | `void accept(T t)`     | Thực hiện hành động, không trả về kết quả | In ra console, ghi vào file               |
| `Function<T, R>`    | `R apply(T t)`         | Chuyển đổi giá trị từ `T` sang `R`        | Tính độ dài chuỗi, ánh xạ dữ liệu         |
| `Supplier<T>`       | `T get()`              | Cung cấp giá trị mà không cần đầu vào     | Tạo đối tượng mới, lấy thời gian hiện tại |
| `UnaryOperator<T>`  | `T apply(T t)`         | Chuyển đổi giá trị cùng kiểu `T`          | Bình phương số, thay đổi giá trị          |
| `BinaryOperator<T>` | `T apply(T t1, T t2)`  | Thực hiện phép toán trên hai giá trị `T`  | Cộng, nhân, hoặc gộp dữ liệu              |

## Kết luận

Hiểu rõ và sử dụng thành thạo các functional interface này là một bước quan trọng để viết mã Java hiện đại, ngắn gọn và hiệu quả hơn.
