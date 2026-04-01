'use client';

import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@/lib/api/platform';
import { Store, Users, ShoppingCart, Package, TrendingUp, AlertTriangle } from 'lucide-react';

export default function PlatformDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => platformApi.getPlatformStats(),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['platform-tenants-recent'],
    queryFn: () => platformApi.getTenants(1, 5),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tenants',
      value: stats?.totalTenants ?? 0,
      icon: Store,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Tenants',
      value: stats?.activeTenants ?? 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Trial Tenants',
      value: stats?.trialTenants ?? 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      label: 'Total Products',
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of all tenants and platform health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tenants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Store</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Slug</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Billing</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Products</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenantsData?.data?.map((tenant: any) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{tenant.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      tenant.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      tenant.billingStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                      tenant.billingStatus === 'TRIAL' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {tenant.billingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tenant._count?.products ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tenant._count?.orders ?? 0}</td>
                </tr>
              ))}
              {(!tenantsData?.data || tenantsData.data.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No tenants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
