import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingState';
import { useOrderStore } from '@/stores/useOrderStore';
import API, { type Order } from '@/api/api';
import { Package, ChevronRight, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<Order['status'], string> = {
  PENDING: 'bg-yellow-500',
  PAYMENT_INITIATED: 'bg-orange-500',
  CONFIRMED: 'bg-blue-500',
  SHIPPED: 'bg-purple-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

const statusLabels: Record<Order['status'], string> = {
  PENDING: 'Pending',
  PAYMENT_INITIATED: 'Payment Initiated',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, setOrders } = useOrderStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Order['status'] | 'ALL'>('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await API.orders.getUserOrders();
      setOrders(response || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Don't show error for empty orders, just set empty array
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <MainLayout>
        <PageLoading message="Loading your orders..." />
      </MainLayout>
    );
  }

  if (orders.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <EmptyState
            icon={Package}
            title="No Orders Yet"
            description="You haven't placed any orders yet. Start shopping to see your orders here."
            actionLabel="Browse Products"
            onAction={() => navigate('/products')}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['ALL', 'PENDING', 'PAYMENT_INITIATED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status as Order['status'] | 'ALL')}
              className="whitespace-nowrap"
            >
              {status === 'ALL' ? 'All Orders' : statusLabels[status as Order['status']]}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No orders with this status</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Order Header */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                        </div>
                        <Badge
                          className={`${statusColors[order.status]} text-white`}
                        >
                          {statusLabels[order.status]}
                        </Badge>
                      </div>

                      {/* Order Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {order.currency} {order.totalPrice?.toFixed(2) || '0.00'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
