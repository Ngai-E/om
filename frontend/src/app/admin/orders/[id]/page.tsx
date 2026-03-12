'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ArrowLeft, Printer, Package, Truck, CreditCard, User, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/orders/${orderId}`);
      return data;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Order not found</p>
          <Link href="/admin/orders" className="text-green-600 hover:underline mt-4 inline-block">
            Back to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
              <p className="text-sm text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <Printer className="w-4 h-4" />
            Print Order
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-4">
                      {item.product?.images && item.product.images.length > 0 && (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].altText || item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product?.name || 'Product'}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">£{parseFloat(item.price).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        £{(parseFloat(item.price) * item.quantity).toFixed(2)} total
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">£{parseFloat(order.subtotal || order.total).toFixed(2)}</span>
                </div>
                {order.deliveryFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">£{parseFloat(order.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>£{parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery/Collection Info */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {order.fulfillmentType === 'DELIVERY' ? 'Delivery Information' : 'Collection Information'}
              </h2>
              
              {order.fulfillmentType === 'DELIVERY' && order.deliveryAddress && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress.addressLine1}</p>
                      {order.deliveryAddress.addressLine2 && (
                        <p className="text-sm text-gray-600">{order.deliveryAddress.addressLine2}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
                      </p>
                    </div>
                  </div>
                  {order.deliverySlot && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Delivery Slot</p>
                        <p className="text-sm text-gray-600">
                          {typeof order.deliverySlot === 'object'
                            ? `${order.deliverySlot.startTime} - ${order.deliverySlot.endTime}`
                            : order.deliverySlot}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {order.fulfillmentType === 'COLLECTION' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Customer will collect from store</p>
                  {order.collectionDate && (
                    <p className="text-sm">
                      <span className="font-medium">Collection Date:</span>{' '}
                      {new Date(order.collectionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </h2>
              <div className="space-y-2">
                <p className="font-medium">
                  {order.user?.firstName} {order.user?.lastName}
                </p>
                <p className="text-sm text-gray-600">{order.user?.email}</p>
                {order.user?.phone && (
                  <p className="text-sm text-gray-600">{order.user.phone}</p>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{order.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-700'
                      : order.paymentStatus === 'FAILED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.paymentStatus || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-bold text-lg mb-4">Order Status</h2>
              <div className="space-y-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
                {order.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm mt-1">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide admin layout elements */
          aside,
          nav,
          [class*="sidebar"],
          [class*="AdminLayout"],
          button,
          .no-print {
            display: none !important;
          }
          
          /* Reset body for print */
          body {
            background: white !important;
          }
          
          /* Show main content */
          main {
            margin: 0 !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
          
          /* Print-specific styles */
          .print-order-header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          /* Ensure content is visible */
          * {
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
