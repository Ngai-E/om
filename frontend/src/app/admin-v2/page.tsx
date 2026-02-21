'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  Upload,
  Truck,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  PackageX
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardV2() {
  // Mock data (would come from API)
  const stats = {
    newOrdersToday: 12,
    pendingPayment: 3,
    lowStockItems: 5,
    todayRevenue: 1247.50,
  };

  const ordersByStatus = {
    pending: 3,
    confirmed: 8,
    preparing: 4,
    outForDelivery: 2,
    delivered: 15,
    cancelled: 1,
  };

  const deliverySlots = [
    { time: '9:00 - 11:00', capacity: 10, booked: 8, percentage: 80 },
    { time: '11:00 - 13:00', capacity: 10, booked: 10, percentage: 100 },
    { time: '13:00 - 15:00', capacity: 10, booked: 5, percentage: 50 },
    { time: '15:00 - 17:00', capacity: 10, booked: 3, percentage: 30 },
  ];

  const recentOrders = [
    { id: '#1234', customer: 'Sarah Johnson', total: 45.50, status: 'pending', time: '10 mins ago' },
    { id: '#1233', customer: 'Mike Brown', total: 67.20, status: 'confirmed', time: '25 mins ago' },
    { id: '#1232', customer: 'Emma Davis', total: 32.80, status: 'preparing', time: '1 hour ago' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Top Row - Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/orders?date=today" className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.newOrdersToday}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">New Orders Today</h3>
          </Link>

          <Link href="/admin/orders?status=pending" className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.pendingPayment}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Pending Payment</h3>
          </Link>

          <Link href="/admin/inventory?filter=low" className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.lowStockItems}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Low Stock Items</h3>
          </Link>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">£{stats.todayRevenue.toFixed(2)}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Today's Revenue</h3>
          </div>
        </div>

        {/* Second Row - Orders by Status & Delivery Slots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ordersByStatus.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Confirmed</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ordersByStatus.confirmed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">Preparing</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ordersByStatus.preparing}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-700">Out for Delivery</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ordersByStatus.outForDelivery}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Delivered</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ordersByStatus.delivered}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-700">Cancelled</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ordersByStatus.cancelled}</span>
              </div>
            </div>
          </div>

          {/* Delivery Slots Utilisation */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Delivery Slots</h2>
            <div className="space-y-4">
              {deliverySlots.map((slot) => (
                <div key={slot.time}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{slot.time}</span>
                    <span className="text-sm text-gray-600">{slot.booked}/{slot.capacity}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        slot.percentage >= 100 ? 'bg-red-500' :
                        slot.percentage >= 80 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${slot.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/admin/products/new"
                className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <Plus className="w-5 h-5 text-green-600" />
                Add Product
              </Link>
              <Link
                href="/admin/products/import"
                className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                Import Products (CSV)
              </Link>
              <Link
                href="/admin/delivery"
                className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <Truck className="w-5 h-5 text-purple-600" />
                Manage Delivery Zones
              </Link>
              <Link
                href="/staff/phone-order"
                className="flex items-center gap-3 p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <Phone className="w-5 h-5 text-orange-600" />
                Create Phone Order
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id.replace('#', '')}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{order.id}</p>
                      <p className="text-xs text-gray-500">{order.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">£{order.total.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 w-20 text-right">{order.time}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
