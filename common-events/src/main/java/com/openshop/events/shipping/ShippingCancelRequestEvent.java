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
public class ShippingCancelRequestEvent {
    private UUID orderId;
    private Long userId;
    private UUID shipmentId;
    private String reason; // ORDER_CANCELLED, PAYMENT_FAILED, INVENTORY_FAILED
    private String correlationId;
    private Long timestamp;
}
