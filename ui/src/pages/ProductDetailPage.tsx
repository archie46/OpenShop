import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import API, { type Product, type Inventory } from '@/api/api';
import { Heart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { motion } from 'framer-motion';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const availableQuantity = inventory ? inventory.quantity - (inventory.reservedQuantity ?? 0) : 0;
  const isOutOfStock = inventory !== null && availableQuantity <= 0;

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await API.graphql.getProduct(id);
      setProduct(data);
      
      // Fetch inventory after product is loaded
      await fetchInventory(id);
    } catch (err) {
      setError('Failed to load product. Please try again.');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (productId: string) => {
    try {
      setLoadingInventory(true);
      const inv = await API.inventory.getByProductId(productId);
      setInventory(inv);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setInventory(null);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      if (isWishlisted) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product.id);
      }
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const incrementQuantity = () => {
    // Don't allow adding more than available quantity
    // If inventory is not loaded yet, allow increment up to a reasonable limit (e.g., 10)
    const maxQuantity = inventory !== null ? availableQuantity : 10;
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-xl text-destructive mb-4">
              {error || 'Product not found'}
            </p>
            <Button onClick={() => navigate('/products')}>
              Back to Products
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
        >
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Status */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="uppercase">
                {product.category}
              </Badge>
              {(isOutOfStock || product.status !== 'ACTIVE') && (
                <Badge
                  variant={isOutOfStock ? 'destructive' : 'secondary'}
                >
                  {isOutOfStock ? 'OUT OF STOCK' : product.status.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>

            {/* Price */}
            <div className="text-3xl lg:text-4xl font-bold text-primary">
              {product.currency} {product.price.toFixed(2)}
            </div>

            {/* Description */}
            <div className="prose max-w-none">
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* SKU & Stock Info */}
            <div className="space-y-1">
              {product.sku && (
                <p className="text-sm text-muted-foreground">
                  SKU: <span className="font-mono">{product.sku}</span>
                </p>
              )}
              {inventory && !loadingInventory && (
                <p className="text-sm font-medium">
                  {isOutOfStock ? (
                    <span className="text-destructive">Out of Stock</span>
                  ) : (
                    <span className="text-green-600">
                      {availableQuantity} {availableQuantity === 1 ? 'item' : 'items'} available
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1 || loadingInventory || availableQuantity === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={loadingInventory || availableQuantity === 0 || (inventory !== null && quantity >= availableQuantity)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <AddToCartButton
                productId={product.id}
                quantity={quantity}
                variant="default"
                size="lg"
                className="flex-1"
                disabled={availableQuantity === 0 || product.status !== 'ACTIVE' || loadingInventory}
              />
              <Button
                variant="outline"
                size="lg"
                onClick={handleToggleWishlist}
              >
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Availability:</span>
                <span className="font-medium">
                  {availableQuantity === 0 ? (
                    <span className="text-destructive">Out of Stock</span>
                  ) : availableQuantity > 0 && product.status === 'ACTIVE' ? (
                    <span className="text-green-600">In Stock ({availableQuantity} available)</span>
                  ) : (
                    product.status.replace('_', ' ')
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium capitalize">{product.category}</span>
              </div>
              {product.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listed:</span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Additional Sections */}
        <div className="mt-16 space-y-8">
          {/* Product Details */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Product Details</h2>
            <div className="prose max-w-none">
              <p className="text-muted-foreground">
                {product.description || 'No additional details available.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
