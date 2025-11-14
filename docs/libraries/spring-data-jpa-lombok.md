# Tích hợp Spring Data JPA và Lombok

Tài liệu này cung cấp một hướng dẫn toàn diện về cách kết hợp sức mạnh của Spring Data JPA và thư viện Lombok để xây dựng các lớp Entity một cách hiệu quả, sạch sẽ và an toàn.

---

## 1. Tại sao nên kết hợp JPA và Lombok?

- **Spring Data JPA** giúp đơn giản hóa tầng truy cập dữ liệu bằng cách cung cấp các Repository mạnh mẽ, giảm thiểu việc phải viết các câu lệnh SQL thủ công.
- **Lombok** là một thư viện giúp giảm thiểu code lặp lại (boilerplate code) bằng cách tự động tạo ra các phương thức như getters, setters, constructors, `toString()`... thông qua các annotation.

Khi kết hợp, chúng ta có được các lớp Entity vừa mạnh mẽ về mặt chức năng, vừa cực kỳ gọn gàng và dễ đọc. Tuy nhiên, việc kết hợp này đòi hỏi sự cẩn thận để tránh các cạm bẫy phổ biến liên quan đến vòng đời của Entity.

---

## 2. Thiết lập Dự án

Để bắt đầu, hãy đảm bảo file `pom.xml` của bạn có đầy đủ các dependency và cấu hình plugin cần thiết.

### Dependencies

```xml
<!-- Spring Data JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

#### Cấu hình Maven Compiler Plugin

Đây là bước **quan trọng nhất** để đảm bảo Lombok có thể tạo code trong quá trình biên dịch.

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <source>17</source> <!-- Hoặc phiên bản Java của bạn -->
                <target>17</target>
                <annotationProcessorPaths>
                    <!-- Processor của Lombok -->
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>${lombok.version}</version>
                    </path>
                    <!-- Các processor khác nếu có, ví dụ MapStruct -->
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

**Lưu ý:** Trong IntelliJ IDEA, bạn cần phải kích hoạt "Annotation Processing" trong phần `Settings > Build, Execution, Deployment > Compiler > Annotation Processors`.

---

## 3. Best Practice khi xây dựng Entity

Dưới đây là các nguyên tắc và thực hành tốt nhất khi định nghĩa một lớp Entity. Chúng ta sẽ sử dụng `Product` entity làm ví dụ.

### a. Các Annotation Lombok cơ bản

- `@Getter`, `@Setter`: An toàn để sử dụng, giúp tạo getter và setter cho các trường.
- `@NoArgsConstructor`: **Bắt buộc**. JPA yêu cầu một constructor không tham số để có thể khởi tạo các đối tượng entity.
- `@AllArgsConstructor`, `@Builder`: Rất hữu ích cho việc tạo dữ liệu mẫu (seeding) và viết test case.

### b. Xử lý các Mối quan hệ (`@ToString`)

- **Vấn đề:** Sử dụng `@ToString` mặc định của Lombok trên một entity có các mối quan hệ được tải lười (`fetch = FetchType.LAZY`) có thể gây ra lỗi `LazyInitializationException`. Lỗi này xảy ra khi phương thức `toString()` cố gắng truy cập vào một collection chưa được tải từ CSDL trong khi transaction đã bị đóng.
- **Giải pháp (Best Practice):** Luôn ghi đè phương thức `toString()` thủ công hoặc sử dụng `@ToString.Exclude` của Lombok để loại bỏ các trường quan hệ khỏi phương thức này.

### c. Xử lý `equals()` và `hashCode()` (Quan trọng nhất)

- **Vấn đề:** Sử dụng `@EqualsAndHashCode` mặc định của Lombok là **rất nguy hiểm** cho JPA entity.
    1. **Vấn đề với `hashCode()`:** Hash code của một entity sẽ thay đổi khi nó được lưu vào CSDL (vì trường `id` thay đổi từ `null` thành một giá trị). Điều này phá vỡ "hợp đồng" của `hashCode` và gây ra hành vi không mong muốn khi sử dụng entity trong các `HashSet` hoặc `HashMap`.
    2. **Vấn đề với `equals()`:** Nếu `equals()` so sánh các trường quan hệ, nó có thể gây ra các vòng lặp vô hạn hoặc `LazyInitializationException`.
- **Giải pháp (Best Practice):** Luôn ghi đè hai phương thức này thủ công.
  - **`equals()`:** Chỉ nên so sánh dựa trên trường `@Id`. Phải xử lý đúng trường hợp `id` là `null`.
  - **`hashCode()`:** Nên trả về một giá trị hằng số (ví dụ: `getClass().hashCode()`) để đảm bảo hash code của một đối tượng **không bao giờ thay đổi** trong suốt vòng đời của nó.

---

## 4. Ví dụ: Entity `Product` hoàn chỉnh

Dưới đây là một ví dụ về `Product` entity áp dụng tất cả các best practice đã thảo luận.

```java
package com.laptech.product.entity;

import com.laptech.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_sku", columnList = "sku", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String sku;

    // ... các trường khác như description, price, stockQuantity ...

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> specifications;

    // --- Các mối quan hệ ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ProductImage> images;

    // --- Best Practice cho equals(), hashCode() và toString() ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        // Chỉ so sánh nếu id không null.
        return id != null && id.equals(product.id);
    }

    @Override
    public int hashCode() {
        // Trả về một giá trị hằng số để đảm bảo tính nhất quán.
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        // Chỉ bao gồm các trường an toàn, không gây ra Lazy Loading.
        return "Product{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", sku='" + sku + '\'' +
                '}';
    }
}
