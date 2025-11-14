# Overview of Functional Interfaces in Java

A **Functional Interface** in Java is an interface that contains **exactly one abstract method**. It’s the core foundation for **Lambda Expressions** and **Method References**, enabling more concise and expressive code.

You can use the `@FunctionalInterface` annotation to explicitly mark an interface as functional. It’s optional, but a good habit — the compiler will warn you if you accidentally add more than one abstract method.

---

## Why Are Functional Interfaces Important?

* **Foundation for Lambda Expressions**
  They allow you to pass behavior as a method argument.

* **Integral to the Stream API**
  Most Stream API methods (`filter`, `map`, `forEach`, etc.) accept functional interfaces.

* **Promotes Functional Programming**
  Helps you write declarative code — focusing on *what* should be done instead of *how*.

---

## The Most Common Functional Interfaces

Java provides many built-in functional interfaces in the `java.util.function` package, covering most common use cases.

---

### 1. `Predicate<T>`

* **Purpose**: Check whether a given input satisfies some condition.
* **Abstract method**: `boolean test(T t)`
* **Description**: Takes a `T`, returns `true` or `false`.

**Example:**

```java
Predicate<Integer> isGreaterThan10 = (number) -> number > 10;
System.out.println(isGreaterThan10.test(5));   // false
System.out.println(isGreaterThan10.test(20));  // true
```

---

### 2. `Consumer<T>`

* **Purpose**: Perform an action on the given input, returning nothing.
* **Abstract method**: `void accept(T t)`
* **Description**: “Consumes” a `T`. Often used for side effects like logging or writing to files.

**Example:**

```java
Consumer<String> printMessage = (message) -> System.out.println(message);
printMessage.accept("Hello, Functional Interface!");
```

---

### 3. `Function<T, R>`

* **Purpose**: Transform an input of type `T` into a result of type `R`.
* **Abstract method**: `R apply(T t)`
* **Description**: Accepts `T`, returns `R`.

**Example:**

```java
Function<String, Integer> getStringLength = (str) -> str.length();
System.out.println(getStringLength.apply("Java")); // 4
```

---

### 4. `Supplier<T>`

* **Purpose**: Supply a value with no input.
* **Abstract method**: `T get()`
* **Description**: Produces a `T`. Often used for generating defaults or creating new objects.

**Example:**

```java
Supplier<LocalDateTime> getCurrentDateTime = () -> LocalDateTime.now();
System.out.println(getCurrentDateTime.get());
```

---

## Other Useful Variants

### `UnaryOperator<T>`

* Special case of `Function<T, T>`
* **Method**: `T apply(T t)`
* **Example:**

```java
UnaryOperator<Integer> square = (number) -> number * number;
System.out.println(square.apply(5)); // 25
```

---

### `BinaryOperator<T>`

* Accepts two inputs of type `T`, returns a `T`
* Great for reduction operations
* **Method**: `T apply(T t1, T t2)`

**Example:**

```java
BinaryOperator<Integer> sum = (a, b) -> a + b;
System.out.println(sum.apply(10, 20)); // 30
```

---

### Primitive-specialized interfaces

To avoid boxing/unboxing overhead, Java includes equivalents like:

* `IntPredicate`
* `LongConsumer`
* `DoubleFunction`
* …and more.

---

## Summary Table

| Interface           | Abstract Method       | Purpose                            | Example Use Case                      |
| ------------------- | --------------------- | ---------------------------------- | ------------------------------------- |
| `Predicate<T>`      | `boolean test(T t)`   | Check conditions                   | Filter list, validate values          |
| `Consumer<T>`       | `void accept(T t)`    | Perform an action, no return value | Print, log, write to file             |
| `Function<T, R>`    | `R apply(T t)`        | Transform `T` → `R`                | String length, data mapping           |
| `Supplier<T>`       | `T get()`             | Provide a value without input      | Create objects, get current timestamp |
| `UnaryOperator<T>`  | `T apply(T t)`        | Transform value of same type       | Square number, mutate values          |
| `BinaryOperator<T>` | `T apply(T t1, T t2)` | Combine two values of same type    | Sum, multiply, reduce operations      |

---

## Conclusion

Mastering these functional interfaces is a key step toward writing modern, concise, and efficient Java code. They unlock the power of lambdas, streams, and functional programming patterns across the entire Java ecosystem.
