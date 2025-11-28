package com.openshop.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Allow credentials (cookies, authorization headers, etc.)
        corsConfig.setAllowCredentials(true);
        
        // Allow specific origins (adjust based on your frontend URLs)
        corsConfig.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://*.minikube:*",
            "http://*.minikube.internal:*",
            "http://10.*.*.*:*",
            "http://192.168.*.*:*",
            "http://172.*.*.*:*"
        ));
        
        // Allow all HTTP methods
        corsConfig.setAllowedMethods(Arrays.asList(
            "GET", 
            "POST", 
            "PUT", 
            "DELETE", 
            "PATCH", 
            "OPTIONS", 
            "HEAD"
        ));
        
        // Allow all headers
        corsConfig.setAllowedHeaders(Arrays.asList(
            "Origin",
            "Content-Type",
            "Accept",
            "Authorization",
            "X-Requested-With",
            "X-User-Name",
            "X-User-Role",
            "X-User-Id",
            "X-Gateway","X-Idempotency-Key"
        ));
        
        // Expose headers that the frontend might need to access
        corsConfig.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-User-Name",
            "X-User-Role",
            "X-User-Id",
                "X-Idempotency-Key"
        ));
        
        // Cache preflight response for 1 hour
        corsConfig.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        
        return new CorsWebFilter(source);
    }
}
