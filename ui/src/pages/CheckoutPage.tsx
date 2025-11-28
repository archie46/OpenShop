import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { AddressForm, type Address } from '@/components/checkout/AddressForm';
import { PaymentForm, type PaymentInfo } from '@/components/checkout/PaymentForm';
import { ReviewOrder } from '@/components/checkout/ReviewOrder';
import { useAppSelector, useAppDispatch } from '@/stores/redux/hooks';
import { clearCart as clearCartThunk, fetchCart } from '@/stores/redux/cartThunks';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import API, { type CreateOrderRequest } from '@/api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ShoppingCart } from 'lucide-react';

type CheckoutStep = 'address' | 'payment' | 'review';

const steps = [
  { id: 'address', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuthStore();
  const { cart } = useAppSelector((state) => state.cart);
  const { addOrder } = useOrderStore();
  const { showSuccess, showError } = useUIStore();

  const cartItems = cart?.items || [];

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [address, setAddress] = useState<Address | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch cart on mount
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  if (cartItems.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <EmptyState
            icon={ShoppingCart}
            title="Your Cart is Empty"
            description="Add items to your cart before proceeding to checkout."
            actionLabel="Browse Products"
            onAction={() => navigate('/products')}
          />
        </div>
      </MainLayout>
    );
  }

  const handleAddressSubmit = (addressData: Address) => {
    setAddress(addressData);
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = (paymentData: PaymentInfo) => {
    setPayment(paymentData);
    setCurrentStep('review');
  };

  const handlePlaceOrder = async () => {
    if (!address || !payment || !user) return;

    try {
      setLoading(true);

      const fullAddress = `${address.addressLine1}${
      address.addressLine2 ? ', ' + address.addressLine2 : ''
      }, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;

      // Create order via cart checkout
      const orderRequest: CreateOrderRequest = {
        shippingAddress: fullAddress,
        city: address.city,
        state: address.state,
        zipCode: address.postalCode,
        country: address.country,
        phoneNumber: address.phoneNumber,
      };

      // Generate idempotency key to prevent duplicate orders
      const idempotencyKey = `order-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      const order = await API.orders.create(orderRequest, idempotencyKey)


      // Add order to store
      addOrder(order);

      // Clear cart
      await dispatch(clearCartThunk()).unwrap();

      showSuccess('Order placed successfully!');
      
      // Navigate to success page
      navigate(`/orders/success/${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      showError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (step: CheckoutStep) => {
    return steps.findIndex((s) => s.id === step);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase</p>
        </motion.div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = getStepIndex(currentStep) > index;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center relative">
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? 'bg-primary border-primary text-white'
                          : isActive
                          ? 'border-primary text-primary'
                          : 'border-muted text-muted-foreground'
                      }`}
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </motion.div>
                    <span
                      className={`text-sm mt-2 absolute top-12 whitespace-nowrap ${
                        isActive ? 'font-semibold' : ''
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-4 bg-muted relative top-[-20px]">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{
                          width: isCompleted ? '100%' : '0%',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-16">
          <AnimatePresence mode="wait">
            {currentStep === 'address' && (
              <AddressForm
                key="address"
                onSubmit={handleAddressSubmit}
                initialData={address || undefined}
              />
            )}

            {currentStep === 'payment' && address && (
              <PaymentForm
                key="payment"
                onSubmit={handlePaymentSubmit}
                onBack={() => setCurrentStep('address')}
                totalAmount={cartItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                )}
              />
            )}

            {currentStep === 'review' && address && payment && (
              <ReviewOrder
                key="review"
                address={address}
                payment={payment}
                cartItems={cartItems}
                onEditAddress={() => setCurrentStep('address')}
                onEditPayment={() => setCurrentStep('payment')}
                onConfirm={handlePlaceOrder}
                loading={loading}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
