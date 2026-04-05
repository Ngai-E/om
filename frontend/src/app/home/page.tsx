import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ShoppingBag, CreditCard, Star, ArrowRight, Package, Shield, ChevronRight, Phone, MessageCircle, MapPin, Play } from 'lucide-react';
import { serverApi } from '@/lib/server-api';
import { ProductCard } from '@/components/products/product-card';
import { CategoryList } from '@/components/home/CategoryList';
import { ProductCardSkeleton, CategoryCardSkeleton } from '@/components/ui/skeleton';
import { Product, Testimonial, Review } from '@/types';

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  // Fetch all data in parallel on the server with error handling
  const [
    tenantData,
    featuredProducts,
    bestSellers,
    categories,
    homepageReviews,
    testimonials,
    settings
  ] = await Promise.all([
    serverApi.getServerTenant().catch(err => { console.error('getServerTenant error:', err); return null; }),
    serverApi.getFeaturedProducts().catch(err => { console.error('getFeaturedProducts error:', err); return []; }),
    serverApi.getBestSellers(8).catch(err => { console.error('getBestSellers error:', err); return []; }),
    serverApi.getQuickCategories().catch(err => { console.error('getQuickCategories error:', err); return []; }),
    serverApi.getHomepageReviews().catch(err => { console.error('getHomepageReviews error:', err); return []; }),
    serverApi.getActiveTestimonials().catch(err => { console.error('getActiveTestimonials error:', err); return []; }),
    serverApi.getSettings().catch(err => { console.error('getSettings error:', err); return {}; })
  ]);

  if (!tenantData) {
    // Should not happen as middleware/provider handle fallbacks, 
    // but good to have a basic check.
  }

  const tenant = tenantData || {};
  const branding = tenant.branding || {};
  const heroConfig = branding.heroConfig || null;

  const storeName = settings.store_name || settings.storeName || tenant?.name || 'Our Store';
  const heroHeading = heroConfig?.heading || storeName;
  const heroSubheading = heroConfig?.subheading || settings.delivery_banner_message || settings.deliveryMessage || 'Quality products. Great prices. Fast delivery.';
  const heroImageUrl = heroConfig?.imageUrl || '/hero-bg.png';
  const trustBadges = heroConfig?.trustBadges || [
    'Same-day home delivery',
    'Fast & easy ordering',
    '1000+ happy customers',
  ];

  const whatsappNumber = (settings.whatsapp_number || settings.whatsappNumber || '').replace(/\s/g, '');
  const phoneNumber = settings.phone_number || settings.phoneNumber || '';
  const googleMapsUrl = settings.google_maps_embed_url || settings.googleMapsEmbedUrl || '';
  const openingHours = settings.opening_hours || settings.openingHours || '';

  // Debug logging (server-side only)
  console.log('Settings loaded:', {
    whatsappNumber,
    phoneNumber,
    googleMapsUrl,
    openingHours,
    delivery_banner_message: settings.delivery_banner_message,
    store_address: settings.store_address,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] text-white overflow-hidden">
        {/* Background Image - Optimized with next/image */}
        <Image 
          src={heroImageUrl}
          alt={heroHeading}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
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
        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 backdrop-blur-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap justify-center md:justify-between gap-4 text-sm text-white">
              {trustBadges.map((badge: string, i: number) => (
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
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Quick Categories
            </h2>
          </div>
          
          <CategoryList categories={categories || []} />
        </div>
      </section>

      {/* Featured Bundles */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-12 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Featured Bundles
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {featuredProducts.slice(0, 5).map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                Best Sellers
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {bestSellers.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Testimonials - 3 Videos */}
      {((testimonials && testimonials.length > 0) || (homepageReviews && homepageReviews.length > 0)) && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">
                What customers say 💛
              </h2>
            </div>
            
            {testimonials && testimonials.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {testimonials.slice(0, 3).map((testimonial: any) => (
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
                ))}
              </div>
            )}
            
            {/* Customer Reviews */}
            {homepageReviews && homepageReviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {homepageReviews.slice(0, 3).map((review: any) => (
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
                        {review.user?.firstName} {review.user?.lastName}
                      </p>
                      <Link href={`/products/${review.product?.slug}`} className="text-sm text-primary hover:underline">
                        {review.product?.name}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section - Before Footer */}
      <section className="relative py-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src={heroImageUrl}
            alt="CTA background"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                {settings.delivery_banner_message || settings.deliveryMessage || `Shop now at ${storeName}`} 🛒
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <button className="bg-white text-primary hover:bg-gray-100 px-10 py-4 rounded-lg font-bold transition">
                    Shop Now
                  </button>
                </Link>
                {phoneNumber && (
                  <a href={`tel:${phoneNumber.replace(/\s/g, '')}`}>
                    <button className="bg-white text-primary hover:bg-gray-100 px-10 py-4 rounded-lg font-bold transition inline-flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Call Now
                    </button>
                  </a>
                )}
                {whatsappNumber && (
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                    <button className="bg-secondary hover:bg-secondary/80 text-white px-10 py-4 rounded-lg font-bold transition inline-flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp Us
                    </button>
                  </a>
                )}
              </div>
            </div>
            
            {(googleMapsUrl || settings.store_address || settings.address) && (
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{settings.store_address || settings.address || storeName}</h3>
                    {phoneNumber && <p className="text-gray-600">{phoneNumber}</p>}
                  </div>
                </div>
                {googleMapsUrl && (
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
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
      <section className="py-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <h3 className="font-black text-xl mb-6 text-primary">About Us</h3>
              <p className="text-gray-600 leading-relaxed">
                {settings.about_us || settings.aboutUs || tenant?.description || 'Your trusted source for quality products.'}
              </p>
            </div>
            <div>
              <h3 className="font-black text-xl mb-6 text-primary">Contact</h3>
              <div className="space-y-4 text-gray-600">
                <p>Email: {settings.contact_email || settings.contactEmail || settings.store_email || settings.storeEmail || tenant?.email}</p>
                <p>Phone: {whatsappNumber || phoneNumber}</p>
              </div>
            </div>
            <div>
              <h3 className="font-black text-xl mb-6 text-primary">Opening Hours</h3>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {openingHours || 'Mon-Sat: 9:00 AM - 8:00 PM\nSunday: 10:00 AM - 6:00 PM'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
