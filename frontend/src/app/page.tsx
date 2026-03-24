'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Truck, CreditCard, Star, ArrowRight, Package, Shield, ChevronRight, Phone, MessageCircle, MapPin, Play } from 'lucide-react';
import { useFeaturedProducts, useCategories } from '@/lib/hooks/use-products';
import { useBestSellers } from '@/lib/hooks/use-best-sellers';
import { useHomepageReviews } from '@/lib/hooks/use-homepage-reviews';
import { useActiveTestimonials } from '@/lib/hooks/use-testimonials';
import { ProductCard } from '@/components/products/product-card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSettingsStore } from '@/lib/store/settings-store';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const { data: featuredProducts } = useFeaturedProducts();
  const { data: bestSellers } = useBestSellers(8);
  const { data: categories } = useCategories();
  const { data: homepageReviews } = useHomepageReviews();
  const { data: testimonials } = useActiveTestimonials();
  const [showAllCategories, setShowAllCategories] = React.useState(false);

  // Default promo banner if not set
  const promoBanner = settings.promoBanner || '🎉 Weekly Deal: 20% off all Grains & Staples | Free delivery over £50';
  
  // Format WhatsApp number for URL (remove spaces and special chars except +)
  const whatsappNumber = (settings.whatsappNumber || '+44 7535 316253').replace(/\s/g, '');
  
  // Default Google Maps URL if not configured
  const googleMapsUrl = settings.googleMapsEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2373.123456789!2d-2.428!3d53.577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTPCsDM0JzM3LjIiTiAywrAyNScwNC44Ilc!5e0!3m2!1sen!2suk!4v1234567890';
  
  // Default opening hours if not configured
  const openingHours = settings.openingHours || 'Mon-Sat: 9:00 AM - 8:00 PM\nSunday: 10:00 AM - 6:00 PM';

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
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
              African & Caribbean<br />Groceries in Bolton
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white flex items-center gap-2" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
              Fresh food. Affordable prices. Delivery available 🚚
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <button className="bg-omega-green-dark hover:bg-omega-green text-white px-8 py-4 rounded-lg font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto transition">
                  Shop Now
                </button>
              </Link>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
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
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Quick Categories
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories
              ?.slice(0, 4)
              .map((category, index) => {
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
                    <p className="text-3xl font-black text-omega-orange mb-4">{prices[index % prices.length]}</p>
                    <Link href={`/products?category=${category.slug}`}>
                      <button className="w-full bg-omega-green-dark hover:bg-omega-green text-white py-3 rounded-lg font-bold transition">
                        Shop Bundle
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Bundles */}
      <section className="py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Featured Bundles
            </h2>
          </div>
          
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
                <div className="p-3 text-center">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <p className="text-3xl font-black text-omega-orange mb-2">
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
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
                      <Play className="w-8 h-8 text-omega-green-dark" fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <img src="/hero-bg.png" alt="Customer testimonial 2" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white/90 hover:bg-white rounded-full p-4 transition">
                      <Play className="w-8 h-8 text-omega-green-dark" fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <img src="/hero-bg.png" alt="Customer testimonial 3" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-white/90 hover:bg-white rounded-full p-4 transition">
                      <Play className="w-8 h-8 text-omega-green-dark" fill="currentColor" />
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
                    <Link href={`/products/${review.product.slug}`} className="text-sm text-omega-green-dark hover:underline">
                      {review.product.name}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-lg font-semibold text-gray-900">Best African shop in Bolton!"</p>
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
      <section className="relative py-10 md:py-12 bg-cover bg-center" style={{ backgroundImage: 'url(/hero-bg.png)' }}>
        <div className="absolute inset-0 bg-omega-green-dark/85"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-white">
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                Ready to cook? Shop now or order via WhatsApp 🛒
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/products">
                  <button className="bg-white text-omega-green-dark hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition">
                    Shop Now
                  </button>
                </Link>
                <a href="tel:07535316253">
                  <button className="bg-omega-orange hover:bg-omega-orange-light text-white px-8 py-3 rounded-lg font-bold transition">
                    Call Now
                  </button>
                </a>
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition inline-flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Us
                  </button>
                </a>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-6 h-6 text-omega-green-dark" />
                <div>
                  <p className="font-bold text-gray-900">📍 07355-316259</p>
                  <p className="text-sm text-gray-600">Map</p>
                </div>
              </div>
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
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-bold text-lg mb-3 text-omega-green-dark">About Us</h3>
              <p className="text-gray-600">
                {settings.aboutUs}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-omega-green-dark">Contact</h3>
              <p className="text-gray-600">
                Email: {settings.contactEmail}<br />
                Phone: {settings.whatsappNumber}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-omega-green-dark">Opening Hours</h3>
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
