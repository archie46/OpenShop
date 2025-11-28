import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/shared/LoadingState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import API, { type Order, type Shipment } from '@/api/api';
import {
  Package,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig: Record<Order['status'], { color: string; icon: React.ComponentType<any>; label: string }> = {
  PENDING: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
  PAYMENT_INITIATED: { color: 'bg-orange-500', icon: Clock, label: 'Payment Initiated' },
  CONFIRMED: { color: 'bg-blue-500', icon: CheckCircle, label: 'Confirmed' },
  SHIPPED: { color: 'bg-purple-500', icon: Truck, label: 'Shipped' },
  DELIVERED: { color: 'bg-green-500', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'bg-red-500', icon: XCircle, label: 'Cancelled' },
};

const shipmentStatusConfig = {
  PENDING: { label: 'Preparing', icon: Package },
  IN_TRANSIT: { label: 'In Transit', icon: Truck },
  DELIVERED: { label: 'Delivered', icon: CheckCircle },
  RETURNED: { label: 'Returned', icon: XCircle },
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { updateOrderStatus } = useOrderStore();
  const { showSuccess, showError } = useUIStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const orderData = await API.orders.getById(orderId);
      setOrder(orderData);

      // Fetch shipment info
      try {
        const shipmentData = await API.shipping.getByOrderId(orderId);
        setShipment(shipmentData);
      } catch (error) {
        // Shipment might not exist yet
        console.log('No shipment found yet');
      }
    } catch (error) {
      showError('Failed to load order details');
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;

    try {
      setCancelling(true);
      await API.orders.cancelOrder(orderId);
      updateOrderStatus(orderId, 'CANCELLED');
      setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      showSuccess('Order cancelled successfully');
      setCancelDialogOpen(false);
    } catch (error) {
      showError('Failed to cancel order');
      console.error('Error cancelling order:', error);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <PageLoading message="Loading order details..." />
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The order you're looking for doesn't exist or you don't have permission to
              view it.
            </p>
            <Button onClick={() => navigate('/orders')}>View All Orders</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const StatusIcon = statusConfig[order.status].icon;
  const canCancel = order.status === 'PENDING' || order.status === 'PAYMENT_INITIATED' || order.status === 'CONFIRMED';

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Order Details</h1>
              <p className="text-muted-foreground">Order #{order.id}</p>
            </div>
            <Badge
              className={`${statusConfig[order.status].color} text-white text-lg px-4 py-2`}
            >
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusConfig[order.status].label}
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.productName || `Product #${item.productId.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {order.currency} {item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {order.currency} {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                    {index < order.items.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipment Tracking */}
            {shipment && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Shipment Tracking</h2>
                  <Badge variant="outline">
                    {shipmentStatusConfig[shipment.status]?.label || shipment.status}
                  </Badge>
                </div>

                {shipment.trackingNumber && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                    <p className="font-mono font-semibold">{shipment.trackingNumber}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-4">
                  {[
                    { status: 'PENDING', label: 'Order Placed' },
                    { status: 'IN_TRANSIT', label: 'Shipped' },
                    { status: 'DELIVERED', label: 'Delivered' },
                  ].map((step, index) => {
                    const isCompleted =
                      shipment.status === 'DELIVERED' ||
                      (shipment.status === 'IN_TRANSIT' && step.status !== 'DELIVERED');
                    const isCurrent = shipment.status === step.status;

                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCompleted || isCurrent
                                ? 'bg-primary text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-current" />
                            )}
                          </div>
                          {index < 2 && (
                            <div
                              className={`w-0.5 h-12 ${
                                isCompleted ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <p className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-muted-foreground">
                              {new Date(shipment.updatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Shipping Address */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Delivery Address</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{shipment.address}</p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Date</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">{order.currency} {order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/products')}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Order Again
                </Button>
                {canCancel && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </Card>

            {/* Help */}
            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Have questions about your order? Our support team is here to help.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>

        {/* Cancel Order Dialog */}
        <ConfirmDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          title="Cancel Order"
          description="Are you sure you want to cancel this order? This action cannot be undone."
          confirmText="Yes, Cancel Order"
          cancelText="No, Keep Order"
          variant="destructive"
          onConfirm={handleCancelOrder}
          loading={cancelling}
        />
      </div>
    </MainLayout>
  );
}
