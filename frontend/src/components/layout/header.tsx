'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, Menu, X, LogOut, Heart, Home, Tag, Phone, ChevronDown, Grid } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useSettingsStore } from '@/lib/store/settings-store';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { promotionsApi } from '@/lib/api/promotions';
import { useCart } from '@/lib/hooks/use-cart';
import { useTenant } from '@/components/providers/tenant-provider';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { itemCount } = useCartStore();
  const { items: guestCartItems } = useGuestCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { settings } = useSettingsStore();
  const { tenant, branding } = useTenant();
  
  // Fetch cart data when authenticated to ensure count is up to date
  useCart();
  
  // Calculate total cart count (authenticated or guest)
  const totalCartCount = isAuthenticated ? itemCount : guestCartItems.length;
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Check for active promotions
  const { data: activePromotions } = useQuery({
    queryKey: ['active-promotions-check'],
    queryFn: () => promotionsApi.getActivePromotions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const hasActivePromotions = activePromotions && activePromotions.length > 0;

  // Fetch quick categories
  const { data: quickCategories = [] } = useQuery({
    queryKey: ['quick-categories'],
    queryFn: () => productsApi.getQuickCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all categories for dropdown
  const { data: allCategories = [] } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => productsApi.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Autocomplete query
  const { data: autocompleteResults } = useQuery({
    queryKey: ['autocomplete', searchQuery],
    queryFn: () => productsApi.getProducts({ search: searchQuery, limit: 5 }),
    enabled: searchQuery.length >= 2,
  });

  // Close autocomplete and categories dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setShowCategoriesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowAutocomplete(false);
    }
  };

  const handleSelectProduct = (slug: string) => {
    router.push(`/products/${slug}`);
    setSearchQuery('');
    setShowAutocomplete(false);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const getDashboardUrl = () => {
    if (user?.role === 'ADMIN') return '/admin';
    if (user?.role === 'STAFF') return '/staff/dashboard';
    return '/account';
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar */}
      <div className="bg-omega-green-dark text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                {settings.promoBanner || tenant?.name || 'Welcome to our store'}
              </span>
            </div>
            {settings.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 md:w-4 md:h-4" />
                <a href={`tel:${settings.phoneNumber.replace(/\s/g, '')}`} className="hover:text-omega-orange transition">
                  Call us: {settings.phoneNumber}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src={branding?.logoUrl || '/omega-logo.png'} 
              alt={tenant?.name || 'OMEGA Afro Caribbean Superstore'} 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden font-black text-2xl text-omega-green-dark">
              {tenant?.name || 'OMEGA'}
            </div>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
            <div ref={searchRef} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && searchQuery.length >= 2 && autocompleteResults && autocompleteResults.data.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {autocompleteResults.data.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product.slug)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition text-left"
                    >
                      {product.images && product.images[0] && (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          £{parseFloat(product.price).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="w-full p-3 text-sm text-primary hover:bg-primary/5 transition border-t font-medium"
                  >
                    See all results for "{searchQuery}"
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {hasActivePromotions && (
              <Link
                href="/promotions"
                className="relative flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg hover:from-orange-500 hover:to-pink-500 transition-all duration-500 font-bold text-sm shadow-md animate-gradient-slow"
              >
                <Tag className="w-4 h-4" />
                Deals
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-black animate-bounce">
                  HOT
                </span>
              </Link>
            )}
            
            <Link
              href="/cart"
              className="relative flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-omega-green-dark transition"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-omega-orange text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {totalCartCount}
                </span>
              )}
            </Link>

            <Link
              href="/wishlist"
              className="relative flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-omega-green-dark transition"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <>
                {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                  <Link
                    href={getDashboardUrl()}
                    className="px-4 py-2 bg-omega-green-dark text-white rounded-lg hover:bg-omega-green transition font-medium"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-omega-green-dark transition font-medium"
                >
                  <User className="w-4 h-4" />
                  My Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-omega-orange hover:bg-omega-orange-light text-white rounded-lg font-bold transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-omega-green-dark transition font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-omega-orange hover:bg-omega-orange-light text-white rounded-lg font-bold transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Secondary Navigation - Categories (Desktop Only) - Hide on products page */}
      {!pathname?.startsWith('/products') && (
        <div className="hidden md:block border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-2">
            {/* All Categories Dropdown */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-omega-green-dark text-white rounded-lg hover:bg-omega-green transition font-medium"
              >
                <Grid className="w-4 h-4" />
                All Categories
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showCategoriesDropdown && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  {allCategories.map((category: any) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      onClick={() => setShowCategoriesDropdown(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition border-b last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {category.description}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Categories */}
            <div className="flex items-center gap-1 ml-2">
              {quickCategories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="px-4 py-2 text-gray-700 hover:text-omega-green-dark hover:bg-white rounded-lg transition font-medium text-sm"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {/* Shop All Link */}
            <Link
              href="/products"
              className="ml-auto px-4 py-2 text-omega-green-dark hover:text-omega-green font-medium text-sm flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              Shop All
            </Link>
          </div>
        </div>
      </div>
      )}


      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[180px] bottom-0 bg-white border-t shadow-xl z-40 overflow-y-auto">
          <nav className="container mx-auto px-4 py-4 pb-20 space-y-2">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 hover:bg-gray-100 rounded-lg font-medium"
            >
              All Products
            </Link>

            {/* Categories */}
            {quickCategories.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-t mt-2 pt-4">
                  Categories
                </div>
                {quickCategories.slice(0, 5).map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 hover:bg-gray-100 rounded-lg font-medium"
                  >
                    {category.name}
                  </Link>
                ))}
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-omega-green-dark hover:bg-gray-100 rounded-lg font-medium"
                >
                  View All Categories →
                </Link>
              </>
            )}
            {hasActivePromotions && (
              <Link
                href="/promotions"
                onClick={() => setMobileMenuOpen(false)}
                className="relative block px-4 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg hover:from-orange-500 hover:to-pink-500 transition-all duration-500 font-bold shadow-md animate-gradient-slow"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Deals
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full font-black animate-bounce">
                    HOT
                  </span>
                </div>
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <div className="border-t my-2"></div>
                {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                  <Link
                    href={getDashboardUrl()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 bg-green-100 text-green-700 rounded-lg font-medium"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100 rounded-lg"
                >
                  My Account
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100 rounded-lg flex items-center justify-between"
                >
                  <span>Cart</span>
                  {itemCount > 0 && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100 rounded-lg"
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="border-t my-2"></div>
                {/* Guest Cart Link */}
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100 rounded-lg flex items-center justify-between"
                >
                  <span>Cart</span>
                  {totalCartCount > 0 && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {totalCartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-primary text-white rounded-lg text-center font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 border-2 border-primary text-primary rounded-lg text-center font-medium"
                >
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
