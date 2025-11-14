# Guide to Integrating Spring Security into a Spring Boot Application

This document provides a detailed, step-by-step guide for integrating **Spring Security** into a Spring Boot application, based on the official Spring documentation (up to date as of 2025).
It’s designed for beginners to advanced users and tailored for an e-commerce app like Laptech (entities such as User, Invoice, Product).
We’ll cover basic authentication & authorization, and expand into JWT and OAuth.

Assumptions:

* Spring Boot 3.x
* Java 17+
* You already understand Spring Boot + JPA basics

---

## 1. Add Dependencies

Start by adding the Spring Security dependency. Spring Boot provides a convenient starter for this.

### Step 1.1: Using Spring Initializr

Go to **start.spring.io** or start a project via your IDE (IntelliJ, Eclipse).

Select:

* Spring Web
* Spring Data JPA
* Spring Security

Then download the project.

---

### Step 1.2: Add manually to `pom.xml` (Maven)

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <!-- Other dependencies like JPA, Web -->
</dependencies>
```

### Step 1.3: Add manually to `build.gradle` (Gradle)

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-security'
    // Other dependencies
}
```

---

### Step 1.4: Override version (if needed, e.g., Spring Security 6.3.x)

**Maven:**

```xml
<properties>
    <spring-security.version>6.3.0</spring-security.version>
</properties>
```

**Gradle:**

```groovy
ext['spring-security.version'] = '6.3.0'
```

**Best practice:**
Use Spring Boot's dependency management (BOM) to avoid version conflicts.

---

After adding the dependency and running the app:

Spring Security automatically protects all endpoints using a default login page and a generated password printed in console.

---

## 2. Basic Security Configuration

Create a configuration class to customize security rules.

### Step 2.1: Create `SecurityConfig`

Create a `config` package and add:

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
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .permitAll()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // for JWT use cases
            )
            .csrf(csrf -> csrf.disable()); // disabled for APIs

        return http.build();
    }
}
```

**Explanation:**

* `@EnableWebSecurity` → enables custom configuration
* `SecurityFilterChain` → main bean to define security rules
* `authorizeHttpRequests` → route-based authorization
* `formLogin` → custom or default login form
* `csrf.disable()` → required for stateless API designs (JWT)

---

### Step 2.2: App-level user config

```properties
spring.security.user.name=admin
spring.security.user.password=adminpass
```

---

## 3. Basic Authentication (with database)

Use `UserDetailsService` to load users from DB.

### Step 3.1: User Entity implements `UserDetails`

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

    private String password; // hashed password

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

    // JPA/Security required fields
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return enabled; }
}
```

---

### Step 3.2: Role Entity

```java
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

    private String name; // e.g. ADMIN, USER
}
```

---

### Step 3.3: CustomUserDetailsService

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
            .orElseThrow(() ->
                new UsernameNotFoundException("User not found with email: " + username));
    }
}
```

---

### Step 3.4: PasswordEncoder

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

---

### Step 3.5: Register authentication provider

```java
http.authenticationProvider(authenticationProvider());

@Bean
public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(customUserDetailsService);
    provider.setPasswordEncoder(passwordEncoder());
    return provider;
}
```

---

## 4. Authorization

Use annotations or HTTP rules.

Example:

```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
}
```

---

## 5. Advanced Integration: JWT Authentication

Ideal for stateless APIs (like Laptech with VNPay/GHN integrations).

### Step 5.1: Add JWT dependencies

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

---

### Step 5.2: JwtUtils

```java
@Component
public class JwtUtils {

    private String jwtSecret = "yourSecretKey";
    private int jwtExpirationMs = 86400000; // 24h

    public String generateJwtToken(UserDetails userDetails) {
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser().setSigningKey(jwtSecret)
                .parseClaimsJws(token).getBody().getSubject();
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

---

### Step 5.3: JwtAuthFilter

```java
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String jwt = parseJwt(request);

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                auth.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication", e);
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
```

---

### Step 5.4: Register filter

```java
http.addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

@Bean
public JwtAuthFilter jwtAuthFilter() {
    return new JwtAuthFilter();
}
```

---

### Step 5.5: AuthController

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginDTO dto) {
        Authentication authentication =
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication.getPrincipal());
        return ResponseEntity.ok(jwt);
    }
}
```

---

## 6. Advanced: OAuth2 Login

### Step 6.1: Add dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

### Step 6.2: Add OAuth Config

```properties
spring.security.oauth2.client.registration.google.client-id=your-client-id
spring.security.oauth2.client.registration.google.client-secret=your-client-secret
```

### Step 6.3: Enable OAuth2 login

```java
http.oauth2Login(oauth2 -> oauth2
    .loginPage("/login")
);
```

---

## 7. Best Practices

* **Always use HTTPS** in production
* **Hash passwords** with BCrypt or Argon2
* Create custom `AccessDeniedHandler` and `AuthenticationEntryPoint`
* Use `@WithMockUser` for testing security
* Protect critical endpoints like `/api/order`, `/api/payment`
* Enable debug logs:
  `spring.security.debug=true`

---

## 8. Conclusion

Integrating Spring Security properly makes your application significantly safer.
Start simple, then expand to JWT/OAuth as needed.

You can find more details in the official Spring Security docs.
