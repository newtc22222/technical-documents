# Hướng dẫn tích hợp Spring Security vào ứng dụng Spring Boot

Tài liệu này cung cấp hướng dẫn chi tiết, từng bước để tích hợp **Spring Security** vào ứng dụng Spring Boot, dựa trên tài liệu chính thức của Spring (phiên bản mới nhất tính đến năm 2025). Hướng dẫn phù hợp cho người mới bắt đầu đến nâng cao, tập trung vào ứng dụng e-commerce như Laptech (với các entity như User, Invoice, Product). Chúng ta sẽ sử dụng các tính năng cơ bản như xác thực (authentication), phân quyền (authorization), và mở rộng đến JWT hoặc OAuth.

Giả sử bạn đang sử dụng Spring Boot 3.x với Java 17+, và đã có kiến thức cơ bản về Spring Boot và JPA.

## 1. Thêm Dependencies

Bắt đầu bằng việc thêm dependency cho Spring Security vào project. Spring Boot cung cấp starter để đơn giản hóa việc này.

### Bước 1.1: Sử dụng Spring Initializr

- Truy cập [start.spring.io](https://start.spring.io) hoặc sử dụng IDE (IntelliJ, Eclipse) để tạo project.
- Chọn dependencies: **Spring Web**, **Spring Data JPA**, **Spring Security**.
- Tải về và import vào IDE.

### Bước 1.2: Thêm thủ công vào pom.xml (Maven)

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <!-- Các dependency khác như JPA, Web -->
</dependencies>
```

### Bước 1.3: Thêm thủ công vào build.gradle (Gradle)

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-security'
    // Các dependency khác
}
```

### Bước 1.4: Override phiên bản (nếu cần, ví dụ Spring Security 6.3.x)

- Maven:

```xml
<properties>
    <spring-security.version>6.3.0</spring-security.version>
</properties>
```

- Gradle:

```groovy
ext['spring-security.version'] = '6.3.0'
```

**Best practice**: Sử dụng BOM của Spring Boot để quản lý phiên bản tự động, tránh xung đột.

Sau khi thêm, chạy ứng dụng: Spring Security sẽ tự động bảo vệ tất cả endpoint với form login mặc định và tài khoản "user" (password in ra console).

## 2. Cấu hình cơ bản Security

Tạo class cấu hình để tùy chỉnh security.

### Bước 2.1: Tạo SecurityConfig

Tạo package `config` và class `SecurityConfig`:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/public/**").permitAll()  // Cho phép truy cập public
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // Chỉ admin
                .anyRequest().authenticated()  // Các request khác cần xác thực
            )
            // Trang login tùy chỉnh
            .formLogin(form -> form
                .loginPage("/login")  
                .permitAll()
            )
            // .logout(logout -> logout.permitAll())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // Nếu dùng JWT
            )
            .csrf(csrf -> csrf.disable());  // Disable CSRF cho API, enable cho web

        return http.build();
    }
}
```

**Giải thích**:

- `@EnableWebSecurity`: Kích hoạt tùy chỉnh security.
- `SecurityFilterChain`: Bean chính để cấu hình quy tắc bảo mật.
- `authorizeHttpRequests`: Định nghĩa quyền truy cập dựa trên URL.
- `formLogin`: Cấu hình login form (mặc định hoặc tùy chỉnh).
- `csrf.disable()`: Disable cho API stateless (JWT), nhưng enable cho ứng dụng web để tránh tấn công CSRF.

### Bước 2.2: Cấu hình application.properties

```properties
spring.security.user.name=admin
spring.security.user.password=adminpass  # Password mặc định (thay bằng custom)
```

## 3. Xác thực cơ bản (Basic Authentication)

Sử dụng `UserDetailsService` để load user từ database.

### Bước 3.1: Entity User implement UserDetails

```java
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import javax.persistence.*;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "user")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    private String password;  // Hashed

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_role",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;

    private boolean enabled = true;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
            .map(role -> new SimpleGrantedAuthority(role.getName()))
            .collect(Collectors.toSet());
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
```

### Bước 3.2: Entity Role

```java
import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "role")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;  // e.g., "ADMIN", "USER"
}
```

### Bước 3.3: UserDetailsService

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
    }
}
```

### Bước 3.4: PasswordEncoder

Thêm vào `SecurityConfig`:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### Bước 3.5: Cập nhật SecurityConfig để sử dụng UserDetailsService

Cập nhật `securityFilterChain`:

```java
http
    .authenticationProvider(authenticationProvider());  // Thêm provider

@Bean
public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
    authProvider.setUserDetailsService(customUserDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());
    return authProvider;
}
```

## 4. Phân quyền (Authorization)

- Sử dụng `@PreAuthorize` hoặc cấu hình trong `SecurityConfig`.
- Ví dụ trong Controller:

```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    // Các endpoint admin
}
```

## 5. Tích hợp nâng cao: JWT Authentication

Nếu cần stateless API (phù hợp Laptech với VNPay/GHN).

### Bước 5.1: Thêm dependency JWT

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

### Bước 5.2: Tạo JwtUtils

```java
import io.jsonwebtoken.*;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtils {
    private String jwtSecret = "yourSecretKey";
    private int jwtExpirationMs = 86400000;  // 24 giờ

    public String generateJwtToken(UserDetails userDetails) {
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

### Bước 5.3: Tạo JwtAuthFilter

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class JwtAuthFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
```

### Bước 5.4: Đăng ký Filter trong SecurityConfig

```java
@Bean
public JwtAuthFilter jwtAuthFilter() {
    return new JwtAuthFilter();
}

http
    .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);
```

### Bước 5.5: AuthController cho Login

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginDTO loginDTO) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginDTO.getEmail(), loginDTO.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication.getPrincipal());
        return ResponseEntity.ok(jwt);
    }
}
```

## 6. Tích hợp nâng cao: OAuth2

Nếu cần đăng nhập qua Google/Facebook.

### Bước 6.1: Thêm dependency OAuth2

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

### Bước 6.2: Cấu hình application.properties

```properties
spring.security.oauth2.client.registration.google.client-id=your-client-id
spring.security.oauth2.client.registration.google.client-secret=your-client-secret
```

### Bước 6.3: Cập nhật SecurityConfig

```java
http
    .oauth2Login(oauth2 -> oauth2
        .loginPage("/login")
    );
```

## 7. Best Practices

- **Sử dụng HTTPS**: Luôn enable HTTPS trong production.
- **Hash Password**: Sử dụng BCrypt hoặc Argon2.
- **Xử lý Exception**: Tạo custom AccessDeniedHandler và AuthenticationEntryPoint.
- **Testing**: Sử dụng `@WithMockUser` trong test.
- **Tích hợp với Laptech**: Kết hợp với JPA (User entity), bảo vệ endpoint như /api/order, /api/payment.
- **Debug**: Enable `spring.security.debug=true` trong properties để log security.

## 8. Kết luận

Tích hợp Spring Security giúp bảo vệ ứng dụng hiệu quả. Bắt đầu từ cơ bản và mở rộng theo nhu cầu. Tham khảo thêm tại [Spring Security Docs](https://docs.spring.io/spring-security/reference/index.html).
