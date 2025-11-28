import * as React from 'react';
import { useNavigate } from 'react-router';
import { Menu, Heart, ShoppingCart, ChevronDown, Plus } from 'lucide-react';
import API from '@/api/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppSelector } from '@/stores/redux/hooks';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MobileMenu,
  MobileMenuContent,
  MobileMenuItem,
  MobileMenuTrigger,
} from '@/components/ui/mobile-menu';
import { cn } from '@/lib/utils';

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

const getSettingsForUser = (userRole?: string) => {
  const baseSettings = ['Profile'];
  if (userRole !== 'SELLER') {
    baseSettings.push('My Orders');
  }
  baseSettings.push('Logout');
  return baseSettings;
};

function ResponsiveAppBar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const { cart } = useAppSelector((state) => state.cart);
  const { items: wishlistItems } = useWishlistStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistItemCount = wishlistItems.length;

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${category}`);
  };

  const handleMenuItemClick = (setting: string) => {
    switch (setting) {
      case 'Profile':
        navigate('/profile');
        break;
      case 'My Orders':
        navigate('/orders');
        break;
      case 'Logout':
        API.auth.logout();
        clearAuth();
        navigate('/');
        break;
      default:
        break;
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 text-xl font-bold tracking-wider transition-opacity hover:opacity-80"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
              OpenShop
            </button>

            {/* Desktop Navigation - Different for Seller vs Customer */}
            <nav className="hidden md:flex items-center gap-1">
              {user?.role === 'SELLER' ? (
                /* Seller Navigation */
                <Button
                  variant="ghost"
                  onClick={() => navigate('/seller/products')}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  My Products
                </Button>
              ) : (
                /* Customer Navigation */
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/products')}
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Products
                  </Button>
                  <DropdownMenu open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                    <DropdownMenuTrigger
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/10",
                        categoriesOpen && "bg-primary-foreground/10"
                      )}
                    >
                      Categories
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {CATEGORIES.map((category) => (
                        <DropdownMenuItem
                          key={category.value}
                          onClick={() => handleCategoryClick(category.value)}
                        >
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Authenticated Actions */}
            {isAuthenticated && (
              <>
                {user?.role === 'SELLER' ? (
                  /* Seller Actions - Show Add Product Button */
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/seller/products/new')}
                    className="relative text-primary-foreground hover:bg-primary-foreground/10"
                    title="Add Product"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                ) : (
                  /* Customer Actions - Show Wishlist and Cart */
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/wishlist')}
                      className="relative text-primary-foreground hover:bg-primary-foreground/10"
                      title="Wishlist"
                    >
                      <Heart className="h-5 w-5" />
                      {wishlistItemCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs"
                        >
                          {wishlistItemCount}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/cart')}
                      className="relative text-primary-foreground hover:bg-primary-foreground/10"
                      title="Cart"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs"
                        >
                          {cartItemCount}
                        </Badge>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}

            {/* User Menu or Auth Buttons */}
            {isAuthenticated ? (
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <DropdownMenuTrigger
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden md:flex items-center justify-center h-10 w-10 rounded-full bg-primary-foreground/20 text-primary-foreground font-semibold hover:bg-primary-foreground/30 transition-colors"
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {getSettingsForUser(user?.role).map((setting) => (
                    <DropdownMenuItem
                      key={setting}
                      onClick={() => handleMenuItemClick(setting)}
                    >
                      {setting}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <MobileMenuTrigger
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </MobileMenuTrigger>
              <MobileMenuContent>
                <div className="flex flex-col gap-1">
                  {user?.role === 'SELLER' ? (
                    /* Seller Mobile Menu */
                    <MobileMenuItem onClick={() => navigate('/seller/products')}>
                      My Products
                    </MobileMenuItem>
                  ) : (
                    /* Customer Mobile Menu */
                    <>
                      <MobileMenuItem onClick={() => navigate('/products')}>
                        Products
                      </MobileMenuItem>
                      <div className="border-t border-border my-1" />
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                        Categories
                      </div>
                      {CATEGORIES.map((category) => (
                        <MobileMenuItem
                          key={category.value}
                          onClick={() => handleCategoryClick(category.value)}
                          className="pl-6"
                        >
                          {category.name}
                        </MobileMenuItem>
                      ))}
                    </>
                  )}
                  {isAuthenticated && (
                    <>
                      <div className="border-t border-border my-1" />
                      {getSettingsForUser(user?.role).map((setting) => (
                        <MobileMenuItem
                          key={setting}
                          onClick={() => handleMenuItemClick(setting)}
                        >
                          {setting}
                        </MobileMenuItem>
                      ))}
                    </>
                  )}
                  {!isAuthenticated && (
                    <>
                      <div className="border-t border-border my-1" />
                      <MobileMenuItem onClick={() => navigate('/login')}>
                        Login
                      </MobileMenuItem>
                      <MobileMenuItem onClick={() => navigate('/signup')}>
                        Sign Up
                      </MobileMenuItem>
                    </>
                  )}
                </div>
              </MobileMenuContent>
            </MobileMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ResponsiveAppBar;
