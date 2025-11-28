package com.openshop.events.constants;

public class KafkaTopics {
    // Order to Payment
    public static final String ORDER_PAYMENT_REQUEST = "order.payment.request";
    public static final String PAYMENT_ORDER_RESPONSE = "payment.order.response";
    public static final String PAYMENT_REFUND_REQUEST = "payment.refund.request";
    
    // Order to Inventory
    public static final String ORDER_INVENTORY_RESERVE_REQUEST = "order.inventory.reserve.request";
    public static final String INVENTORY_ORDER_RESERVE_RESPONSE = "inventory.order.reserve.response";
    public static final String ORDER_INVENTORY_RESTORE_REQUEST = "order.inventory.restore.request";
    
    // Order to Shipping
    public static final String ORDER_SHIPPING_REQUEST = "order.shipping.request";
    public static final String SHIPPING_ORDER_RESPONSE = "shipping.order.response";
    
    // Order to Notification
    public static final String ORDER_NOTIFICATION_REQUEST = "order.notification.request";
    
    // Payment Gateway Webhook
    public static final String PAYMENT_GATEWAY_WEBHOOK = "payment.gateway.webhook";
    
    private KafkaTopics() {
        // Private constructor to prevent instantiation
    }
}
