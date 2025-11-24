# Lombok Logger

## 1. Các annotation logger trong Lombok

Lombok cung cấp nhiều annotation khác nhau để tự động tạo logger, ví dụ:

| Annotation    | Logger sử dụng                    | Class cụ thể                                     | Package mặc định |
| ------------- | --------------------------------- | ------------------------------------------------ | ---------------- |
| `@Slf4j`      | **SLF4J**                         | `org.slf4j.Logger` + `org.slf4j.LoggerFactory`   | `org.slf4j`      |
| `@Log4j`      | **Log4j 1.x**                     | `org.apache.log4j.Logger`                        | `log4j`          |
| `@Log4j2`     | **Log4j 2.x**                     | `org.apache.logging.log4j.Logger` + `LogManager` | `log4j2`         |
| `@CommonsLog` | **Apache Commons Logging (JCL)**  | `org.apache.commons.logging.Log` + `LogFactory`  | commons-logging  |
| `@JBossLog`   | **JBoss Logging**                 | `org.jboss.logging.Logger`                       | jboss-logging    |
| `@XSlf4j`     | **Extended SLF4J** (with markers) | `org.slf4j.ext.XLogger` + `XLoggerFactory`       | `slf4j-ext`      |
| `@Flogger`    | **Google Flogger**                | `com.google.common.flogger.FluentLogger`         | google flogger   |

---

## 2. Khi dùng với Spring Boot

Spring Boot mặc định dùng **SLF4J** như một façade (mặt nạ) và route log qua **Logback**.
Vì vậy:

* **Khuyến nghị nhất**: `@Slf4j`

  * Không phụ thuộc vào log backend cụ thể → dễ thay đổi cấu hình log (Logback, Log4j2, v.v.)
  * Hoàn toàn tương thích với Spring Boot (vì Spring Boot auto-config Logback qua SLF4J).
  * Ví dụ:

      ```java
      @Slf4j
      @RestController
      public class DemoController {
          @GetMapping("/")
          public String home() {
              log.info("Hello from controller!");
              return "Hi!";
          }
      }
      ```

* **`@Log4j2`**

  * Dùng khi muốn tận dụng full tính năng của Log4j2 (như async logging, advanced filtering).
  * Không cần SLF4J nếu project thuần Log4j2.
  * Nhưng với Spring Boot, nếu dùng `@Log4j2` thì nên bỏ dependency `spring-boot-starter-logging` và thay bằng `spring-boot-starter-log4j2`.

* **`@CommonsLog`**

  * Chủ yếu để tương thích với các dự án cũ vẫn dùng Apache Commons Logging.
  * Không nên dùng cho project mới, trừ khi code base yêu cầu.

* **`@JBossLog`**

  * Dùng cho môi trường JBoss / WildFly.
  * Không phổ biến với Spring Boot trừ khi deploy vào JBoss EAP.

* **`@Flogger`**

  * Mạnh cho structured logging, nhưng ít phổ biến với Spring Boot.
  * Cần cấu hình thêm bridge nếu muốn kết hợp.

---

## 3. Kết luận chọn logger

* **Spring Boot app thông thường** → `@Slf4j` (chuẩn, dễ tích hợp, maintain lâu dài).
* **Muốn Log4j2 features** → `@Log4j2` (cấu hình thêm backend).
* **Code base cũ / tương thích framework khác** → chọn `@CommonsLog` hoặc `@JBossLog` theo yêu cầu.
