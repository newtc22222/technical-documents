# Kiến trúc Strategy + Registry

- **Strategy + Registry**: không sửa Orchestrator khi thêm provider mới, chỉ thả thêm bean Strategy.
- **Boundary rõ ràng**: DTO ở controller, entity ở repo, logic provider trong strategy.
- **Bảo mật**: ký/verify callback, **idempotency** key cho POST outbound, unique constraints cho
  providerTxId/trackingCode.
- **Observability**: log có `orderId/txId/tracking`, add tracing (traceId) và metrics theo provider.
- **PBAC**: Controller gắn `@PreAuthorize('order:update')` cho các thao tác thanh toán/giao vận.
- **Config-by-env**: mọi secret ở env, `application.yml.template` commit lên Git (không chứa secret).
- **Error handling**: chuẩn hóa mã lỗi theo provider → domain error (ví dụ `PAYMENT_PROVIDER_UNAVAILABLE`,
  `SHIPMENT_ADDRESS_INVALID`).
- **Retry policy**: exponential backoff, dead-letter queue (nếu sau này đưa vào async flow).
  Ngắn gọn: **Payment/Shipment không chỉ là CRUD dữ liệu**. Mỗi nhà cung cấp có luồng nghiệp vụ riêng (validate → ký số → tạo “intent”/vận đơn → callback → idempotency → mapping trạng thái). Cách **Strategy + Registry** giúp bạn “đóng gói” toàn bộ _hành vi_ theo nhà cung cấp, còn CRUD chỉ phù hợp để **bật/tắt & cấu hình**.

---

## Vì sao Strategy + Registry tốt hơn thuần CRUD

- **Tách hành vi khỏi dữ liệu**: CRUD chỉ lưu “provider=A, key=…”, nhưng không xử lý ký số, retry, mapping lỗi. Strategy bao trọn các bước này.
- **An toàn & kiểm soát lỗi**: Flow thanh toán/vận chuyển có side-effect—cần idempotency, xác thực chữ ký, state machine. Để trong code (Strategy) mới test được, review được.
- **Mở rộng OCP**: Thêm nhà cung cấp mới = thêm class Strategy mới, không đụng code cũ; Registry tự nạp.
- **Testability**: Mock từng Strategy, viết unit/integration test độc lập cho từng provider.
- **Bảo mật**: Hạn chế để secret “trôi” qua CRUD. Strategy lấy secret từ env/secret manager đúng chuẩn DevSecOps.
- **Observability**: Log/metrics/tracing theo provider ngay trong Strategy.

> CRUD “thuần” thích hợp để admin **bật/tắt provider, điều chỉnh tham số** (timeout, route rule…), **không** thích hợp để nhúng toàn bộ thủ tục nghiệp vụ/crypto/flow.

## “Dev có chịu trách nhiệm xử lý thông tin không?”

- **Có – về luồng nghiệp vụ & độ đúng kỹ thuật** (ký số, gọi API, mapping trạng thái, idempotency, error handling, bảo mật).
- **Admin/BA/OPS chịu trách nhiệm cấu hình & vận hành** (bật/tắt provider, ngưỡng retry, endpoint, webhooks, fee policy).
  \=> Mô hình **Hybrid**: _Hành vi trong Strategy_, _cấu hình qua CRUD_. Orchestrator lấy config runtime và gọi Strategy tương ứng.

---

## Mô hình Hybrid (đề xuất)

- Strategy + Registry giữ nguyên.
- Thêm **bảng cấu hình** để admin quản trị:

  - `payment_provider_config` (enable, displayName, timeout, callbackUrl, feePolicy…)
  - `shipment_provider_config`
  - (Tùy chọn) `provider_routing_rule` (ví dụ theo vùng/giá trị đơn hàng).

- **Secret**: DB chỉ lưu `secretRef`; giá trị thật lấy từ ENV/Secret Manager.

### Code mẫu gợi ý

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

> Shipment làm tương tự (`ShipmentProviderConfig`, `ShipmentConfigService`) và truyền `ProviderRuntimeContext` sang `ShipmentStrategy`.

---

## Kết luận

- **Strategy + Registry** giải quyết _hành vi phức tạp_ (thanh toán, vận đơn, callback, bảo mật, state machine) một cách có kiểm soát, testable và mở rộng.
- **CRUD** vẫn cần, nhưng cho **cấu hình** (enable/disable, timeout, route rule, secretRef…), chứ không thay thế logic nghiệp vụ.
- **Dev** chịu trách nhiệm về **độ đúng nghiệp vụ & kỹ thuật** trong Strategy/Orchestrator; **Admin/BA/OPS** chịu trách nhiệm **cấu hình & vận hành** qua CRUD.
- Kiểu **Hybrid** trên giúp đóng gói hành vi, giữ an toàn và vẫn linh hoạt cho vận hành.
