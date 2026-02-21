'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Home, ArrowRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [countdown, setCountdown] = useState(10);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-confirmation', orderId],
    queryFn: () => adminApi.getOrderDetails(orderId!),
    enabled: !!orderId,
    refetchInterval: 5000, // Refetch every 5 seconds to check payment status
  });

  // Countdown to redirect
  useEffect(() => {
    if (order && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0) {
      router.push('/');
    }
  }, [countdown, order, router]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Order</h1>
          <p className="text-gray-600 mb-6">No order ID provided.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your order. Please contact support if you need assistance.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.payment?.status === 'SUCCEEDED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPaid ? 'Payment Successful!' : 'Order Received!'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isPaid 
              ? 'Thank you for your payment. Your order is confirmed!'
              : 'Your order has been placed and is awaiting payment confirmation.'}
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Order Number</p>
              <p className="text-xl font-bold text-gray-900">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-xl font-bold text-green-600">£{parseFloat(order.total).toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Order Status</p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {order.status.replace(/_/g, ' ')}
              </span>
              {isPaid && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  PAID
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delivery/Collection Info */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            {order.fulfillmentType === 'DELIVERY' ? (
              <>
                <Truck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Delivery Details</h3>
                  {order.address && (
                    <div className="text-sm text-gray-700">
                      <p>{order.address.line1}</p>
                      {order.address.line2 && <p>{order.address.line2}</p>}
                      <p>{order.address.city}, {order.address.postcode}</p>
                    </div>
                  )}
                  {order.deliverySlot && (
                    <p className="text-sm text-gray-600 mt-2">
                      Delivery Slot: {order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Collection</h3>
                  <p className="text-sm text-gray-700">You can collect your order from our store.</p>
                  {order.deliverySlot && (
                    <p className="text-sm text-gray-600 mt-2">
                      Collection Time: {order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="border rounded-xl mb-6">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-bold text-gray-900">Order Items</h3>
          </div>
          <div className="divide-y">
            {order.items?.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  £{(parseFloat(item.productPrice) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-4 py-3 border-t">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-green-600">
                £{parseFloat(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>You will receive an email confirmation shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>We'll notify you when your order is being prepared</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                {order.fulfillmentType === 'DELIVERY' 
                  ? "You'll get an update when your order is out for delivery"
                  : "We'll let you know when your order is ready for collection"}
              </span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            <Home className="w-5 h-5" />
            Continue Shopping
          </Link>
          <Link
            href="/account/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            <Package className="w-5 h-5" />
            View My Orders
          </Link>
        </div>

        {/* Auto-redirect notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Redirecting to homepage in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your order confirmation.</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
