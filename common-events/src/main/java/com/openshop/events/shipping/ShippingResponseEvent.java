package com.openshop.events.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingResponseEvent {
    private UUID orderId;
    private Long userId;
    private UUID shipmentId;
    private String status; // SUCCESS, FAILED
    private String trackingNumber;
    private String carrier;
    private String estimatedDeliveryDate;
    private String failureReason;
    private String correlationId;
    private Long timestamp;
}
