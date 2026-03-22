'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Eye, Printer, CheckCircle, Calendar, CreditCard, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { AdminLayout } from '@/components/admin/admin-layout';
import { StatusUpdateModal } from '@/components/admin/status-update-modal';
import { OrderDetailDrawer } from '@/components/admin/order-detail-drawer';
import { Toast } from '@/components/ui/toast';

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [phoneOrdersOnly, setPhoneOrdersOnly] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const queryClient = useQueryClient();
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', page, pageSize, phoneOrdersOnly],
    queryFn: () => adminApi.getAllOrders(page, pageSize, {
      isPhoneOrder: phoneOrdersOnly ? true : undefined,
    }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setStatusModalOpen(false);
      setSelectedOrder(null);
      setToast({ message: 'Order status updated successfully', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Failed to update order status', type: 'error' });
    },
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const filteredOrders = ordersData?.data.filter((order: any) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.user.firstName} ${order.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(order.status);
    const matchesDeliveryDate = !deliveryDate || order.deliveryDate?.startsWith(deliveryDate);
    const matchesPayment = !paymentStatusFilter || order.paymentStatus === paymentStatusFilter;
    const matchesFulfillment = !fulfillmentFilter || order.fulfillmentType === fulfillmentFilter;
    const matchesPhoneOrder = !phoneOrdersOnly || order.isPhoneOrder === true;
    
    return matchesSearch && matchesStatus && matchesDeliveryDate && matchesPayment && matchesFulfillment && matchesPhoneOrder;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </AdminLayout>
    );
  }

  const statuses = [
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'PROCESSING', label: 'Processing', color: 'bg-blue-100 text-blue-700' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
    { value: 'READY_FOR_COLLECTION', label: 'Ready for Collection', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">Filters</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Order # or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            {/* Delivery Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            {/* Payment Status */}
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none"
              >
                <option value="">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Fulfillment Type */}
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={fulfillmentFilter}
                onChange={(e) => setFulfillmentFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none"
              >
                <option value="">Delivery & Collection</option>
                <option value="DELIVERY">Delivery Only</option>
                <option value="COLLECTION">Collection Only</option>
              </select>
            </div>

            {/* Phone Orders Only */}
            <div className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                id="phoneOrders"
                checked={phoneOrdersOnly}
                onChange={(e) => setPhoneOrdersOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="phoneOrders" className="text-sm font-medium text-gray-700">
                Phone Orders Only
              </label>
            </div>
          </div>

          {/* Status Multi-Select */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Order Status (multi-select)</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => toggleStatusFilter(status.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    statusFilters.includes(status.value)
                      ? status.color + ' ring-2 ring-offset-1 ring-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">Order #</th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">Customer</th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">Delivery / Collection</th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">Time Slot</th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">Payment Status</th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">Order Status</th>
                  <th className="text-right p-4 font-semibold text-sm text-gray-700">Total</th>
                  <th className="text-center p-4 font-semibold text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders?.map((order: any) => {
                  const statusConfig = statuses.find(s => s.value === order.status);
                  return (
                    <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4">
                        <span className="font-mono font-semibold text-gray-900">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.user.firstName} {order.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{order.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {order.fulfillmentType === 'DELIVERY' ? (
                            <>
                              <Truck className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium">Delivery</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg">🏪</span>
                              <span className="text-sm font-medium">Collection</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-700">
                          {typeof order.deliverySlot === 'object' && order.deliverySlot?.startTime
                            ? `${order.deliverySlot.startTime} - ${order.deliverySlot.endTime}`
                            : order.deliverySlot || order.deliveryDate || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.payment?.status === 'SUCCEEDED'
                              ? 'bg-green-100 text-green-700'
                              : order.payment?.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.payment?.status || 'PENDING'}
                          </span>
                          {order.payment?.paymentMethod && (
                            <p className="text-xs text-gray-500">
                              {order.payment.paymentMethod === 'CARD' ? '💳 Card' :
                               order.payment.paymentMethod === 'CASH_ON_DELIVERY' ? '💵 Cash on Delivery' :
                               order.payment.paymentMethod === 'PAY_IN_STORE' ? '🏪 Pay in Store' :
                               order.payment.paymentMethod}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusConfig?.color || 'bg-gray-100 text-gray-700'
                        }`}>
                          {statusConfig?.label || order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-gray-900">
                          £{parseFloat(order.total).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setDrawerOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setStatusModalOpen(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Update Status"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!filteredOrders || filteredOrders.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          )}
        </div>

        {/* Pagination */}
        {ordersData?.pagination && ordersData.pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-muted-foreground ml-4">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, ordersData.pagination.total)} of {ordersData.pagination.total} orders
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                First
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="px-4 py-1.5 text-sm">
                Page {page} of {ordersData.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === ordersData.pagination.totalPages}
                className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
              <button
                onClick={() => setPage(ordersData.pagination.totalPages)}
                disabled={page === ordersData.pagination.totalPages}
                className="px-3 py-1.5 border rounded-lg hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Last
              </button>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {selectedOrder && (
          <StatusUpdateModal
            isOpen={statusModalOpen}
            onClose={() => {
              setStatusModalOpen(false);
              setSelectedOrder(null);
            }}
            onUpdate={(status) => handleStatusChange(selectedOrder.id, status)}
            currentStatus={selectedOrder.status}
            orderNumber={selectedOrder.orderNumber}
          />
        )}

        {/* Order Detail Drawer */}
        <OrderDetailDrawer
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedOrderId('');
          }}
          orderId={selectedOrderId}
        />

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
