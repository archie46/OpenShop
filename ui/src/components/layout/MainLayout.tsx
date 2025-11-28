import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, Search, Menu, X, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppSelector } from '@/stores/redux/hooks';
import API from '@/api/api';
import MuiMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

interface MainLayoutProps {
  children: ReactNode;
}

const CATEGORIES = [
  { name: 'Electronics', value: 'electronics' },
  { name: 'Clothing', value: 'clothing' },
  { name: 'Home', value: 'home' },
  { name: 'Sports', value: 'sports' },
  { name: 'Books', value: 'books' },
  { name: 'Toys', value: 'toys' },
  { name: 'Beauty', value: 'beauty' },
  { name: 'Food', value: 'food' },
];

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { cart } = useAppSelector((state) => state.cart);
  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [categoriesMenuAnchor, setCategoriesMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    API.auth.logout();
    clearAuth();
    setProfileMenuAnchor(null);
    navigate('/');
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleCategoriesMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCategoriesMenuAnchor(event.currentTarget);
  };

  const handleCategoriesMenuClose = () => {
    setCategoriesMenuAnchor(null);
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${category}`);
    setCategoriesMenuAnchor(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
              >
                OpenShop
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
    {user?.role !== 'SELLER' && (
      <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/products')}
                >
                  Products
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCategoriesMenuOpen}
                  className="flex items-center gap-1"
                >
                  Categories
                  <ChevronDown className="h-4 w-4" />
                </Button>



                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    Admin
                  </Button>
                )}
              </nav>

              {/* Categories Menu */}
              <MuiMenu
                anchorEl={categoriesMenuAnchor}
                open={Boolean(categoriesMenuAnchor)}
                onClose={handleCategoriesMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                {CATEGORIES.map((category) => (
                  <MenuItem
                    key={category.value}
                    onClick={() => handleCategoryClick(category.value)}
                  >
                    {category.name}
                  </MenuItem>
                ))}
              </MuiMenu>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              {user?.role === 'CUSTOMER' ? <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button> : null}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={handleProfileMenuOpen}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                    aria-label="User profile"
                  >
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </button>
                  
                  <MuiMenu
                    anchorEl={profileMenuAnchor}
                    open={Boolean(profileMenuAnchor)}
                    onClose={handleProfileMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        navigate('/profile');
                        handleProfileMenuClose();
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </MenuItem>
                    {user?.role === 'CUSTOMER' ? <MenuItem
                      onClick={() => {
                        navigate('/orders');
                        handleProfileMenuClose();
                      }}
                    >
                      My Orders
                    </MenuItem> : null}
                    <MenuItem onClick={handleLogout}>
                      Logout
                    </MenuItem>
                  </MuiMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  navigate('/products');
                  setMobileMenuOpen(false);
                }}
              >
                Products
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  navigate('/categories');
                  setMobileMenuOpen(false);
                }}
              >
                Categories
              </Button>
              {user?.role === 'ADMIN' && (
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    navigate('/admin/dashboard');
                    setMobileMenuOpen(false);
                  }}
                >
                  Admin
                </Button>
              )}
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      navigate('/profile');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      navigate('/orders');
                      setMobileMenuOpen(false);
                    }}
                  >
                    My Orders
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="justify-start"
                    onClick={() => {
                      navigate('/register');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">OpenShop</h3>
              <p className="text-sm text-muted-foreground">
                Your trusted online marketplace for quality products.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => navigate('/seller/products')} className="hover:text-foreground">
                    All Products
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => navigate('/profile')} className="hover:text-foreground">
                    My Profile
                  </button>
                </li>
                {user?.role === 'CUSTOMER' ? <li>
                  <button onClick={() => navigate('/orders')} className="hover:text-foreground">
                    Orders
                  </button>
                </li> : null}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button className="hover:text-foreground">Help Center</button>
                </li>
                <li>
                  <button className="hover:text-foreground">Contact Us</button>
                </li>
                <li>
                  <button className="hover:text-foreground">Shipping Info</button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 OpenShop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
