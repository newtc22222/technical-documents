# Lombok Logger

## 1. Logger Annotations in Lombok

Lombok provides several annotations for automatically generating logger instances:

| Annotation    | Logger Type                       | Actual Class Used                                | Default Package   |
| ------------- | --------------------------------- | ------------------------------------------------ | ----------------- |
| `@Slf4j`      | **SLF4J**                         | `org.slf4j.Logger` + `org.slf4j.LoggerFactory`   | `org.slf4j`       |
| `@Log4j`      | **Log4j 1.x**                     | `org.apache.log4j.Logger`                        | `log4j`           |
| `@Log4j2`     | **Log4j 2.x**                     | `org.apache.logging.log4j.Logger` + `LogManager` | `log4j2`          |
| `@CommonsLog` | **Apache Commons Logging (JCL)**  | `org.apache.commons.logging.Log` + `LogFactory`  | `commons-logging` |
| `@JBossLog`   | **JBoss Logging**                 | `org.jboss.logging.Logger`                       | `jboss-logging`   |
| `@XSlf4j`     | **Extended SLF4J** (with markers) | `org.slf4j.ext.XLogger` + `XLoggerFactory`       | `slf4j-ext`       |
| `@Flogger`    | **Google Flogger**                | `com.google.common.flogger.FluentLogger`         | google flogger    |

---

## 2. Using Lombok Logger with Spring Boot

Spring Boot uses **SLF4J** as the logging façade by default, routing logs through **Logback**.

So the recommended option is:

### ✅ **`@Slf4j` — best choice for Spring Boot**

* Doesn’t depend on a specific logging backend (you can switch to Logback/Log4j2 easily).
* Fully compatible with Spring Boot’s default logging setup.
* Clean, standard, and widely used.

**Example:**

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

---

### 🟦 `@Log4j2` — for when you *really* need Log4j2 features

Use this when you want to leverage Log4j2’s advanced capabilities like:

* asynchronous logging
* custom filters & layouts
* high-performance logging under load

If you use `@Log4j2` in Spring Boot:

✔ Remove `spring-boot-starter-logging`
✔ Add `spring-boot-starter-log4j2`

---

### 🟨 `@CommonsLog`

* Mainly for legacy systems still using Apache Commons Logging.
* Not recommended for new Spring Boot applications unless required by the codebase.

### 🟥 `@JBossLog`

* For applications running in the JBoss / WildFly ecosystem.
* Rarely used in Spring Boot unless deploying into JBoss EAP.

### 🟩 `@Flogger`

* Powerful for structured/typed logging.
* Less common in Spring Boot.
* Requires additional bridging if you want unified logging output.

---

## 3. Summary: Which Logger Should You Choose?

| Scenario                               | Recommended Logger         |
| -------------------------------------- | -------------------------- |
| Standard Spring Boot application       | **`@Slf4j`** ✔             |
| Need Log4j2 advanced features          | **`@Log4j2`**              |
| Legacy code / framework constraints    | `@CommonsLog`, `@JBossLog` |
| Want Google’s structured logging style | `@Flogger`                 |
