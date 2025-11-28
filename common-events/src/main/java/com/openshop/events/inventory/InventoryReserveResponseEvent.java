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
public class InventoryReserveResponseEvent {
    private UUID orderId;
    private Long userId;
    private String status; // SUCCESS, FAILED
    private String failureReason;
    private List<ReservedItem> reservedItems;
    private String correlationId;
    private Long timestamp;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservedItem {
        private UUID productId;
        private Integer quantity;
        private boolean reserved;
    }
}
