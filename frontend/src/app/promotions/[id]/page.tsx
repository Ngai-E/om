'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi } from '@/lib/api/promotions';
import { settingsApi } from '@/lib/api/settings';
import { ArrowLeft, Calendar, Tag, Info, ShoppingCart, Check, Users } from 'lucide-react';
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

export default function PromotionDetailPage() {
  const params = useParams();
  const promotionId = params.id as string;
  const [copied, setCopied] = useState(false);

  const { data: promotion, isLoading, error } = useQuery({
    queryKey: ['promotion-public', promotionId],
    queryFn: () => promotionsApi.getPromotionById(promotionId),
  });

  // Fetch settings for social proof
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Promotion Not Found</h1>
          <p className="text-gray-600 mb-6">This promotion may have expired or been removed.</p>
          <Link
            href="/promotions"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
          >
            View All Promotions
          </Link>
        </div>
      </div>
    );
  }

  const getDiscountDisplay = () => {
    if (promotion.discountType === 'PERCENT') {
      return `${promotion.discountValue}% OFF`;
    }
    return `£${promotion.discountValue} OFF`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getEligibilityText = () => {
    const conditions = [];
    
    if (promotion.firstOrderOnly) {
      conditions.push('First order only');
    }
    
    if (promotion.minSubtotal) {
      conditions.push(`Minimum order £${promotion.minSubtotal}`);
    }
    
    if (promotion.allowedFulfillment) {
      conditions.push(`${promotion.allowedFulfillment.toLowerCase()} only`);
    }
    
    if (!promotion.allowGuests) {
      conditions.push('Account required');
    }
    
    return conditions;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/promotions"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Promotions
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Image */}
            {promotion.imageUrl ? (
              <div className="relative h-64 bg-gradient-to-br from-primary/10 to-primary/5">
                <Image
                  src={promotion.imageUrl}
                  alt={promotion.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Tag className="w-24 h-24 text-primary/30" />
              </div>
            )}

            {/* Details */}
            <div className="p-8">
              {/* Social Proof Badge */}
              {settings?.show_promotion_usage_badges && promotion.usageCount !== undefined && promotion.usageCount > 0 && (() => {
                const inflation = settings?.promotion_usage_inflation || 1.0;
                const displayCount = Math.floor(promotion.usageCount * inflation);
                return displayCount > 0 ? (
                  <div className="mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                    <Users className="w-4 h-4" />
                    <span>{formatNumber(displayCount)} people used this</span>
                  </div>
                ) : null;
              })()}
              
              {/* Discount Badge */}
              <div className="inline-block bg-primary text-white px-6 py-3 rounded-full text-2xl font-bold mb-4">
                {getDiscountDisplay()}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold mb-4">{promotion.name}</h1>

              {/* Description */}
              {promotion.description && (
                <p className="text-lg text-gray-700 mb-6">
                  {promotion.description}
                </p>
              )}

              {/* Promo Code */}
              {promotion.code && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-600 font-semibold mb-1">PROMO CODE</div>
                      <div className="text-3xl font-mono font-bold text-blue-700">
                        {promotion.code}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(promotion.code!);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        'Copy Code'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* How to Use */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-3">How to Use</h2>
                <ol className="space-y-2 text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-primary">1.</span>
                    <span>Add products to your cart</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary">2.</span>
                    <span>Proceed to checkout</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary">3.</span>
                    <span>
                      {promotion.code 
                        ? `Enter promo code "${promotion.code}" at checkout` 
                        : 'Discount will be applied automatically'}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-primary">4.</span>
                    <span>Complete your order and enjoy your savings!</span>
                  </li>
                </ol>
              </div>

              {/* Eligibility & Terms */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Eligibility & Terms
                </h2>
                <ul className="space-y-2 text-gray-700">
                  {getEligibilityText().map((condition, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{condition}</span>
                    </li>
                  ))}
                  {promotion.applyToSubtotal && (
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Discount applies to product subtotal</span>
                    </li>
                  )}
                  {promotion.applyToDeliveryFee && (
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Discount applies to delivery fee</span>
                    </li>
                  )}
                  {promotion.maxDiscountPerOrder && (
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Maximum discount per order: £{promotion.maxDiscountPerOrder}</span>
                    </li>
                  )}
                  {promotion.endAt && (
                    <li className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-primary mt-1" />
                      <span>Valid until {formatDate(promotion.endAt)}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* CTA */}
              <div className="mt-8 flex gap-4">
                <Link
                  href="/products"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition font-semibold text-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Start Shopping
                </Link>
                <Link
                  href="/promotions"
                  className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  View More Offers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
