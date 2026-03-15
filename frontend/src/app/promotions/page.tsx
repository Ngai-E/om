'use client';

import { useQuery } from '@tanstack/react-query';
import { promotionsApi, Promotion } from '@/lib/api/promotions';
import { Tag, Calendar, Gift, TrendingUp, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PromotionsPage() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: () => promotionsApi.getActivePromotions(),
  });

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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Gift className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Active Promotions</h1>
            <p className="text-lg opacity-90">
              Save more on your orders with our exclusive offers and discounts
            </p>
          </div>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {promotions.map((promo) => (
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
