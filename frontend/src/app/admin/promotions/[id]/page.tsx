'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi } from '@/lib/api/promotions';
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function PromotionStatsPage() {
  const params = useParams();
  const promotionId = params.id as string;

  const { data: promotion, isLoading } = useQuery({
    queryKey: ['promotion', promotionId],
    queryFn: () => promotionsApi.getPromotion(promotionId),
  });

  const { data: redemptions } = useQuery({
    queryKey: ['promotion-redemptions', promotionId],
    queryFn: () => promotionsApi.getPromotionRedemptions(promotionId),
  });

  if (isLoading || !promotion) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const stats = promotion.stats || {
    totalRedemptions: 0,
    totalDiscountGiven: 0,
    percentUsed: 0,
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/promotions"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Promotions
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{promotion.name}</h1>
              <p className="text-gray-600">{promotion.description}</p>
            </div>
            <Link
              href={`/admin/promotions/${promotionId}/edit`}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Edit Promotion
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Uses</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalRedemptions}</p>
            {promotion.maxTotalRedemptions && (
              <p className="text-sm text-gray-500 mt-1">
                of {promotion.maxTotalRedemptions} limit
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Discount Given</span>
            </div>
            <p className="text-3xl font-bold">£{stats.totalDiscountGiven.toFixed(2)}</p>
            {promotion.maxTotalDiscountAmount && (
              <p className="text-sm text-gray-500 mt-1">
                of £{promotion.maxTotalDiscountAmount} limit
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Budget Used</span>
            </div>
            <p className="text-3xl font-bold">{stats.percentUsed.toFixed(0)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  stats.percentUsed >= 90 ? 'bg-red-600' :
                  stats.percentUsed >= 70 ? 'bg-yellow-600' :
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-600">Status</span>
            </div>
            <p className="text-2xl font-bold capitalize">{promotion.status.toLowerCase()}</p>
            {promotion.endAt && (
              <p className="text-sm text-gray-500 mt-1">
                Ends {new Date(promotion.endAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Promotion Details */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Promotion Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Discount Type:</span>
              <p className="font-medium">
                {promotion.discountType === 'PERCENT' 
                  ? `${promotion.discountValue}% OFF` 
                  : `£${promotion.discountValue} OFF`}
              </p>
            </div>
            {promotion.code && (
              <div>
                <span className="text-sm text-gray-600">Promo Code:</span>
                <p className="font-medium font-mono">{promotion.code}</p>
              </div>
            )}
            {promotion.minSubtotal && (
              <div>
                <span className="text-sm text-gray-600">Minimum Order:</span>
                <p className="font-medium">£{promotion.minSubtotal}</p>
              </div>
            )}
            {promotion.maxRedemptionsPerUser && (
              <div>
                <span className="text-sm text-gray-600">Per User Limit:</span>
                <p className="font-medium">{promotion.maxRedemptionsPerUser} uses</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">First Order Only:</span>
              <p className="font-medium">{promotion.firstOrderOnly ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Allow Guests:</span>
              <p className="font-medium">{promotion.allowGuests ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Recent Redemptions */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Redemptions</h2>
          {redemptions && redemptions.data && redemptions.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.data.slice(0, 10).map((redemption: any) => (
                    <tr key={redemption.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(redemption.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {redemption.order?.orderNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {redemption.user?.email || 'Guest'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                        -£{redemption.discountAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No redemptions yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
