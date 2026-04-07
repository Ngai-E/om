'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Users, ShoppingCart, DollarSign, TrendingUp, Box, Plus, Upload, Truck, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getDashboardStats,
    retry: false, // Don't retry on failure (e.g., 401)
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  useEffect(() => {
    // Only redirect if we know the user is authenticated but not an admin
    // Don't redirect while auth is still loading (user === null)
    if (isAuthenticated && user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/');
    }
  }, [user, isAuthenticated, router]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  // Get data from API with fallbacks
  const newOrdersToday = stats?.newOrdersToday ?? 0;
  const pendingPayment = stats?.pendingPayment ?? 0;
  const lowStockItems = stats?.lowStockItems ?? 0;
  const todayRevenue = stats?.todayRevenue ? parseFloat(stats.todayRevenue) : 0;

  // Orders by status - use API data or fallback
  const ordersByStatus = stats?.ordersByStatus ?? [
    { status: 'PENDING', count: 0 },
    { status: 'PROCESSING', count: 0 },
    { status: 'OUT_FOR_DELIVERY', count: 0 },
    { status: 'COMPLETED', count: 0 },
  ];

  // Map status to colors and display names
  const statusConfig: Record<string, { color: string; label: string }> = {
    'PENDING': { color: 'bg-yellow-500', label: 'Pending' },
    'PROCESSING': { color: 'bg-blue-500', label: 'Processing' },
    'OUT_FOR_DELIVERY': { color: 'bg-purple-500', label: 'Out for Delivery' },
    'COMPLETED': { color: 'bg-green-500', label: 'Completed' },
    'CANCELLED': { color: 'bg-red-500', label: 'Cancelled' },
  };

  // Delivery slots - use API data or fallback
  const deliverySlots = stats?.deliverySlots ?? [
    { time: '9-11am', used: 0, capacity: 10 },
    { time: '11am-1pm', used: 0, capacity: 10 },
    { time: '1-3pm', used: 0, capacity: 10 },
    { time: '3-5pm', used: 0, capacity: 10 },
  ];

  // Calculate total orders for percentage bars
  const totalOrders = ordersByStatus.reduce((sum, item) => sum + item.count, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">New Orders Today</p>
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{newOrdersToday}</p>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pending Payment</p>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingPayment}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <Package className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{lowStockItems}</p>
            <p className="text-xs text-gray-500 mt-1">Need restocking</p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">£{todayRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">From {newOrdersToday} orders</p>
          </div>
        </div>

        {/* Second Row - Orders by Status & Delivery Slots */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Orders by Status</h3>
            <div className="space-y-4">
              {ordersByStatus.map((item) => {
                const config = statusConfig[item.status] || { color: 'bg-gray-500', label: item.status };
                const percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{config.label}</span>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${config.color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Slot Utilization */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Delivery Slots Utilization</h3>
            <div className="space-y-4">
              {deliverySlots.map((slot, index) => {
                const percentage = (slot.used / slot.capacity) * 100;
                return (
                  <div key={`${slot.time}-${index}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{slot.time}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {slot.used}/{slot.capacity} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage >= 100
                            ? 'bg-red-500'
                            : percentage >= 80
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition group"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Add Product</p>
                <p className="text-xs text-gray-500">Create new item</p>
              </div>
            </Link>

            <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Import Products</p>
                <p className="text-xs text-gray-500">Upload CSV</p>
              </div>
            </button>

            <Link
              href="/admin/delivery"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                <Truck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Delivery Zones</p>
                <p className="text-xs text-gray-500">Manage areas</p>
              </div>
            </Link>

            <Link
              href="/staff/phone-order"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition group"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Phone Order</p>
                <p className="text-xs text-gray-500">Create order</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
