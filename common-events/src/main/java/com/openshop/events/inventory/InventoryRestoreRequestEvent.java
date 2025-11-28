package com.openshop.events.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryRestoreRequestEvent {
    private UUID orderId;
    private Long userId;
    private List<RestoreItem> items;
    private String reason; // PAYMENT_FAILED, SHIPPING_FAILED, ORDER_CANCELLED
    private String correlationId;
    private Long timestamp;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RestoreItem {
        private UUID productId;
        private Integer quantity;
    }
}
