package com.openshop.events.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRefundRequestEvent {
    private UUID orderId;
    private Long userId;
    private String transactionId;
    private Double amount;
    private String reason; // INVENTORY_FAILED, SHIPPING_FAILED, ORDER_CANCELLED
    private String correlationId;
    private Long timestamp;
}
