import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Redirect sellers to their products page
  useEffect(() => {
    if (user?.role === 'SELLER') {
      navigate('/seller/products');
    }
  }, [user, navigate]);

  const categories = [
    { name: 'Electronics', icon: '📱', color: 'from-blue-500 to-cyan-600', items: '2.5k+' },
    { name: 'Fashion', icon: '👕', color: 'from-purple-500 to-pink-600', items: '3.2k+' },
    { name: 'Home & Garden', icon: '🏠', color: 'from-green-500 to-emerald-600', items: '1.8k+' },
    { name: 'Sports', icon: '⚽', color: 'from-orange-500 to-red-600', items: '1.5k+' },
    { name: 'Books', icon: '📚', color: 'from-red-500 to-rose-600', items: '4.1k+' },
    { name: 'Toys & Games', icon: '🎮', color: 'from-pink-500 to-fuchsia-600', items: '2.0k+' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <MainLayout>
      {/* Simple Hero Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to OpenShop
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Start shopping from thousands of products
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/products')}
              className="group"
            >
              Browse Products
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Shop by Category</h2>
            <p className="text-muted-foreground">
              Explore our wide range of products
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          >
            {categories.map((category) => (
              <motion.div
                key={category.name}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => navigate('/products')}
                className="cursor-pointer group"
              >
                <Card className="relative overflow-hidden p-6 md:p-8 border-2 hover:border-primary transition-all duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-4 text-4xl md:text-5xl shadow-lg group-hover:shadow-xl transition-all`}>
                      {category.icon}
                    </div>
                    <h3 className="font-bold text-lg md:text-xl mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {category.items} items
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
