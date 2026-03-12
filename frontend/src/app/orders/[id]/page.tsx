'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, MapPin, Clock, CreditCard, Download } from 'lucide-react';
import { useOrder } from '@/lib/hooks/use-orders';
import { generateReceipt } from '@/lib/utils/receipt-generator';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We've received it and will process it shortly.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Order Number: <span className="font-mono font-semibold">{order.orderNumber}</span>
          </p>
          
          {/* Download Receipt Button */}
          <button
            onClick={() => generateReceipt({
              orderNumber: order.orderNumber,
              createdAt: order.createdAt,
              customerName: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Guest',
              customerEmail: order.user?.email || '',
              customerPhone: order.user?.phone,
              items: order.items.map((item: any) => ({
                productName: item.productName,
                variantName: item.variantName,
                quantity: item.quantity,
                productPrice: item.productPrice,
                subtotal: item.subtotal,
              })),
              subtotal: order.subtotal,
              deliveryFee: order.deliveryFee,
              total: order.total,
              fulfillmentType: order.fulfillmentType,
              address: order.address ? {
                line1: order.address.line1,
                line2: order.address.line2,
                city: order.address.city,
                postcode: order.address.postcode,
              } : undefined,
              deliverySlot: order.deliverySlot ? {
                date: order.deliverySlot.date,
                startTime: order.deliverySlot.startTime,
                endTime: order.deliverySlot.endTime,
              } : undefined,
              paymentMethod: order.paymentMethod || 'N/A',
              status: order.status,
            })}
            className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            <Download className="w-5 h-5" />
            Download Receipt
          </button>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Details
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{order.status.toLowerCase().replace('_', ' ')}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Fulfillment</p>
                <p className="font-semibold">
                  {order.fulfillmentType === 'DELIVERY' ? 'Home Delivery' : 'Store Collection'}
                </p>
              </div>

              {order.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </p>
                  <p className="text-sm">{order.address.line1}</p>
                  {order.address.line2 && <p className="text-sm">{order.address.line2}</p>}
                  <p className="text-sm">
                    {order.address.city}, {order.address.postcode}
                  </p>
                </div>
              )}

              {order.deliverySlot && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Delivery Time
                  </p>
                  <p className="text-sm">
                    {new Date(order.deliverySlot.date).toLocaleDateString()} 
                    {' '}{order.deliverySlot.startTime} - {order.deliverySlot.endTime}
                  </p>
                </div>
              )}

              {order.payment && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    Payment
                  </p>
                  <p className="text-sm capitalize">
                    {order.payment.paymentMethod.toLowerCase().replace('_', ' ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {order.payment.status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">Items Ordered</h2>

            <div className="space-y-3 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">
                    £{parseFloat(item.subtotal).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>£{parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(order.deliveryFee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>£{parseFloat(order.deliveryFee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">
                  £{parseFloat(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="max-w-4xl mx-auto mt-8 flex gap-4 justify-center">
          <Link
            href="/products"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition"
          >
            View All Orders
          </Link>
        </div>

        {/* What's Next */}
        <div className="max-w-2xl mx-auto mt-12 bg-muted/50 rounded-lg p-6">
          <h3 className="font-bold mb-3">What happens next?</h3>
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>We'll start picking your items from our store</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>You'll receive updates as your order progresses</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>
                {order.fulfillmentType === 'DELIVERY'
                  ? "We'll deliver to your address at the selected time"
                  : "You can collect from our store when ready"}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">4.</span>
              <span>Enjoy your fresh African & Caribbean groceries!</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
