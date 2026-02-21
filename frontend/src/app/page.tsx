'use client';

import Link from 'next/link';
import { ShoppingBag, Truck, CreditCard, Star, ArrowRight, Package } from 'lucide-react';
import { useFeaturedProducts, useCategories } from '@/lib/hooks/use-products';
import { ProductCard } from '@/components/products/product-card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSettingsStore } from '@/lib/store/settings-store';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const { data: featuredProducts } = useFeaturedProducts();
  const { data: categories } = useCategories();

  // Default promo banner if not set
  const promoBanner = settings.promoBanner || '🎉 Weekly Deal: 20% off all Grains & Staples | Free delivery over £50';

  return (
    <div className="min-h-screen bg-background">
      {/* Promo Banner */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-3">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm md:text-base font-medium">
            {promoBanner}
          </p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              Authentic African & Caribbean Groceries
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8">
              Fresh ingredients, traditional flavors, delivered to your door in Bolton
            </p>
            <Link 
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition text-lg font-semibold shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Start Shopping
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fresh Products</h3>
              <p className="text-sm text-muted-foreground">
                Authentic ingredients sourced directly
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4">
                <Truck className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Same-day delivery in Bolton area
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                <CreditCard className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">
                Card, Apple Pay, or cash on delivery
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Quality Guaranteed</h3>
              <p className="text-sm text-muted-foreground">
                100% satisfaction or money back
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories && categories.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Find exactly what you're looking for</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
              {categories.map((category, index) => {
                const icons = ['🌾', '🌶️', '🥤']; // Grains, Spices, Beverages
                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-transparent rounded-xl p-4 md:p-6 hover:border-primary hover:shadow-lg transition text-center group"
                  >
                    <div className="text-4xl md:text-5xl mb-3">{icons[index] || '📦'}</div>
                    <h3 className="font-bold text-base md:text-lg mb-1 group-hover:text-primary transition">
                      {category.name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Shop now
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers / Fresh Stock */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-1">Best Sellers</h2>
                <p className="text-sm md:text-base text-muted-foreground">Customer favorites this week</p>
              </div>
              <Link
                href="/products"
                className="text-primary font-medium text-sm md:text-base hover:underline flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {featuredProducts.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            New to OMEGA?
          </h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 opacity-95">
            Get 10% off your first order over £30
          </p>
          {!isAuthenticated ? (
            <Link
              href="/register"
              className="inline-block bg-white text-primary px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
            >
              Create Free Account
            </Link>
          ) : (
            <Link
              href="/products"
              className="inline-block bg-white text-primary px-6 md:px-8 py-3 md:py-4 rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg"
            >
              Start Shopping
            </Link>
          )}
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-bold text-lg mb-3">About Us</h3>
              <p className="text-sm text-muted-foreground">
                OMEGA Afro Caribbean Superstore brings authentic African and Caribbean products to Bolton and surrounding areas.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Delivery Areas</h3>
              <p className="text-sm text-muted-foreground">
                Bolton Central, Bolton North, Bolton South, and surrounding postcodes. Check availability at checkout.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Customer Service</h3>
              <p className="text-sm text-muted-foreground">
                Need help? Contact our friendly team for assistance with orders, delivery, or product questions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
