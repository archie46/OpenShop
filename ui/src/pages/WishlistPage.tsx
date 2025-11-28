import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductCard } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingState';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useUIStore } from '@/stores/useUIStore';
import API, { type Product } from '@/api/api';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items, clearWishlist } = useWishlistStore();
  const { showSuccess, showError } = useUIStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlistProducts();
  }, [items]);

  const fetchWishlistProducts = async () => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedProducts = await Promise.all(
        items.map((item) => API.graphql.getProduct(item.productId))
      );
      setProducts(fetchedProducts);
    } catch (error) {
      showError('Failed to load wishlist items');
      console.error('Error fetching wishlist products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearWishlist = () => {
    clearWishlist();
    showSuccess('Wishlist cleared');
  };

  if (loading) {
    return (
      <MainLayout>
        <PageLoading message="Loading your wishlist..." />
      </MainLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <EmptyState
            icon={Heart}
            title="Your Wishlist is Empty"
            description="Save items you love to your wishlist so you can find them easily later."
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            <Button variant="outline" onClick={handleClearWishlist}>
              Clear Wishlist
            </Button>
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Button size="lg" onClick={() => navigate('/products')}>
            <ShoppingBag className="mr-2 h-5 w-5" />
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    </MainLayout>
  );
}
