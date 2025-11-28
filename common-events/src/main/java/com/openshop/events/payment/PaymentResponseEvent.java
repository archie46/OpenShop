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
public class PaymentResponseEvent {
    private UUID orderId;
    private Long userId;
    private String transactionId;
    private String status; // SUCCESS, FAILED
    private Double amount;
    private String paymentMethod;
    private String failureReason;
    private String correlationId;
    private Long timestamp;
}
