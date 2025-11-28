import { BrowserRouter, Routes, Route } from 'react-router';
import App from './App.tsx';
import SignupPage from '@/pages/SignupPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import HomePage from './pages/HomePage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import ProductDetailPage from './pages/ProductDetailPage.tsx';
import CartPage from './pages/CartPage.tsx';
import WishlistPage from './pages/WishlistPage.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import OrderSuccessPage from './pages/OrderSuccessPage.tsx';
import OrdersPage from './pages/OrdersPage.tsx';
import OrderDetailPage from './pages/OrderDetailPage.tsx';
import SellerProductsPage from './pages/seller/SellerProductsPage.tsx';
import ProductFormPage from './pages/seller/ProductFormPage.tsx';
import { ToastContainer } from '@/components/shared/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AppWrapper() {
  const { toasts, removeToast } = useUIStore();

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<App />} />
          <Route path="/register" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders/success/:orderId" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          
          {/* Seller Routes - Protected */}
          <Route path="/seller/products" element={<ProtectedRoute><SellerProductsPage /></ProtectedRoute>} />
          <Route path="/seller/products/new" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
          <Route path="/seller/products/:productId" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
