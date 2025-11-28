package com.openshop.events.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaymentRequestEvent {
    private UUID orderId;
    private Long userId;
    private Double amount;
    private String correlationId;
    private Long timestamp;
}
