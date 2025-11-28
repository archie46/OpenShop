/**
 * AddToCartButton Component
 * Reusable button to add products to cart using Redux
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/stores/redux/hooks';
import { addToCart } from '@/stores/redux/cartThunks';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  disabled?: boolean;
}

export function AddToCartButton({
  productId,
  quantity = 1,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  disabled = false,
}: AddToCartButtonProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.cart);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    try {
      await dispatch(addToCart({ productId, quantity })).unwrap();
      
      // Show success state briefly
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleAddToCart}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Adding...
        </>
      ) : justAdded ? (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center"
        >
          {showIcon && <Check className="h-4 w-4 mr-2" />}
          Added!
        </motion.div>
      ) : (
        <>
          {showIcon && <ShoppingCart className="h-4 w-4 mr-2" />}
          Add to Cart
        </>
      )}
    </Button>
  );
}

/**
 * Quick Add to Cart Button (Icon Only)
 * Useful for product cards or compact layouts
 */
interface QuickAddButtonProps {
  productId: string;
  quantity?: number;
  disabled?: boolean;
}

export function QuickAddButton({ productId, quantity = 1, disabled = false }: QuickAddButtonProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.cart);
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation();

    try {
      await dispatch(addToCart({ productId, quantity })).unwrap();
      
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleQuickAdd}
      disabled={disabled || loading}
      className="transition-all"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : justAdded ? (
        <motion.div
          initial={{ scale: 0.8, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 0.3 }}
        >
          <Check className="h-4 w-4 text-green-600" />
        </motion.div>
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
    </Button>
  );
}
