package com.openshop.apigateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Filter to log CORS-related issues and blocked requests.
 * Helps diagnose why requests are being blocked due to CORS policy violations.
 */
@Component
public class CorsLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(CorsLoggingFilter.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    
    // Allowed origins (should match CorsConfig)
    private static final List<String> ALLOWED_ORIGIN_PATTERNS = List.of(
        "http://localhost:5173"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        HttpHeaders headers = request.getHeaders();
        
        String origin = headers.getFirst(HttpHeaders.ORIGIN);
        String method = request.getMethod() != null ? request.getMethod().toString() : "UNKNOWN";
        String path = request.getURI().getPath();
        boolean isPreflightRequest = HttpMethod.OPTIONS.equals(request.getMethod());
        
        // Only log if this is a CORS request (has Origin header)
        if (origin != null) {
            boolean isOriginAllowed = checkOriginAllowed(origin);
            
            // Log preflight requests
            if (isPreflightRequest) {
                String requestMethod = headers.getFirst(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD);
                String requestHeaders = headers.getFirst(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS);
                
                logCorsPreflightRequest(origin, path, requestMethod, requestHeaders, isOriginAllowed);
            } else {
                // Log actual CORS requests
                logCorsRequest(origin, method, path, isOriginAllowed);
            }
            
            // Log if origin is blocked
            if (!isOriginAllowed) {
                logCorsBlocked(exchange, origin, method, path, isPreflightRequest);
            }
        }
        
        // Continue with filter chain and check response
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            if (origin != null) {
                ServerHttpResponse response = exchange.getResponse();
                var statusCode = response.getStatusCode();
                
                // Check if response indicates CORS failure
                if (statusCode != null && (statusCode.value() == 403 || statusCode.value() == 401)) {
                    String allowOrigin = response.getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
                    
                    if (allowOrigin == null) {
                        logCorsResponseMissingHeaders(origin, method, path, statusCode.value());
                    }
                }
            }
        }));
    }

    private boolean checkOriginAllowed(String origin) {
        if (origin == null) return false;
        
        // Remove trailing slash for comparison
        String normalizedOrigin = origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin;
        
        for (String allowedPattern : ALLOWED_ORIGIN_PATTERNS) {
            String normalizedPattern = allowedPattern.endsWith("/") 
                ? allowedPattern.substring(0, allowedPattern.length() - 1) 
                : allowedPattern;
            
            if (normalizedOrigin.equals(normalizedPattern)) {
                return true;
            }
        }
        
        return false;
    }

    private void logCorsPreflightRequest(String origin, String path, String requestMethod, 
                                         String requestHeaders, boolean isAllowed) {
        String timestamp = LocalDateTime.now().format(formatter);
        String status = isAllowed ? "✅ ALLOWED" : "🚫 BLOCKED";
        
        StringBuilder logMessage = new StringBuilder();
        logMessage.append("\n╔════════════════════════════════════════════════════════════════════════════════════════╗\n");
        logMessage.append(String.format("║ 🔍 CORS PREFLIGHT REQUEST @ %s%s\n", timestamp, " ".repeat(42 - timestamp.length())));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append(String.format("║ 📍 Path: %-77s ║\n", truncate(path, 77)));
        logMessage.append(String.format("║ 🌐 Origin: %-75s ║\n", truncate(origin, 75)));
        logMessage.append(String.format("║ 🎯 Method: %-75s ║\n", truncate(requestMethod != null ? requestMethod : "N/A", 75)));
        logMessage.append(String.format("║ 📋 Headers: %-74s ║\n", truncate(requestHeaders != null ? requestHeaders : "N/A", 74)));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append(String.format("║ Status: %-77s ║\n", status));
        logMessage.append("╚════════════════════════════════════════════════════════════════════════════════════════╝");
        
        if (isAllowed) {
            log.info(logMessage.toString());
        } else {
            log.warn(logMessage.toString());
        }
    }

    private void logCorsRequest(String origin, String method, String path, boolean isAllowed) {
        String timestamp = LocalDateTime.now().format(formatter);
        String status = isAllowed ? "✅ ALLOWED" : "🚫 BLOCKED";
        
        log.info("🔍 CORS Request @ {} | {} {} | Origin: {} | Status: {}", 
            timestamp, method, path, origin, status);
    }

    private void logCorsBlocked(ServerWebExchange exchange, String origin, String method, 
                               String path, boolean isPreflight) {
        String timestamp = LocalDateTime.now().format(formatter);
        String remoteAddress = getClientIp(exchange.getRequest());
        
        StringBuilder logMessage = new StringBuilder();
        logMessage.append("\n╔════════════════════════════════════════════════════════════════════════════════════════╗\n");
        logMessage.append(String.format("║ 🚫 CORS REQUEST BLOCKED @ %s%s\n", timestamp, " ".repeat(44 - timestamp.length())));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append(String.format("║ ❌ REASON: Origin not in allowed list%s║\n", " ".repeat(49)));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append(String.format("║ Request Type: %-71s ║\n", isPreflight ? "OPTIONS (Preflight)" : method + " (Actual Request)"));
        logMessage.append(String.format("║ 📍 Path: %-77s ║\n", truncate(path, 77)));
        logMessage.append(String.format("║ 🌐 Origin: %-75s ║\n", truncate(origin, 75)));
        logMessage.append(String.format("║ 🔗 Client IP: %-71s ║\n", truncate(remoteAddress, 71)));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append("║ 💡 SOLUTION:                                                                           ║\n");
        logMessage.append("║    Add the origin to allowed list in CorsConfig.java:                                  ║\n");
        logMessage.append(String.format("║    corsConfig.setAllowedOriginPatterns(Arrays.asList(\"%s\"));%s║\n", 
            truncate(origin, 48), " ".repeat(24)));
        logMessage.append("╚════════════════════════════════════════════════════════════════════════════════════════╝");
        
        log.warn(logMessage.toString());
        
        // Also log allowed origins for reference
        logAllowedOrigins();
    }

    private void logCorsResponseMissingHeaders(String origin, String method, String path, int statusCode) {
        String timestamp = LocalDateTime.now().format(formatter);
        
        StringBuilder logMessage = new StringBuilder();
        logMessage.append("\n╔════════════════════════════════════════════════════════════════════════════════════════╗\n");
        logMessage.append(String.format("║ ⚠️  CORS HEADERS MISSING @ %s%s\n", timestamp, " ".repeat(45 - timestamp.length())));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append(String.format("║ Response Status: %-70s ║\n", statusCode));
        logMessage.append(String.format("║ 📍 Path: %-77s ║\n", truncate(path, 77)));
        logMessage.append(String.format("║ 🌐 Origin: %-75s ║\n", truncate(origin, 75)));
        logMessage.append(String.format("║ 🎯 Method: %-75s ║\n", method));
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        logMessage.append("║ ❌ ISSUE: Access-Control-Allow-Origin header missing in response                       ║\n");
        logMessage.append("║ 💡 This may indicate the backend service is blocking the request before CORS headers   ║\n");
        logMessage.append("║    can be added, or there's a configuration issue with the CORS filter.                ║\n");
        logMessage.append("╚════════════════════════════════════════════════════════════════════════════════════════╝");
        
        log.warn(logMessage.toString());
    }

    private void logAllowedOrigins() {
        StringBuilder logMessage = new StringBuilder();
        logMessage.append("\n╔════════════════════════════════════════════════════════════════════════════════════════╗\n");
        logMessage.append("║ 📋 CURRENTLY ALLOWED ORIGINS:                                                          ║\n");
        logMessage.append("╠════════════════════════════════════════════════════════════════════════════════════════╣\n");
        
        for (String pattern : ALLOWED_ORIGIN_PATTERNS) {
            logMessage.append(String.format("║    ✓ %-82s ║\n", truncate(pattern, 82)));
        }
        
        logMessage.append("╚════════════════════════════════════════════════════════════════════════════════════════╝");
        
        log.warn(logMessage.toString());
    }

    private String getClientIp(ServerHttpRequest request) {
        HttpHeaders headers = request.getHeaders();
        
        String ip = headers.getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = headers.getFirst("X-Real-IP");
        }
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddress() != null 
                ? request.getRemoteAddress().getAddress().getHostAddress() 
                : "UNKNOWN";
        }
        
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip;
    }

    private String truncate(String str, int maxLength) {
        if (str == null) return "N/A";
        if (str.length() <= maxLength) return str;
        return str.substring(0, maxLength - 3) + "...";
    }

    @Override
    public int getOrder() {
        // Execute very early to catch CORS issues before other filters
        return -2;
    }
}
