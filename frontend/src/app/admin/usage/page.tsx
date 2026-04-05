'use client';

import { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface UsageStats {
  products: {
    current: number;
    limit: number | null;
    percentage: number;
  };
  staff: {
    current: number;
    limit: number | null;
    percentage: number;
  };
  orders: {
    total: number;
  };
  customers: {
    total: number;
  };
}

interface PlanDetails {
  planCode: string;
  planName: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
}

export default function UsageDashboardPage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      
      // Fetch usage stats
      const usageResponse = await fetch('/api/usage/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData);
      }

      // Fetch current plan
      const planResponse = await fetch('/api/entitlements/current-plan', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (planResponse.ok) {
        const planData = await planResponse.json();
        setPlan(planData);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-700';
    if (percentage >= 75) return 'text-yellow-700';
    return 'text-green-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Usage & Limits</h1>
          <p className="text-gray-600 mt-2">Monitor your plan usage and limits</p>
        </div>

        {/* Current Plan */}
        {plan && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{plan.planName} Plan</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Status: <span className="font-medium">{plan.status}</span>
                </p>
                {plan.trialEndsAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    Trial ends: {new Date(plan.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        )}

        {/* Usage Stats Grid */}
        {usage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Products Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Products</h3>
                    <p className="text-sm text-gray-600">
                      {usage.products.current} of {usage.products.limit || '∞'} used
                    </p>
                  </div>
                </div>
                {usage.products.percentage >= 90 && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              {usage.products.limit && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(usage.products.percentage)}`}
                      style={{ width: `${Math.min(usage.products.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className={`text-sm font-medium ${getProgressTextColor(usage.products.percentage)}`}>
                    {usage.products.percentage}% used
                  </p>
                  {usage.products.percentage >= 90 && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ You're approaching your product limit. Consider upgrading your plan.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Staff Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Staff Members</h3>
                    <p className="text-sm text-gray-600">
                      {usage.staff.current} of {usage.staff.limit || '∞'} used
                    </p>
                  </div>
                </div>
                {usage.staff.percentage >= 90 && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              {usage.staff.limit && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(usage.staff.percentage)}`}
                      style={{ width: `${Math.min(usage.staff.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className={`text-sm font-medium ${getProgressTextColor(usage.staff.percentage)}`}>
                    {usage.staff.percentage}% used
                  </p>
                  {usage.staff.percentage >= 90 && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ You're approaching your staff limit. Consider upgrading your plan.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Orders Total */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Total Orders</h3>
                  <p className="text-sm text-gray-600">All time</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{usage.orders.total}</p>
            </div>

            {/* Customers Total */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Total Customers</h3>
                  <p className="text-sm text-gray-600">All time</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{usage.customers.total}</p>
            </div>
          </div>
        )}

        {/* Plan Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Unlimited orders</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Unlimited customers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Custom branding</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Email support</span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Need more capacity?</h2>
          <p className="mb-4">Upgrade to a higher plan to unlock more products, staff, and features.</p>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            View Plans & Pricing
          </button>
        </div>
      </div>
    </div>
  );
}
