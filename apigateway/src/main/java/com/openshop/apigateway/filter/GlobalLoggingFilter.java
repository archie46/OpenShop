package com.openshop.apigateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR;

/**
 * Global logging filter for API Gateway that logs all incoming requests
 * with routing information, user details, and service endpoints.
 */
@Component
public class GlobalLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(GlobalLoggingFilter.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // Capture start time
        long startTime = System.currentTimeMillis();
        String timestamp = LocalDateTime.now().format(formatter);

        // Extract routing information
        Route route = exchange.getAttribute(GATEWAY_ROUTE_ATTR);
        String routeId = route != null ? route.getId() : "UNKNOWN";
        URI targetUri = route != null ? route.getUri() : null;
        
        // Extract service information from target URI
        String serviceName = extractServiceName(routeId);
        String serviceHost = targetUri != null ? targetUri.getHost() : "UNKNOWN";
        int servicePort = targetUri != null ? targetUri.getPort() : -1;

        // Extract user information from headers (set by JWT filter)
        String username = request.getHeaders().getFirst("X-User-Name");
        String userId = request.getHeaders().getFirst("X-User-Id");
        String userRole = request.getHeaders().getFirst("X-User-Role");

        // Request details
        String method = request.getMethod().toString();
        String path = request.getURI().getPath();
        String query = request.getURI().getQuery();
        String fullPath = query != null ? path + "?" + query : path;
        String remoteAddress = getClientIp(request);

        // Check if this is an authentication request
        boolean isAuthRequest = path.contains("/api/auth/");
        
        // Build log message
        StringBuilder logMessage = new StringBuilder();
        logMessage.append("\n╔════════════════════════════════════════════════════════════════════════════════════════╗\n");
        logMessage.append(String.format("║ 🌐 INCOMING REQUEST @ %s%s\n", timestamp, " ".repeat(48 - timestamp.length())));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append(String.format("║ 📍 Request: %-74s ║\n", method + " " + truncate(fullPath, 65)));
        logMessage.append(String.format("║ 🔗 Client IP: %-71s ║\n", truncate(remoteAddress, 71)));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append(String.format("║ 🎯 Route ID: %-72s ║\n", truncate(routeId, 72)));
        logMessage.append(String.format("║ 🏢 Service: %-73s ║\n", truncate(serviceName, 73)));
        logMessage.append(String.format("║ 🖥️  Target: %-74s ║\n", truncate(serviceHost + ":" + servicePort, 74)));
        
        if (isAuthRequest) {
            logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
            logMessage.append("║ 🔐 Auth Request: User authentication/registration in progress                         ║\n");
        } else if (username != null) {
            logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
            logMessage.append(String.format("║ 👤 User: %-76s ║\n", truncate(username, 76)));
            logMessage.append(String.format("║ 🆔 User ID: %-73s ║\n", truncate(userId != null ? userId : "N/A", 73)));
            logMessage.append(String.format("║ 🎭 Role: %-76s ║\n", truncate(userRole != null ? userRole : "N/A", 76)));
        } else {
            logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
            logMessage.append("║ 🔓 Public Request: No authentication required                                          ║\n");
        }
        
        logMessage.append("╚════════════════════════════════════════════════════════════════════════════════════════╝");

        log.info(logMessage.toString());

        // Continue with the filter chain and log response
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            long duration = System.currentTimeMillis() - startTime;
            int statusCode = exchange.getResponse().getStatusCode() != null 
                ? exchange.getResponse().getStatusCode().value() 
                : 0;

            String statusEmoji = getStatusEmoji(statusCode);
            
            log.info("║ {} Response: {} {} | Duration: {}ms | Service: {} | User: {}", 
                statusEmoji,
                statusCode,
                getStatusText(statusCode),
                duration,
                serviceName,
                username != null ? username : (isAuthRequest ? "AUTH_IN_PROGRESS" : "PUBLIC"));
        }));
    }

    private String extractServiceName(String routeId) {
        if (routeId == null) return "UNKNOWN";
        
        // Extract service name from route ID
        if (routeId.contains("user-service")) return "USER-SERVICE";
        if (routeId.contains("product-service")) return "PRODUCT-SERVICE";
        if (routeId.contains("order-service")) return "ORDER-SERVICE";
        if (routeId.contains("cart-service")) return "CART-SERVICE";
        if (routeId.contains("inventory-service")) return "INVENTORY-SERVICE";
        if (routeId.contains("payment-service")) return "PAYMENT-SERVICE";
        if (routeId.contains("shipping-service")) return "SHIPPING-SERVICE";
        
        return routeId.toUpperCase();
    }

    private String getClientIp(ServerHttpRequest request) {
        HttpHeaders headers = request.getHeaders();
        
        // Check common proxy headers
        String ip = headers.getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = headers.getFirst("X-Real-IP");
        }
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddress() != null 
                ? request.getRemoteAddress().getAddress().getHostAddress() 
                : "UNKNOWN";
        }
        
        // If X-Forwarded-For contains multiple IPs, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip;
    }

    private String getStatusEmoji(int statusCode) {
        if (statusCode >= 200 && statusCode < 300) return "✅";
        if (statusCode >= 300 && statusCode < 400) return "↪️";
        if (statusCode >= 400 && statusCode < 500) return "⚠️";
        if (statusCode >= 500) return "❌";
        return "❓";
    }

    private String getStatusText(int statusCode) {
        if (statusCode >= 200 && statusCode < 300) return "SUCCESS";
        if (statusCode >= 300 && statusCode < 400) return "REDIRECT";
        if (statusCode == 401) return "UNAUTHORIZED";
        if (statusCode == 403) return "FORBIDDEN";
        if (statusCode == 404) return "NOT_FOUND";
        if (statusCode >= 400 && statusCode < 500) return "CLIENT_ERROR";
        if (statusCode >= 500) return "SERVER_ERROR";
        return "UNKNOWN";
    }

    private String truncate(String str, int maxLength) {
        if (str == null) return "N/A";
        if (str.length() <= maxLength) return str;
        return str.substring(0, maxLength - 3) + "...";
    }

    @Override
    public int getOrder() {
        // Execute before JWT filter (which has default order)
        return -1;
    }
}
