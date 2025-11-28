package com.openshop.events.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderNotificationRequestEvent {
    private UUID orderId;
    private Long userId;
    private String userEmail;
    private String notificationType; // ORDER_CONFIRMED, ORDER_SHIPPED, ORDER_CANCELLED
    private String orderStatus;
    private Double orderAmount;
    private String message;
    private String correlationId;
    private Long timestamp;
}
