'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Truck, Clock, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api/staff';
import { StaffLayout } from '@/components/staff/staff-layout';

export default function StaffOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['staff-orders', selectedStatus],
    queryFn: () => staffApi.getOrders(selectedStatus || undefined),
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  const statusFilters = [
    { label: 'All', value: '', color: 'bg-gray-500' },
    { label: 'New', value: 'RECEIVED', color: 'bg-blue-500' },
    { label: 'Picking', value: 'PICKING', color: 'bg-orange-500' },
    { label: 'Ready', value: 'OUT_FOR_DELIVERY', color: 'bg-green-500' },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      RECEIVED: { label: 'New', color: 'bg-blue-100 text-blue-700' },
      PICKING: { label: 'Picking', color: 'bg-orange-100 text-orange-700' },
      OUT_FOR_DELIVERY: { label: 'Ready', color: 'bg-green-100 text-green-700' },
      DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-700' },
    };

    const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-lg text-gray-600 mt-1">Manage and fulfill orders</p>
        </div>

        {/* Status Filters - Big Buttons */}
        <div className="flex gap-3 flex-wrap">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                selectedStatus === filter.value
                  ? `${filter.color} text-white shadow-lg`
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold text-lg">No orders found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2">
                <tr>
                  <th className="text-left p-4 font-bold text-base text-gray-700">Order #</th>
                  <th className="text-left p-4 font-bold text-base text-gray-700">Type</th>
                  <th className="text-left p-4 font-bold text-base text-gray-700">Time</th>
                  <th className="text-center p-4 font-bold text-base text-gray-700">Status</th>
                  <th className="text-right p-4 font-bold text-base text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => router.push(`/staff/orders/${order.id}`)}
                  >
                    <td className="p-4">
                      <div className="font-bold text-lg text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-600">
                        {order.user?.firstName} {order.user?.lastName}
                      </div>
                    </td>
                    <td className="p-4">
                      {order.fulfillmentType === 'DELIVERY' ? (
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-green-600" />
                          <span className="font-semibold">Delivery</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">Collection</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {order.deliverySlot ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-base">
                            {order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/staff/orders/${order.id}`);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer Phone Quick Access */}
        {orders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900 font-semibold">
              💡 Tip: Tap on any order to view details and update status
            </p>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
