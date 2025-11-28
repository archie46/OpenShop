import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, Package, Edit, Loader2 } from 'lucide-react';
import { type Address } from './AddressForm';
import { type PaymentInfo } from './PaymentForm';
import { type CartItem } from '@/api/api';

interface ReviewOrderProps {
  address: Address;
  payment: PaymentInfo;
  cartItems: CartItem[];
  onEditAddress: () => void;
  onEditPayment: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function ReviewOrder({
  address,
  payment,
  cartItems,
  onEditAddress,
  onEditPayment,
  onConfirm,
  loading = false,
}: ReviewOrderProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Order Items */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Order Review</h2>
            <p className="text-sm text-muted-foreground">
              Review your order before placing it
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {cartItems.map((item, index) => (
            <div key={item.id || index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Product #{item.productId.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
              </div>
              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Shipping Address */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Shipping Address</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditAddress}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p className="font-medium text-foreground">{address.fullName}</p>
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p>{address.country}</p>
          <p className="pt-2">{address.phoneNumber}</p>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Payment Method</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onEditPayment}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p className="font-medium text-foreground">{payment.cardHolder}</p>
          <p>**** **** **** {payment.cardNumber.slice(-4)}</p>
          <p>Expires: {payment.expiryDate}</p>
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {shipping === 0 ? (
                <Badge variant="secondary" className="text-xs">
                  FREE
                </Badge>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Place Order Button */}
      <Button
        size="lg"
        className="w-full text-lg py-6"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Order...
          </>
        ) : (
          <>
            Place Order - ${total.toFixed(2)}
          </>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-center text-muted-foreground">
        By placing your order, you agree to our{' '}
        <a href="#" className="underline hover:text-primary">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline hover:text-primary">
          Privacy Policy
        </a>
      </p>
    </motion.div>
  );
}
