'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { accountApi } from '@/lib/api/account';
import { ordersApi } from '@/lib/api/orders';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { MapPin, Clock, CreditCard, Truck, Store } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useCreateOrder } from '@/lib/hooks/use-orders';
import { useQuery } from '@tanstack/react-query';
import { useDeliverySlots } from '@/lib/hooks/use-delivery';
import { PaymentForm } from '@/components/checkout/payment-form';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, hideToast, error } = useToast();
  const { data: cart, isLoading: cartLoading } = useCart();
  const createOrder = useCreateOrder();
  
  const [step, setStep] = useState<'address' | 'delivery' | 'payment'>('address');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'COLLECTION'>('DELIVERY');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH_ON_DELIVERY' | 'PAY_IN_STORE'>('CASH_ON_DELIVERY');

  // Fetch addresses
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: accountApi.getAddresses,
  });

  // Fetch delivery slots if delivery selected
  const selectedAddress = addresses?.find(a => a.id === selectedAddressId);
  const { data: slotsData } = useDeliverySlots(
    selectedAddress?.deliveryZone?.id,
    new Date().toISOString().split('T')[0]
  );

  const handlePlaceOrder = async () => {
    if (!cart) return;

    try {
      const orderData: any = {
        fulfillmentType,
        notes: '',
      };

      if (fulfillmentType === 'DELIVERY') {
        if (!selectedAddressId || !selectedSlotId) {
          error('Please select delivery address and time slot');
          return;
        }
        orderData.addressId = selectedAddressId;
        orderData.deliverySlotId = selectedSlotId;
      }

      const order = await createOrder.mutateAsync(orderData);
      
      // Redirect to order confirmation
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create order');
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
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
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Fulfillment Type */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Fulfillment Method
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFulfillmentType('DELIVERY')}
                  className={`p-4 border-2 rounded-lg transition ${
                    fulfillmentType === 'DELIVERY'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Truck className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Delivery</p>
                  <p className="text-sm text-muted-foreground">To your door</p>
                </button>

                <button
                  onClick={() => setFulfillmentType('COLLECTION')}
                  className={`p-4 border-2 rounded-lg transition ${
                    fulfillmentType === 'COLLECTION'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Store className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Collection</p>
                  <p className="text-sm text-muted-foreground">Pick up in store</p>
                </button>
              </div>
            </div>

            {/* Step 2: Address (if delivery) */}
            {fulfillmentType === 'DELIVERY' && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </h2>

                {addresses && addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`w-full text-left p-4 border-2 rounded-lg transition ${
                          selectedAddressId === address.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-semibold">{address.label}</p>
                        <p className="text-sm">{address.line1}</p>
                        {address.line2 && <p className="text-sm">{address.line2}</p>}
                        <p className="text-sm">
                          {address.city}, {address.postcode}
                        </p>
                        {address.deliveryZone && (
                          <p className="text-xs text-primary mt-1">
                            {address.deliveryZone.name} - £{parseFloat(address.deliveryZone.deliveryFee).toFixed(2)}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No saved addresses</p>
                    <Link
                      href="/account/addresses"
                      className="text-primary hover:underline"
                    >
                      Add an address
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Delivery Slot (if delivery) */}
            {fulfillmentType === 'DELIVERY' && selectedAddressId && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Delivery Time
                </h2>

                {slotsData && slotsData.slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {slotsData.slots.map((slot) => {
                      const slotsLeft = slot.capacity - slot.currentOrders;
                      const isLowCapacity = slotsLeft <= 3 && slotsLeft > 0;
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          disabled={!slot.available}
                          className={`p-3 border-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedSlotId === slot.id
                              ? 'border-primary bg-primary/5'
                              : !slot.available
                              ? 'border-red-200 bg-red-50'
                              : isLowCapacity
                              ? 'border-orange-200 bg-orange-50 hover:border-orange-400'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-semibold text-sm">{slot.displayTime}</p>
                          {!slot.available ? (
                            <p className="text-xs text-red-600 font-medium">Fully Booked</p>
                          ) : isLowCapacity ? (
                            <p className="text-xs text-orange-600 font-medium">
                              Only {slotsLeft} left!
                            </p>
                          ) : (
                            <p className="text-xs text-green-600">
                              {slotsLeft} slots available
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No delivery slots available</p>
                )}
              </div>
            )}

            {/* Step 4: Payment Method */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`w-full text-left p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'CARD'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold">Card Payment</p>
                  <p className="text-sm text-muted-foreground">Pay securely with Stripe</p>
                </button>

                <button
                  onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className={`w-full text-left p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                </button>

                <button
                  onClick={() => setPaymentMethod('PAY_IN_STORE')}
                  className={`w-full text-left p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'PAY_IN_STORE'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold">Pay in Store</p>
                  <p className="text-sm text-muted-foreground">Pay when you collect</p>
                </button>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'CARD' && (
                <div className="mt-6 p-6 bg-muted/20 rounded-lg">
                  <h3 className="font-semibold mb-4">Enter Card Details</h3>
                  <PaymentForm
                    amount={
                      parseFloat(cart?.subtotal.toString() || '0') +
                      (fulfillmentType === 'DELIVERY' && selectedAddress?.deliveryZone
                        ? parseFloat(selectedAddress.deliveryZone.deliveryFee)
                        : 0)
                    }
                    onSuccess={(paymentIntentId) => {
                      console.log('Payment successful:', paymentIntentId);
                      handlePlaceOrder();
                    }}
                    onError={(err) => {
                      error(`Payment failed: ${err}`);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>£{(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>£{parseFloat(cart.subtotal.toString()).toFixed(2)}</span>
                </div>
                {fulfillmentType === 'DELIVERY' && selectedAddress?.deliveryZone && (
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>£{parseFloat(selectedAddress.deliveryZone.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">
                    £{(
                      parseFloat(cart.subtotal.toString()) +
                      (fulfillmentType === 'DELIVERY' && selectedAddress?.deliveryZone
                        ? parseFloat(selectedAddress.deliveryZone.deliveryFee)
                        : 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {paymentMethod !== 'CARD' && (
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    createOrder.isPending ||
                    (fulfillmentType === 'DELIVERY' && (!selectedAddressId || !selectedSlotId))
                  }
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createOrder.isPending ? 'Placing Order...' : 'Place Order'}
                </button>
              )}

              {paymentMethod === 'CARD' && (
                <p className="text-sm text-center text-muted-foreground">
                  Complete payment above to place your order
                </p>
              )}

              <Link
                href="/cart"
                className="block text-center text-sm text-muted-foreground hover:text-primary mt-4"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
