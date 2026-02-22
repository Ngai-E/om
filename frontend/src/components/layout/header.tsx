'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, Menu, X, LogOut, Heart } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useSettingsStore } from '@/lib/store/settings-store';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { itemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { settings } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Autocomplete query
  const { data: autocompleteResults } = useQuery({
    queryKey: ['autocomplete', searchQuery],
    queryFn: () => productsApi.getProducts({ search: searchQuery, limit: 5 }),
    enabled: searchQuery.length >= 2,
  });

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
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
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      {/* Top Bar */}
      <div className="bg-primary text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <p>{settings.deliveryMessage}</p>
            <p className="hidden md:block">📞 Call us: {settings.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src="/omega-logo.jpg" 
              alt="OMEGA Afro Caribbean Superstore" 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback to text logo if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-10 h-10 bg-primary rounded-full items-center justify-center text-white font-bold text-xl">
              Ω
            </div>
            <span className="font-bold text-xl hidden sm:block">OMEGA</span>
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
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                  <Link
                    href={getDashboardUrl()}
                    className="text-sm px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user?.firstName}</span>
                </Link>
                <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                  <Heart className="w-6 h-6" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>
                <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-primary hover:bg-primary/5 rounded-lg transition font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium"
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


      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 hover:bg-gray-100 rounded-lg font-medium"
            >
              All Products
            </Link>
            <Link
              href="/products?category=grains-staples"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 hover:bg-gray-100 rounded-lg"
            >
              Grains & Staples
            </Link>
            <Link
              href="/products?category=spices-seasonings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 hover:bg-gray-100 rounded-lg"
            >
              Spices & Seasonings
            </Link>
            <Link
              href="/products?category=beverages"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 hover:bg-gray-100 rounded-lg"
            >
              Beverages
            </Link>
            
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
