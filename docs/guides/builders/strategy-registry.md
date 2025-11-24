# Strategy + Registry Architecture

- **Strategy + Registry**: Do not modify the Orchestrator when adding a new provider; just introduce a new Strategy bean.
- **Clear Boundaries**: DTOs in the controller, entities in the repository, and provider-specific logic within the strategy.
- **Security**: Sign/verify callbacks, use an **idempotency** key for POST outbound requests, and enforce unique constraints for `providerTxId/trackingCode`.
- **Observability**: Logs must include `orderId/txId/tracking`, add tracing (`traceId`), and implement metrics segmented by provider.
- **PBAC (Permission-Based Access Control)**: Controllers should be annotated with `@PreAuthorize('order:update')` for payment/shipment operations.
- **Config-by-env**: All secrets reside in environment variables; `application.yml.template` (which contains no secrets) is committed to Git.
- **Error handling**: Standardize error codes from providers $\rightarrow$ map to domain errors (e.g., `PAYMENT_PROVIDER_UNAVAILABLE`, `SHIPMENT_ADDRESS_INVALID`).
- **Retry policy**: Exponential backoff, dead-letter queue (if integrated into an asynchronous flow later).

:::note
In short: **Payment/Shipment is not just data CRUD**. Each provider has its own distinct business flow (validate $\rightarrow$ sign digitally $\rightarrow$ create "intent"/waybill $\rightarrow$ callback $\rightarrow$ idempotency $\rightarrow$ status mapping). The **Strategy + Registry** approach helps you "encapsulate" the entire *behavior* by provider, while CRUD is only suitable for **enabling/disabling & configuration**.
:::

---

## Why Strategy + Registry is Better than Pure CRUD

- **Separates Behavior from Data**: CRUD only stores "provider=A, key=...", but doesn't handle digital signing, retries, or error mapping. Strategy fully encompasses these steps.
- **Safety & Error Control**: Payment/shipping flows have side-effects—requiring idempotency, signature verification, and a state machine. Placing this logic in code (Strategy) allows for proper testing and peer review.
- **Open-Closed Principle (OCP) Extension**: Adding a new provider means adding a new Strategy class without modifying old code; the Registry loads it automatically.
- **Testability**: Mock individual Strategies and write isolated unit/integration tests for each provider.
- **Security**: Restrict secrets from "floating" through CRUD. Strategy fetches secrets from env/secret manager, adhering to DevSecOps standards.
- **Observability**: Embed logging/metrics/tracing specific to the provider directly within the Strategy.

> "Pure" CRUD is suitable for admin tasks like **enabling/disabling providers or adjusting parameters** (timeout, route rules...), but it is **not** suitable for embedding the entire business procedure, crypto operations, or complex flow logic.

## "Are Developers Responsible for Handling Information?"

- **Yes – for business flow & technical correctness** (digital signing, API calls, status mapping, idempotency, error handling, security).

- **Admin/BA/OPS are responsible for configuration & operation** (enabling/disabling providers, retry thresholds, endpoints, webhooks, fee policy).

    $\Rightarrow$ **Hybrid Model**: *Behavior in Strategy*, *configuration via CRUD*. The Orchestrator fetches runtime configuration and calls the corresponding Strategy.

---

## Hybrid Model (Proposed)

- Strategy + Registry remains in place.

- Add **configuration tables** for admin management:

  - `payment_provider_config` (enable, displayName, timeout, callbackUrl, feePolicy...)
  - `shipment_provider_config`
  - (Optional) `provider_routing_rule` (e.g., based on region/order value).

- **Secrets**: The database only stores a `secretRef`; the actual value is fetched from ENV/Secret Manager.

### Suggested Code Snippets

```java title="src/main/java/com/laptech/module/payment/config/PaymentProviderConfig.java"
package com.laptech.module.payment.config;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Getter @Setter
@Entity @Table(name = "payment_provider_config",
        uniqueConstraints = @UniqueConstraint(name="uk_pay_provider_key", columnNames="provider_key"))
public class PaymentProviderConfig {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="provider_key", nullable=false, length=32) // ex: "VNPAY", "COD"
    private String providerKey;

    @Column(name="enabled", nullable=false)
    private boolean enabled = true;

    @Column(name="display_name", length=64)
    private String displayName;

    @Column(name="timeout_ms")
    private Integer timeoutMs;

    @Column(name="callback_url", length=256)
    private String callbackUrl;

    // Do NOT store secrets directly; store a reference
    @Column(name="secret_ref", length=128)
    private String secretRef; // map to env/secret manager key
}
```

```java title="src/main/java/com/laptech/module/payment/config/PaymentProviderConfigRepository.java"
package com.laptech.module.payment.config;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PaymentProviderConfigRepository extends JpaRepository<PaymentProviderConfig, Long> {
    Optional<PaymentProviderConfig> findByProviderKey(String providerKey);
}
```

```java title="src/main/java/com/laptech/module/payment/config/PaymentConfigService.java"
package com.laptech.module.payment.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentConfigService {
    private final PaymentProviderConfigRepository repo;

    public PaymentProviderConfig getEnabledConfigOrThrow(String providerKey) {
        var cfg = repo.findByProviderKey(providerKey)
            .orElseThrow(() -> new IllegalStateException("Payment provider not configured: " + providerKey));
        if (!cfg.isEnabled()) throw new IllegalStateException("Payment provider disabled: " + providerKey);
        return cfg;
    }

    // Secret lookup indirection
    public String resolveSecret(PaymentProviderConfig cfg) {
        // Example: read from ENV by reference key
        return System.getenv(cfg.getSecretRef()); // in prod use Vault/Secrets Manager client
    }
}
```

```java title="src/main/java/com/laptech/module/payment/PaymentOrchestrator.java"
// ... inside initiatePayment(...)
var cfg = paymentConfigService.getEnabledConfigOrThrow(req.provider().name());
var secret = paymentConfigService.resolveSecret(cfg);

PaymentStrategy strategy = registry.get(cfg.getProviderKey());
// Optionally pass cfg/secret into strategy via a context object:
ProviderRuntimeContext ctx = new ProviderRuntimeContext(cfg.getTimeoutMs(), cfg.getCallbackUrl(), secret);

strategy.validateOrderForPayment(order);
var tx = createTx(order, cfg.getProviderKey());
var res = strategy.initiatePayment(order, tx, ctx); // overload with context
```

```java title="src/main/java/com/laptech/module/payment/spi/PaymentStrategy.java"
// strategy contract with context
public interface PaymentStrategy {
    String key();
    void validateOrderForPayment(Order order);
    default BigDecimal computeAdjustment(Order order){ return BigDecimal.ZERO; }
    InitiatePaymentResponse initiatePayment(Order order, PaymentTransaction tx, ProviderRuntimeContext ctx);
    void handleCallback(String rawPayload, ProviderRuntimeContext ctx);
}
```

```java title="src/main/java/com/laptech/module/payment/spi/ProviderRuntimeContext.java"
// simple context holder
package com.laptech.module.payment.spi;
public record ProviderRuntimeContext(Integer timeoutMs, String callbackUrl, String secret) {}
```

> Shipment works similarly (`ShipmentProviderConfig`, `ShipmentConfigService`) and passes `ProviderRuntimeContext` to `ShipmentStrategy`.

---

## Conclusion

- **Strategy + Registry** solves the problem of *complex behavior* (payment, waybills, callbacks, security, state machine) in a controlled, testable, and extensible manner.
- **CRUD** is still necessary, but for **configuration** (enable/disable, timeout, route rule, secretRef...), not for replacing business logic.
- **Developers** are responsible for **business & technical correctness** within the Strategy/Orchestrator; **Admin/BA/OPS** are responsible for **configuration & operation** via CRUD.
- The **Hybrid** model above helps encapsulate behavior, maintain security, and remain operationally flexible.
