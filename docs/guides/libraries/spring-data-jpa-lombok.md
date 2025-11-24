# Integrating Spring Data JPA and Lombok

This document provides a comprehensive guide on how to combine the power of **Spring Data JPA** and **Lombok** to build clean, efficient, and safe Entity classes.

---

## 1. Why Combine JPA and Lombok?

* **Spring Data JPA** simplifies the data access layer by providing powerful repositories and removing most manual SQL.
* **Lombok** reduces boilerplate code by generating getters, setters, constructors, and `toString()` via annotations.

When combined, your entities become both functional and clean.
However — this combo requires careful handling to avoid common pitfalls in the entity lifecycle.

---

## 2. Project Setup

Make sure your `pom.xml` includes the necessary dependencies and compiler plugin configuration.

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

### Maven Compiler Plugin Configuration

This is **critical** — Lombok generates code at compile time, and the annotation processor must be enabled.

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <source>17</source> <!-- Or your Java version -->
                <target>17</target>
                <annotationProcessorPaths>
                    <!-- Lombok annotation processor -->
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>${lombok.version}</version>
                    </path>
                    <!-- Other processors (e.g., MapStruct) go here -->
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

> **Note:** In IntelliJ, enable annotation processing:
> `Settings → Build, Execution, Deployment → Compiler → Annotation Processors`.

---

## 3. Best Practices for Entity Design

Here are the best practices for creating a proper Entity class.
We’ll use a `Product` entity as the example.

---

### a. Essential Lombok Annotations

* `@Getter`, `@Setter` — safe and recommended
* `@NoArgsConstructor` — **mandatory** for JPA (required for proxying and reflection)
* `@AllArgsConstructor`, `@Builder` — great for seeding and testing

---

### b. Handling Relationships (`@ToString`)

**The Problem:**
Using Lombok’s default `@ToString` in an entity with lazy-loaded relationships can trigger `LazyInitializationException`.
Why? Because `toString()` accesses fields that JPA hasn't loaded yet after the entity manager is closed.

**Best Practice:**

* Override `toString()` manually **or**
* Use `@ToString.Exclude` on relationship fields

---

### c. Handling `equals()` and `hashCode()` — the MOST important part

**Why default Lombok is dangerous:**

1. **`hashCode()` issue:**
   The hash changes when an entity is persisted (because `id` changes from `null` to a value).
   This can break collections like `HashSet` and `HashMap`.

2. **`equals()` issue:**
   Comparing relationship fields in `equals()` can:

   * cause infinite loops
   * trigger `LazyInitializationException`
   * break JPA persistence identity rules

**Best Practice:**
Write both methods manually:

* `equals()` compares only the ID — and only when it isn’t null
* `hashCode()` returns a **constant per-class hash** to ensure consistency

This is the same strategy used by Hibernate and recommended by Vlad Mihalcea.

---

## 4. Full Example: `Product` Entity (Best Practice)

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

    // ... other fields: description, price, stockQuantity ...

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> specifications;

    // --- Relationships ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ProductImage> images;

    // --- Best practices for equals(), hashCode(), toString() ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        // Compare only when id is not null
        return id != null && id.equals(product.id);
    }

    @Override
    public int hashCode() {
        // Return a constant hash per class to avoid changes after persistence
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        // Include only safe fields (avoid lazy-loaded relationships)
        return "Product{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", sku='" + sku + '\'' +
                '}';
    }
}
```
