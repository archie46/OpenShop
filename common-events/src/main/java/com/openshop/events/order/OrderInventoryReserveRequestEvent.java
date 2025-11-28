package com.openshop.events.order;

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
public class OrderInventoryReserveRequestEvent {
    private UUID orderId;
    private Long userId;
    private List<InventoryItem> items;
    private String correlationId;
    private Long timestamp;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryItem {
        private UUID productId;
        private Integer quantity;
    }
}
