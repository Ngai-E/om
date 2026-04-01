'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Truck, CreditCard, Star, ArrowRight, Package, Shield, ChevronRight, Phone, MessageCircle, MapPin, Play } from 'lucide-react';
import { useFeaturedProducts, useQuickCategories } from '@/lib/hooks/use-products';
import { useBestSellers } from '@/lib/hooks/use-best-sellers';
import { useHomepageReviews } from '@/lib/hooks/use-homepage-reviews';
import { useActiveTestimonials } from '@/lib/hooks/use-testimonials';
import { ProductCard } from '@/components/products/product-card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSettingsStore } from '@/lib/store/settings-store';
import { useTenant } from '@/components/providers/tenant-provider';
import { ProductCardSkeleton, CategoryCardSkeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const { tenant, branding } = useTenant();
  const { data: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: bestSellers, isLoading: bestSellersLoading } = useBestSellers(8);
  const { data: categories, isLoading: categoriesLoading } = useQuickCategories();
  const { data: homepageReviews, isLoading: reviewsLoading } = useHomepageReviews();
  const { data: testimonials, isLoading: testimonialsLoading } = useActiveTestimonials();
  const [showAllCategories, setShowAllCategories] = React.useState(false);

  // Hero config from tenant branding (JSON field)
  const heroConfig = (branding as any)?.heroConfig as {
    heading?: string;
    subheading?: string;
    imageUrl?: string;
    trustBadges?: string[];
  } | null;

  const storeName = settings.storeName || tenant?.name || 'Our Store';
  const heroHeading = heroConfig?.heading || storeName;
  const heroSubheading = heroConfig?.subheading || settings.deliveryMessage || 'Quality products. Great prices. Fast delivery.';
  const heroImageUrl = heroConfig?.imageUrl || '/hero-bg.png';
  const trustBadges = heroConfig?.trustBadges || [
    'Same-day home delivery',
    'Fast & easy ordering',
    '1000+ happy customers',
  ];

  // Format WhatsApp number for URL (remove spaces and special chars except +)
  const whatsappNumber = (settings.whatsappNumber || '').replace(/\s/g, '');
  const phoneNumber = settings.phoneNumber || '';
  
  // Google Maps URL from settings
  const googleMapsUrl = settings.googleMapsEmbedUrl || '';
  
  // Opening hours from settings
  const openingHours = settings.openingHours || '';

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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
              {heroHeading}
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white flex items-center gap-2" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
              {heroSubheading}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <button className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-lg font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto transition">
                  Shop Now
                </button>
              </Link>
              {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                  <button className="bg-secondary hover:bg-secondary/80 text-white px-8 py-4 rounded-lg font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto transition">
                    <MessageCircle className="w-5 h-5" />
                    Order via WhatsApp
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Trust Badges */}
        <div className="relative bg-primary/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap justify-center md:justify-between gap-4 text-sm text-white">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-yellow-400">{['👍', '🚚', '⚡'][i % 3]}</span>
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Quick Categories
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))
            ) : (
              categories?.slice(0, 4).map((category, index) => {
              const icons = ['', '', '', ''];
              const gradients = [
                'from-red-50 to-orange-50',
                'from-yellow-50 to-amber-50',
                'from-green-50 to-teal-50',
                'from-blue-50 to-cyan-50',
                'from-purple-50 to-pink-50',
                'from-orange-50 to-red-50',
                'from-teal-50 to-green-50',
                'from-pink-50 to-rose-50',
                'from-indigo-50 to-blue-50',
                'from-amber-50 to-yellow-50',
                'from-lime-50 to-green-50',
                'from-rose-50 to-pink-50'
              ];
              const prices = ['£29.99', '£19.99', '£24.99', '£34.99', '£14.99', '£22.99', '£27.99', '£18.99', '£31.99', '£25.99', '£16.99', '£23.99'];
              
              return (
                <div key={category.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
                  <div className={`relative h-48 bg-gradient-to-br ${gradients[index % gradients.length]}`}>
                    <img 
                      src={category.image || '/hero-bg.png'} 
                      alt={category.name} 
                      className="w-full h-full object-cover mix-blend-multiply" 
                    />
                  </div>
                  <div className="bg-pink-50 px-4 py-3 flex items-center justify-center gap-2 min-h-[60px]">
                    <h3 className="text-base font-bold text-gray-900 text-center leading-tight">{category.name}</h3>
                  </div>
                  <div className="bg-white p-6 text-center">
                    <p className="text-3xl font-black text-secondary mb-4">{prices[index % prices.length]}</p>
                    <Link href={`/products?category=${category.slug}`}>
                      <button className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-lg font-bold transition">
                        Shop Bundle
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      </section>

      {/* Featured Bundles */}
      {(featuredLoading || (featuredProducts && featuredProducts.length > 0)) && (
        <section className="py-4 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Featured Bundles
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {featuredLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              ) : (
                featuredProducts?.slice(0, 5).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="py-4 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Best Sellers
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {bestSellersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              ) : (
                bestSellers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Customer Testimonials - 3 Videos */}
      <section className="py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              What customers say 💛
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {testimonials && testimonials.length > 0 ? (
              testimonials.slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <video
                    src={testimonial.videoUrl}
                    poster={testimonial.thumbnailUrl || undefined}
                    controls
                    className="w-full h-full object-cover"
                  />
                  {testimonial.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white font-semibold">{testimonial.title}</p>
                      {testimonial.description && (
                        <p className="text-white/80 text-sm">{testimonial.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <>
                {/* Placeholder videos */}
                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <img src="/hero-bg.png" alt="Customer testimonial 1" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white/90 hover:bg-white rounded-full p-4 transition">
                      <Play className="w-8 h-8 text-primary" fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <img src="/hero-bg.png" alt="Customer testimonial 2" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white/90 hover:bg-white rounded-full p-4 transition">
                      <Play className="w-8 h-8 text-primary" fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <img src="/hero-bg.png" alt="Customer testimonial 3" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white/90 hover:bg-white rounded-full p-4 transition">
                      <Play className="w-8 h-8 text-primary" fill="currentColor" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Customer Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homepageReviews && homepageReviews.length > 0 ? (
              homepageReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {review.title && (
                    <h3 className="font-bold text-gray-900 mb-2">{review.title}</h3>
                  )}
                  <p className="text-gray-700 mb-4 line-clamp-3">{review.comment}</p>
                  <div className="border-t pt-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {review.user.firstName} {review.user.lastName}
                    </p>
                    <Link href={`/products/${review.product.slug}`} className="text-sm text-primary hover:underline">
                      {review.product.name}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-lg font-semibold text-gray-900">Best shop around!"</p>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-lg font-semibold text-gray-900">Fresh meat and very fast delivery.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-lg font-semibold text-gray-900">Highly recommend.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Before Footer */}
      <section className="relative py-10 md:py-12 bg-cover bg-center" style={{ backgroundImage: `url(${heroImageUrl})` }}>
        <div className="absolute inset-0 bg-primary/85"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-white">
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                {settings.deliveryMessage || `Shop now at ${storeName}`} 🛒
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/products">
                  <button className="bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition">
                    Shop Now
                  </button>
                </Link>
                {phoneNumber && (
                  <a href={`tel:${phoneNumber.replace(/\s/g, '')}`}>
                    <button className="bg-secondary hover:bg-secondary/80 text-white px-8 py-3 rounded-lg font-bold transition">
                      Call Now
                    </button>
                  </a>
                )}
                {whatsappNumber && (
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                    <button className="bg-primary hover:bg-primary/80 text-white px-8 py-3 rounded-lg font-bold transition inline-flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp Us
                    </button>
                  </a>
                )}
              </div>
            </div>
            {(googleMapsUrl || settings.address) && (
              <div className="bg-white rounded-lg p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-bold text-gray-900">{settings.address || storeName}</p>
                    {phoneNumber && <p className="text-sm text-gray-600">{phoneNumber}</p>}
                  </div>
                </div>
                {googleMapsUrl && (
                  <div className="aspect-video bg-gray-200 rounded overflow-hidden">
                    <iframe
                      src={googleMapsUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary">About Us</h3>
              <p className="text-gray-600">
                {settings.aboutUs}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary">Contact</h3>
              <p className="text-gray-600">
                Email: {settings.contactEmail}<br />
                Phone: {settings.whatsappNumber}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary">Opening Hours</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {openingHours}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
