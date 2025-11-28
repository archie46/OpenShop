import { useState, useEffect } from 'react';
import API, { type Product, type Inventory } from '@/api/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router';
import { QuickAddButton } from '@/components/cart/AddToCartButton';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  isSellerView?: boolean;
}

export function ProductCard({ product, isSellerView = false }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Fetch inventory when component mounts
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoadingInventory(true);
        const inv = await API.inventory.getByProductId(product.id);
        setInventory(inv);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        // If inventory fetch fails, assume out of stock to be safe
        setInventory(null);
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [product.id]);

  const availableQuantity = inventory ? inventory.quantity - inventory.reservedQuantity : 0;
  const isOutOfStock = availableQuantity <= 0;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          
          {/* Status Badge */}
          {(product.status !== 'ACTIVE' || isOutOfStock) && (
            <Badge
              variant={product.status === 'OUT_OF_STOCK' || isOutOfStock ? 'destructive' : 'secondary'}
              className="absolute top-2 left-2"
            >
              {isOutOfStock ? 'OUT OF STOCK' : product.status.replace('_', ' ')}
            </Badge>
          )}

          {/* Wishlist Button - Only show for customers */}
          {!isSellerView && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleToggleWishlist}
            >
              <Heart
                className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.category}
          </p>

          {/* Name */}
          <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price & Add to Cart / Edit Button */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-2xl font-bold">
                {product.currency} {product.price.toFixed(2)}
              </p>
              {!isSellerView && inventory && !loadingInventory && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isOutOfStock ? 'Out of stock' : `${availableQuantity} available`}
                </p>
              )}
            </div>
            {!isSellerView && (
              <QuickAddButton
                productId={product.id}
                quantity={1}
                disabled={isOutOfStock || loadingInventory}
              />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
