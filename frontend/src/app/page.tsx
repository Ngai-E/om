'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Truck, CreditCard, Star, ArrowRight, Package, Shield, ChevronRight } from 'lucide-react';
import { useFeaturedProducts, useCategories } from '@/lib/hooks/use-products';
import { ProductCard } from '@/components/products/product-card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSettingsStore } from '@/lib/store/settings-store';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const { data: featuredProducts } = useFeaturedProducts();
  const { data: categories } = useCategories();
  const [showAllCategories, setShowAllCategories] = React.useState(false);

  // Default promo banner if not set
  const promoBanner = settings.promoBanner || '🎉 Weekly Deal: 20% off all Grains & Staples | Free delivery over £50';

  // Helper to format category names to Title Case
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Limit categories display
  const CATEGORY_LIMIT = 8;
  const displayedCategories = showAllCategories 
    ? categories 
    : categories?.slice(0, CATEGORY_LIMIT);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-[#036637] text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#036637]/60 to-[#036637]/40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              Authentic Afro-Caribbean Groceries
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Discover the finest selection of African and Caribbean foods, spices, and specialty items delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <button className="bg-[#FF7730] hover:bg-[#FF6520] text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2 w-full sm:w-auto transition">
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/promotions">
                <button className="bg-white/10 border-2 border-white text-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold w-full sm:w-auto transition">
                  View Promotions
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#E8F5E9] rounded-full flex-shrink-0">
                <Truck className="w-6 h-6 text-[#036637]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#036637]">Free Delivery</h3>
                <p className="text-sm text-gray-600">On orders over £50</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#FFF5F0] rounded-full flex-shrink-0">
                <CreditCard className="w-6 h-6 text-[#FF7730]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#036637]">Secure Payment</h3>
                <p className="text-sm text-gray-600">Multiple payment options</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#E8F5E9] rounded-full flex-shrink-0">
                <Shield className="w-6 h-6 text-[#036637]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#036637]">Quality Guaranteed</h3>
                <p className="text-sm text-gray-600">Fresh & authentic products</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-[#036637]">
                Shop by Category
              </h2>
              <Link href="/products">
                <button className="text-[#FF7730] hover:text-[#FF6520] font-medium inline-flex items-center gap-1 transition">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {displayedCategories?.map((category, index) => {
                const icons = ['🌾', '🌶️', '🥤', '🍖', '🧊', '🍪', '🥫', '🍚'];
                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-[#036637] hover:shadow-md transition-all group"
                  >
                    <div className="text-4xl mb-2">{icons[index] || '📦'}</div>
                    <h3 className="text-sm text-center font-medium text-gray-700 group-hover:text-[#036637] transition">
                      {toTitleCase(category.name)}
                    </h3>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href="/products">
                <button className="border-2 border-[#036637] text-[#036637] hover:bg-[#E8F5E9] px-6 py-2 rounded-lg font-medium transition">
                  Show More Categories
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-[#036637]">
                Best Sellers
              </h2>
              <Link href="/products">
                <button className="text-[#FF7730] hover:text-[#FF6520] font-medium inline-flex items-center gap-1 transition">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promotional Banner */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#036637] to-[#014D29] rounded-2xl overflow-hidden">
            <div className="px-8 py-12 md:py-16 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                {!isAuthenticated ? 'New to OMEGA?' : 'Special Offer This Week!'}
              </h2>
              <p className="text-lg mb-6 text-white/90">
                {!isAuthenticated 
                  ? 'Get 10% off your first order over £30. Sign up today!' 
                  : 'Get 20% off on all fresh produce. Limited time only!'}
              </p>
              {!isAuthenticated ? (
                <Link href="/register">
                  <button className="bg-[#FF7730] hover:bg-[#FF6520] text-white px-8 py-3 rounded-lg font-semibold transition">
                    Create Free Account
                  </button>
                </Link>
              ) : (
                <Link href="/promotions">
                  <button className="bg-[#FF7730] hover:bg-[#FF6520] text-white px-8 py-3 rounded-lg font-semibold transition">
                    Shop Deals Now
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-bold text-lg mb-3 text-[#036637]">About Us</h3>
              <p className="text-gray-600">
                Your trusted source for authentic African and Caribbean groceries in Bolton.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-[#036637]">Contact</h3>
              <p className="text-gray-600">
                Email: info@omega-groceries.co.uk<br />
                Phone: +44 1234 567890
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-[#036637]">Opening Hours</h3>
              <p className="text-gray-600">
                Mon-Sat: 9:00 AM - 8:00 PM<br />
                Sunday: 10:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
