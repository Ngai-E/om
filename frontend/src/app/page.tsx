'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Truck, CreditCard, Star, ArrowRight, Package, Shield, ChevronRight, Phone, MessageCircle, MapPin, Play } from 'lucide-react';
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
    <div className="min-h-screen bg-omega-beige">
      {/* Hero Section */}
      <section className="relative text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        ></div>
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              African & Caribbean<br />Groceries in Bolton
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white flex items-center gap-2">
              Fresh food. Affordable prices. Delivery available 🚚
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <button className="bg-omega-green-dark hover:bg-omega-green text-white px-8 py-4 rounded-lg font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto transition">
                  Shop Now
                </button>
              </Link>
              <a href="https://wa.me/447355316253" target="_blank" rel="noopener noreferrer">
                <button className="bg-omega-orange hover:bg-omega-orange-light text-white px-8 py-4 rounded-lg font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto transition">
                  <MessageCircle className="w-5 h-5" />
                  Order via WhatsApp
                </button>
              </a>
            </div>
          </div>
        </div>
        
        {/* Trust Badges */}
        <div className="relative bg-omega-green-dark/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap justify-center md:justify-between gap-4 text-sm text-white">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">👍</span>
                <span>Trusted by the Bolton & Manchester African community</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🚚</span>
                <span>Same-day home delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚡</span>
                <span>Order in 2 minutes via WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-10">
            Quick Categories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Meat & Fish */}
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
              <div className="relative h-48 bg-gray-200">
                <img src="/hero-bg.png" alt="Meat & Fish" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-omega-green-dark text-white px-3 py-1 rounded-full text-sm font-bold">
                  Fresh
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Meat & Fish</h3>
                <p className="text-3xl font-black text-omega-orange mb-4">£29.99</p>
                <Link href="/products?category=meat-fish">
                  <button className="w-full bg-omega-green-dark hover:bg-omega-green text-white py-3 rounded-lg font-bold transition">
                    Shop Bundle
                  </button>
                </Link>
              </div>
            </div>

            {/* Rice & Grains */}
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
              <div className="relative h-48 bg-gray-200">
                <img src="/hero-bg.png" alt="Rice & Grains" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-omega-green-dark text-white px-3 py-1 rounded-full text-sm font-bold">
                  Staples
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Rice & Grains</h3>
                <p className="text-3xl font-black text-omega-orange mb-4">£19.99</p>
                <Link href="/products?category=grains-staples">
                  <button className="w-full bg-omega-green-dark hover:bg-omega-green text-white py-3 rounded-lg font-bold transition">
                    Shop Bundle
                  </button>
                </Link>
              </div>
            </div>

            {/* Drinks & Snacks */}
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
              <div className="relative h-48 bg-gray-200">
                <img src="/hero-bg.png" alt="Drinks & Snacks" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-omega-green-dark text-white px-3 py-1 rounded-full text-sm font-bold">
                  Popular
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Drinks & Snacks</h3>
                <p className="text-3xl font-black text-omega-orange mb-4">£24.99</p>
                <Link href="/products?category=beverages">
                  <button className="w-full bg-omega-green-dark hover:bg-omega-green text-white py-3 rounded-lg font-bold transition">
                    Shop Bundle
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Bundles */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-10">
            Featured Bundles
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {featuredProducts?.slice(0, 5).map((product, index) => (
              <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition">
                <div className="relative">
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                      Best Seller
                    </div>
                  )}
                  {index === 2 && (
                    <div className="absolute top-2 left-2 bg-omega-orange text-white px-2 py-1 rounded text-xs font-bold">
                      Save £5
                    </div>
                  )}
                  <div className="aspect-square bg-gray-100">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <p className="text-lg font-black text-omega-orange mb-2">
                    £{product.variants?.[0]?.price || '0.00'}
                  </p>
                  <Link href={`/products/${product.slug}`}>
                    <button className="w-full bg-omega-green-dark hover:bg-omega-green text-white py-2 rounded text-sm font-bold transition">
                      {index < 2 ? 'Shop Bundle' : index === 2 ? 'Add to Cart' : 'Shop Now'}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-12 md:py-16 bg-omega-beige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-10">
            What customers say 💛
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Video Section */}
            <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
              <img src="/hero-bg.png" alt="Customer preparing food" className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-white/90 hover:bg-white rounded-full p-6 transition">
                  <Play className="w-12 h-12 text-omega-green-dark" fill="currentColor" />
                </button>
              </div>
            </div>
            
            {/* Testimonials */}
            <div className="space-y-6">
              <div className="flex items-start gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">Best African shop in Bolton!"</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">Fresh meat and very fast delivery.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">Highly recommend.</p>
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-gray-900">
                  <span className="font-bold">😋 Fresh stock weekly.</span> <span className="text-green-600">✅ From decline, your doorstep</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-20 bg-cover bg-center" style={{ backgroundImage: 'url(/hero-bg.png)' }}>
        <div className="absolute inset-0 bg-omega-green-dark/85"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Ready to cook? Shop now or order via WhatsApp 🛒
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link href="/products">
                  <button className="bg-white text-omega-green-dark hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition">
                    Shop Now
                  </button>
                </Link>
                <a href="tel:07355316253">
                  <button className="bg-omega-orange hover:bg-omega-orange-light text-white px-8 py-3 rounded-lg font-bold transition">
                    Call Now
                  </button>
                </a>
                <a href="https://wa.me/447355316253" target="_blank" rel="noopener noreferrer">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition inline-flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Us
                  </button>
                </a>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-omega-green-dark" />
                <div>
                  <p className="font-bold text-gray-900">📍 07355-316259</p>
                  <p className="text-sm text-gray-600">Map</p>
                </div>
              </div>
              <div className="aspect-video bg-gray-200 rounded overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2373.123456789!2d-2.428!3d53.577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTPCsDM0JzM3LjIiTiAywrAyNScwNC44Ilc!5e0!3m2!1sen!2suk!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-omega-green-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <p className="text-sm">123 Market St, Framworth, Bolton BL4 8EX</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              <p className="text-sm">@omega_afrocaribbean_store</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
