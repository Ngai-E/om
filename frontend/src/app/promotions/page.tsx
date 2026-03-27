'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi, Promotion } from '@/lib/api/promotions';
import { settingsApi } from '@/lib/api/settings';
import { Tag, Calendar, Gift, TrendingUp, Info, Clock, Flame, Zap, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Format large numbers: 10000 → 10k, 1000000 → 1M
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString();
}

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: () => promotionsApi.getActivePromotions(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  // Calculate time remaining for each promotion
  useEffect(() => {
    if (!promotions) return;

    const interval = setInterval(() => {
      const newTimeLeft: { [key: string]: string } = {};
      
      promotions.forEach((promo) => {
        if (promo.endAt) {
          const now = new Date().getTime();
          const end = new Date(promo.endAt).getTime();
          const diff = end - now;

          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (days > 0) {
              newTimeLeft[promo.id] = `${days}d ${hours}h left`;
            } else if (hours > 0) {
              newTimeLeft[promo.id] = `${hours}h ${minutes}m left`;
            } else {
              newTimeLeft[promo.id] = `${minutes}m left`;
            }
          } else {
            newTimeLeft[promo.id] = 'Expired';
          }
        }
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [promotions]);

  // Get featured promotion from backend flag, fallback to first promo
  const featuredPromo = promotions?.find(p => p.isFeatured) || promotions?.[0];
  // Filter out featured promo from other deals
  const otherPromos = promotions?.filter(p => p.id !== featuredPromo?.id) || [];

  const getDiscountDisplay = (promo: Promotion) => {
    if (promo.discountType === 'PERCENT') {
      return `${promo.discountValue}% OFF`;
    }
    return `£${promo.discountValue} OFF`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEligibilityText = (promo: Promotion) => {
    const conditions = [];
    
    if (promo.firstOrderOnly) {
      conditions.push('First order only');
    }
    
    if (promo.minSubtotal) {
      conditions.push(`Min. order £${promo.minSubtotal}`);
    }
    
    if (promo.allowedFulfillment) {
      conditions.push(`${promo.allowedFulfillment.toLowerCase()} only`);
    }
    
    if (!promo.allowGuests) {
      conditions.push('Account required');
    }
    
    return conditions.length > 0 ? conditions.join(' • ') : 'No restrictions';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Featured Deal */}
      {featuredPromo && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Side - Image */}
              <div className="relative h-64 md:h-auto">
                {featuredPromo.imageUrl ? (
                  <Image
                    src={featuredPromo.imageUrl}
                    alt={featuredPromo.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                    <Flame className="w-24 h-24 text-white/50" />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-black text-sm flex items-center gap-2 animate-bounce">
                  <Zap className="w-4 h-4" />
                  FEATURED DEAL
                </div>
              </div>

              {/* Right Side - Details */}
              <div className="p-8 text-white">
                {/* Social Proof - Usage Count */}
                {settings?.show_promotion_usage_badges && featuredPromo.usageCount !== undefined && featuredPromo.usageCount > 0 && Math.floor(featuredPromo.usageCount * (settings.promotion_usage_inflation || 1.0)) > 0 && (
                  <div className="mb-4 inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                    <Users className="w-4 h-4" />
                    <span>{formatNumber(Math.floor(featuredPromo.usageCount * (settings.promotion_usage_inflation || 1.0)))} people used this</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <div className="inline-block bg-white text-orange-600 px-6 py-3 rounded-full text-3xl font-black mb-4">
                    {getDiscountDisplay(featuredPromo)}
                  </div>
                </div>
                
                <h2 className="text-3xl font-black mb-3">{featuredPromo.name}</h2>
                
                {featuredPromo.description && (
                  <p className="text-white/90 mb-4 text-lg">
                    {featuredPromo.description}
                  </p>
                )}

                {featuredPromo.code && (
                  <div className="bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg p-4 mb-4">
                    <div className="text-xs font-semibold mb-1">USE CODE</div>
                    <div className="text-2xl font-mono font-black">
                      {featuredPromo.code}
                    </div>
                  </div>
                )}

                {/* Urgency Timer */}
                {timeLeft[featuredPromo.id] && timeLeft[featuredPromo.id] !== 'Expired' && (
                  <div className="bg-red-600 rounded-lg p-4 mb-4 flex items-center gap-3">
                    <Clock className="w-6 h-6 animate-pulse" />
                    <div>
                      <div className="text-xs font-semibold">⚡ HURRY! ENDS IN</div>
                      <div className="text-2xl font-black">{timeLeft[featuredPromo.id]}</div>
                    </div>
                  </div>
                )}

                <Link
                  href={`/promotions/${featuredPromo.id}`}
                  className="inline-block bg-white text-orange-600 px-8 py-4 rounded-lg font-black text-lg hover:bg-orange-50 transition shadow-lg"
                >
                  Claim This Deal →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading promotions...</p>
          </div>
        ) : !promotions || promotions.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-12 text-center">
            <Tag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Active Promotions</h2>
            <p className="text-gray-600 mb-6">
              Check back soon for exciting offers and discounts!
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div>
            {otherPromos.length > 0 && (
              <h2 className="text-2xl font-bold mb-6 text-center">More Great Deals</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {otherPromos.map((promo) => (
              <Link
                key={promo.id}
                href={`/promotions/${promo.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group"
              >
                {/* Image */}
                {promo.imageUrl ? (
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
                    <Image
                      src={promo.imageUrl}
                      alt={promo.name}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Tag className="w-16 h-16 text-primary/30" />
                  </div>
                )}

                <div className="p-6">
                  {/* Social Proof - Usage Count */}
                  {settings?.show_promotion_usage_badges && promo.usageCount !== undefined && promo.usageCount > 0 && Math.floor(promo.usageCount * (settings.promotion_usage_inflation || 1.0)) > 0 && (
                    <div className="mb-3 inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                      <Users className="w-4 h-4" />
                      <span>{formatNumber(Math.floor(promo.usageCount * (settings.promotion_usage_inflation || 1.0)))} people used this</span>
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  <div className="inline-block bg-primary text-white px-4 py-2 rounded-full text-lg font-bold mb-3">
                    {getDiscountDisplay(promo)}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition">
                    {promo.name}
                  </h3>

                  {/* Description */}
                  {promo.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {promo.description}
                    </p>
                  )}

                  {/* Promo Code */}
                  {promo.code && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="text-xs text-blue-600 font-semibold mb-1">PROMO CODE</div>
                      <div className="text-lg font-mono font-bold text-blue-700">
                        {promo.code}
                      </div>
                    </div>
                  )}

                  {/* Eligibility */}
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{getEligibilityText(promo)}</span>
                  </div>

                  {/* Urgency - Time Left */}
                  {timeLeft[promo.id] && timeLeft[promo.id] !== 'Expired' && (
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-3 mb-3 shadow-md">
                      <div className="flex items-center gap-2 font-bold">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <div>
                          <div className="text-xs">⚡ ENDS IN</div>
                          <div className="text-lg font-black">{timeLeft[promo.id]}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expiry */}
                  {promo.endAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Expires {formatDate(promo.endAt)}</span>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-primary font-semibold group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          </div>
        )}

        {/* How to Use Section */}
        {promotions && promotions.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16 bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">How to Use Promotions</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Browse Offers</h3>
                <p className="text-sm text-gray-600">
                  Check eligibility and find the best promotion for your order
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Add to Cart</h3>
                <p className="text-sm text-gray-600">
                  Add products to your cart and proceed to checkout
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Apply & Save</h3>
                <p className="text-sm text-gray-600">
                  Enter promo code at checkout or discount applies automatically
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
