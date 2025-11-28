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
public class OrderShippingRequestEvent {
    private UUID orderId;
    private Long userId;
    private String shippingAddress;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String phoneNumber;
    private Double orderAmount;
    private String correlationId;
    private Long timestamp;
}
