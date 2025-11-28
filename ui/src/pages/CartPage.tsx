import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/stores/redux/hooks';
import {
  fetchCart,
  removeFromCart,
  clearCart as clearCartThunk,
} from '@/stores/redux/cartThunks';
import API, { type Product, type CartItem } from '@/api/api';
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface CartItemWithProduct extends CartItem {
  product?: Product;
}

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cart, loading, error } = useAppSelector((state) => state.cart);
  const [cartItemsWithProducts, setCartItemsWithProducts] = useState<CartItemWithProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch cart on mount or route change
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  // Fetch product details whenever cart items change
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!cart?.items || cart.items.length === 0) {
        setCartItemsWithProducts([]);
        return;
      }

      setLoadingProducts(true);
      const itemsWithProducts = await Promise.all(
        cart.items.map(async (item) => {
          try {
            const product = await API.graphql.getProduct(item.productId);
            return { ...item, product };
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}:`, error);
            return item;
          }
        })
      );
      setCartItemsWithProducts(itemsWithProducts);
      setLoadingProducts(false);
    };

    fetchProductDetails();
  }, [cart?.items]);

  const handleUpdateQuantity = (
    productId: string,
    delta: number
  ) => {
    // Use delta directly - positive to add, negative to remove
    dispatch(removeFromCart({ productId, quantity: delta }));
  };

  const handleRemoveItem = (productId: string, currentQuantity: number) => {
    if (confirm('Remove this item from your cart?')) {
      // Pass negative quantity to remove all items of this product
      dispatch(removeFromCart({ productId, quantity: -currentQuantity }));
    }
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCartThunk());
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Calculate totals from backend data
  const total = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Show loading state
  if (loading || loadingProducts) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading cart...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          <Card className="p-8">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">Error loading cart</p>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => dispatch(fetchCart())}>Try Again</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show empty cart state
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some products to get started!
            </p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <Button variant="ghost" onClick={handleClearCart} disabled={loading}>
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItemsWithProducts.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => navigate(`/products/${item.productId}`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold mb-1 cursor-pointer hover:text-primary truncate"
                        onClick={() => navigate(`/products/${item.productId}`)}
                      >
                        {item.product?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 capitalize">
                        {item.product?.category || ''}
                      </p>
                      <p className="font-bold">
                        {item.product?.currency || 'USD'} {item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.productId, item.quantity)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleUpdateQuantity(item.productId, -1)
                          }
                          disabled={loading}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleUpdateQuantity(item.productId, 1)
                          }
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <p className="text-sm font-semibold">
                        Subtotal: {item.product?.currency || 'INR'}{' '}
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items ({itemCount})</span>
                  <span>USD {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>FREE</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span>USD {total.toFixed(2)}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                Proceed to Checkout
              </Button>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
