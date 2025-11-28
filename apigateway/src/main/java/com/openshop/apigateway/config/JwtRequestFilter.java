package com.openshop.apigateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

@Component
public class JwtRequestFilter extends AbstractGatewayFilterFactory<JwtRequestFilter.Config> {

    private static final Logger log = LoggerFactory.getLogger(JwtRequestFilter.class);

    @Value("${jwt.secret}")
    private String secret;

    public JwtRequestFilter() {
        super(Config.class);
    }

    /**
     * Returns the signing key used to sign the JWT token.
     *
     * @return the SecretKey used for signing and validating JWT
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();
            String method = request.getMethod().toString();

            // 1️⃣ Skip authentication for public/auth endpoints
            if (path.contains("/api/auth/") || path.contains("/actuator")) {
                log.debug("🔓 Public endpoint accessed: {} {}", method, path);
                return chain.filter(exchange);
            }

            // 2️⃣ Extract Authorization header
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("⚠️  AUTHENTICATION FAILED: Missing or invalid Authorization header for {} {}", method, path);
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // 3️⃣ Parse and validate token
            String token = authHeader.substring(7);

            try {
                Claims claims = Jwts.parser().verifyWith(getSigningKey())
                        .build().parseSignedClaims(token).getPayload();

                String username = claims.getSubject();
                String role = claims.get("role", String.class);
                Object userIdObj = claims.get("userId");
                String userId = userIdObj != null ? String.valueOf(userIdObj) : null;

                log.info("🔐 JWT VALIDATED | User: {} | Role: {} | UserID: {} | Path: {} {}", 
                    username, role, userId, method, path);

                // 4️⃣ Forward user info as headers
                ServerHttpRequest.Builder requestBuilder = request.mutate()
                        .header("X-User-Name", username)
                        .header("X-User-Role", role);
                
                if (userId != null) {
                    requestBuilder.header("X-User-Id", userId);
                }
                
                ServerHttpRequest mutatedRequest = requestBuilder.build();

                // Role-based access enforcement
                if (!isAuthorized(path, role)) {
                    log.warn("🚫 AUTHORIZATION DENIED | User: {} | Role: {} | Path: {} {} | Reason: Insufficient permissions", 
                        username, role, method, path);
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }

                log.info("✅ ACCESS GRANTED | User: {} | Role: {} | Path: {} {}", 
                    username, role, method, path);

                return chain.filter(exchange.mutate().request(mutatedRequest).build());

            } catch (JwtException e) {
                log.error("❌ JWT VALIDATION FAILED | Path: {} {} | Error: {} | Token: {}", 
                    method, path, e.getMessage(), token);
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        };
    }

    private boolean isAuthorized(String path, String role) {
        if (role == null) return false;

        // Example role-based rules
        if (path.startsWith("/api/products/")) {
            // GET requests are public, POST/PUT/DELETE require SELLER or ADMIN
            return true; // Fine-grained control should be in the service itself
        }
        if (path.startsWith("/api/cart/")) {
            return role.equals("CUSTOMER") || role.equals("ADMIN");
        }
        if (path.startsWith("/api/orders/")) {
            return role.equals("CUSTOMER") || role.equals("ADMIN");
        }
        if (path.startsWith("/api/payments/")) {
            return role.equals("CUSTOMER") || role.equals("ADMIN");
        }
        if (path.startsWith("/api/inventory/")) {
            // Allow all authenticated users to view inventory (GET requests)
            // Write operations (POST/PUT) should be restricted at service level
            return true;
        }
        if (path.startsWith("/api/users/")) {
            return true; // Users can access their own profile, authorization at service level
        }
        if (path.startsWith("/api/shipping/")) {
            return role.equals("CUSTOMER") || role.equals("ADMIN");
        }

        return true;
    }

    public static class Config {
        // Future customization (e.g., excluded paths)
    }
}
