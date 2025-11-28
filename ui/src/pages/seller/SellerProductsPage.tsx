import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import API, { type Product } from '@/api/api';
import { Plus, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuthStore } from '@/stores/useAuthStore';

export default function SellerProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify user is a seller
    if (user?.role !== 'SELLER') {
      navigate('/home');
      return;
    }
    
    fetchMyProducts();
  }, [user, navigate]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const myProducts = await API.graphql.getMyProducts();
      setProducts(myProducts);
    } catch (err) {
      setError('Failed to load your products. Please try again.');
      console.error('Error fetching seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    navigate('/seller/products/new');
  };

  const handleProductClick = (productId: string) => {
    navigate(`/seller/products/${productId}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Products</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${products.length} products listed`}
            </p>
          </div>
          <Button
            onClick={handleAddProduct}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Start by adding your first product to the marketplace"
            actionLabel="Add Your First Product"
            onAction={handleAddProduct}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div onClick={() => handleProductClick(product.id)} className="cursor-pointer">
                  <ProductCard product={product} isSellerView />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
