'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { accountApi } from '@/lib/api/account';
import { ordersApi } from '@/lib/api/orders';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { MapPin, Clock, CreditCard, Truck, Store, AlertCircle, ShoppingBag, TrendingUp } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useCreateOrder } from '@/lib/hooks/use-orders';
import { useQuery } from '@tanstack/react-query';
import { useDeliverySlots } from '@/lib/hooks/use-delivery';
import { StripePaymentElement } from '@/components/checkout/stripe-payment-element';
import { useCartValidation } from '@/lib/hooks/use-cart-validation';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { toast, hideToast, error } = useToast();
  const { data: cart, isLoading: cartLoading } = useCart();
  const createOrder = useCreateOrder();
  
  const [step, setStep] = useState<'address' | 'delivery' | 'payment'>('address');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'COLLECTION'>('DELIVERY');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH_ON_DELIVERY' | 'PAY_IN_STORE'>('CASH_ON_DELIVERY');

  // Fetch enabled payment methods
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  const enabledPaymentTypes = paymentSettings?.enabled_payment_types || ['card', 'cash_on_delivery', 'pay_in_store'];

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

  // Validate cart against delivery zone requirements
  const { data: cartValidation } = useCartValidation(
    fulfillmentType === 'DELIVERY' ? selectedAddressId : undefined
  );

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (!cart) return;

    // Validate based on payment method
    if (paymentMethod === 'CARD') {
      if (fulfillmentType === 'DELIVERY' && (!selectedAddressId || !selectedSlotId)) {
        error('Please select delivery address and time slot');
        return;
      }
      
      // For card payments, create order first then handle payment
      await handleCardPayment();
    } else {
      // For non-card payments, create order directly
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
        
        // Store order number for success page
        sessionStorage.setItem('orderNumber', order.orderNumber);
        
        // Redirect to order confirmation
        router.push(`/orders/${order.id}`);
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to create order');
      }
    }
  };

  const handleCardPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Create order first
      const orderData: any = {
        fulfillmentType,
        notes: '',
      };

      if (fulfillmentType === 'DELIVERY') {
        orderData.addressId = selectedAddressId;
        orderData.deliverySlotId = selectedSlotId;
      }

      const order = await createOrder.mutateAsync(orderData);
      
      // Store order number for success page
      sessionStorage.setItem('orderNumber', order.orderNumber);

      // Create payment
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout/cancel`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const paymentData = await response.json();

      if (paymentData.type === 'redirect') {
        // Stripe Checkout - redirect to Stripe
        window.location.href = paymentData.url;
      } else if (paymentData.type === 'client_secret') {
        // Stripe Elements - show payment form
        setPaymentClientSecret(paymentData.clientSecret);
      }
    } catch (err: any) {
      error(err.message || 'Failed to process payment');
      setIsProcessingPayment(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Don't show empty cart message if we're processing payment (order already created)
  if ((!cart || cart.items.length === 0) && !isProcessingPayment && !paymentClientSecret) {
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

  // Show processing state while creating order and payment
  if (isProcessingPayment && !paymentClientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Creating your order...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait, you'll be redirected to payment</p>
        </div>
      </div>
    );
  }

  // Safety check for TypeScript
  if (!cart) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-4 lg:py-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Steps */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-4 lg:space-y-6">
            {/* Step 1: Fulfillment Type */}
            <div className="bg-card border rounded-lg p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 lg:w-5 lg:h-5" />
                Fulfillment Method
              </h2>
              
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <button
                  onClick={() => setFulfillmentType('DELIVERY')}
                  className={`p-4 border-2 rounded-lg transition ${
                    fulfillmentType === 'DELIVERY'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Truck className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2" />
                  <p className="font-semibold text-sm lg:text-base">Delivery</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">To your door</p>
                </button>

                <button
                  onClick={() => setFulfillmentType('COLLECTION')}
                  className={`p-4 border-2 rounded-lg transition ${
                    fulfillmentType === 'COLLECTION'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Store className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2" />
                  <p className="font-semibold text-sm lg:text-base">Collection</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Pick up in store</p>
                </button>
              </div>
            </div>

            {/* Step 2: Address (if delivery) */}
            {fulfillmentType === 'DELIVERY' && (
              <div className="bg-card border rounded-lg p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
                  Delivery Address
                </h2>

                {addresses && addresses.length > 0 ? (
                  <div className="space-y-2 lg:space-y-3">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`w-full text-left p-3 lg:p-4 border-2 rounded-lg transition ${
                          selectedAddressId === address.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-semibold text-sm lg:text-base">{address.label}</p>
                        <p className="text-xs lg:text-sm">{address.line1}</p>
                        {address.line2 && <p className="text-xs lg:text-sm">{address.line2}</p>}
                        <p className="text-xs lg:text-sm">
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
              <div className="bg-card border rounded-lg p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
                  Delivery Time
                </h2>

                {slotsData && slotsData.slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 lg:gap-3">
                    {slotsData.slots.map((slot) => {
                      const slotsLeft = slot.capacity - slot.currentOrders;
                      const isLowCapacity = slotsLeft <= 3 && slotsLeft > 0;
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          disabled={!slot.available}
                          className={`p-2 lg:p-3 border-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedSlotId === slot.id
                              ? 'border-primary bg-primary/5'
                              : !slot.available
                              ? 'border-red-200 bg-red-50'
                              : isLowCapacity
                              ? 'border-orange-200 bg-orange-50 hover:border-orange-400'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-semibold text-xs lg:text-sm">{slot.displayTime}</p>
                          {!slot.available ? (
                            <p className="text-xs text-red-600 font-medium">Fully Booked</p>
                          ) : isLowCapacity ? (
                            <p className="text-xs text-orange-600 font-medium">
                              Only {slotsLeft} left!
                            </p>
                          ) : (
                            <p className="text-xs text-green-600">
                              {slotsLeft} available
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No delivery slots available for your area</p>
                    {!selectedAddress?.deliveryZone && (
                      <p className="text-sm text-destructive">
                        Your address is not in a delivery zone. Please contact support.
                      </p>
                    )}
                    {selectedAddress?.deliveryZone && (
                      <p className="text-sm text-muted-foreground">
                        Delivery zone: {selectedAddress.deliveryZone.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cart Validation Alert */}
            {fulfillmentType === 'DELIVERY' && selectedAddressId && cartValidation && !cartValidation.canProceed && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-900 mb-2">
                      Minimum Order Not Met
                    </h3>
                    <p className="text-orange-800 mb-4">
                      {cartValidation.message}
                    </p>
                    
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Current Subtotal</p>
                          <p className="text-lg font-bold text-gray-900">
                            £{cartValidation.subtotal.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Minimum Required</p>
                          <p className="text-lg font-bold text-orange-600">
                            £{cartValidation.minOrderValue?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-orange-100 rounded-lg mb-4">
                      <TrendingUp className="w-5 h-5 text-orange-700" />
                      <p className="text-sm font-semibold text-orange-900">
                        Add £{cartValidation.amountNeeded?.toFixed(2)} more to proceed with delivery
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href="/products"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add More Items
                      </Link>
                      <button
                        onClick={() => setFulfillmentType('COLLECTION')}
                        className="flex-1 px-4 py-2 border-2 border-orange-600 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition"
                      >
                        Switch to Collection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Free Delivery Notification */}
            {fulfillmentType === 'DELIVERY' && selectedAddressId && cartValidation?.isFreeDelivery && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div>
                    <p className="font-bold text-green-900">You qualify for free delivery!</p>
                    <p className="text-sm text-green-700">No delivery fee will be charged</p>
                  </div>
                </div>
              </div>
            )}

            {/* Almost Free Delivery */}
            {fulfillmentType === 'DELIVERY' && selectedAddressId && cartValidation?.canProceed && 
             !cartValidation.isFreeDelivery && cartValidation.freeDeliveryThreshold && 
             cartValidation.subtotal < cartValidation.freeDeliveryThreshold && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">
                      Add £{(cartValidation.freeDeliveryThreshold - cartValidation.subtotal).toFixed(2)} more for free delivery!
                    </p>
                    <p className="text-sm text-blue-700">
                      Current: £{cartValidation.subtotal.toFixed(2)} | Free delivery at: £{cartValidation.freeDeliveryThreshold.toFixed(2)}
                    </p>
                  </div>
                  <Link
                    href="/products"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                  >
                    Add Items
                  </Link>
                </div>
              </div>
            )}

            {/* Step 4: Payment Method */}
            <div className="bg-card border rounded-lg p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />
                Payment Method
              </h2>

              <div className="space-y-2 lg:space-y-3">
                {/* Card Payment - Only show if enabled */}
                {enabledPaymentTypes.includes('card') && (
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`w-full text-left p-3 lg:p-4 border-2 rounded-lg transition ${
                      paymentMethod === 'CARD'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-semibold text-sm lg:text-base">Card Payment</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Pay securely with Stripe</p>
                  </button>
                )}

                {/* Cash on Delivery - Only show if enabled AND delivery selected */}
                {enabledPaymentTypes.includes('cash_on_delivery') && fulfillmentType === 'DELIVERY' && (
                  <button
                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className={`w-full text-left p-3 lg:p-4 border-2 rounded-lg transition ${
                      paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-semibold text-sm lg:text-base">Cash on Delivery</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Pay when you receive your order</p>
                  </button>
                )}

                {/* Pay in Store - Only show if enabled AND collection selected */}
                {enabledPaymentTypes.includes('pay_in_store') && fulfillmentType === 'COLLECTION' && (
                  <button
                    onClick={() => setPaymentMethod('PAY_IN_STORE')}
                    className={`w-full text-left p-3 lg:p-4 border-2 rounded-lg transition ${
                      paymentMethod === 'PAY_IN_STORE'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-semibold text-sm lg:text-base">Pay in Store</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Pay when you pick up your order</p>
                  </button>
                )}
              </div>

              {/* Card Payment - Show Payment Element if client secret exists */}
              {paymentMethod === 'CARD' && paymentClientSecret && (
                <div className="mt-6 p-6 bg-muted/20 rounded-lg">
                  <h3 className="font-semibold mb-4">Enter Card Details</h3>
                  <StripePaymentElement
                    clientSecret={paymentClientSecret}
                    onSuccess={() => {
                      router.push('/checkout/success');
                    }}
                    onError={(err) => {
                      error(`Payment failed: ${err}`);
                      setIsProcessingPayment(false);
                      setPaymentClientSecret(null);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-card border rounded-lg p-4 lg:p-6 lg:sticky lg:top-4">
              <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">Order Summary</h2>

              <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs lg:text-sm">
                    <span className="truncate mr-2">{item.quantity}x {item.product.name}</span>
                    <span className="font-semibold whitespace-nowrap">£{(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 lg:pt-4 space-y-2 mb-4 lg:mb-6">
                <div className="flex justify-between text-xs lg:text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">£{parseFloat(cart.subtotal.toString()).toFixed(2)}</span>
                </div>
                {fulfillmentType === 'DELIVERY' && selectedAddress?.deliveryZone && (
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span>Delivery</span>
                    <span className="font-semibold">£{parseFloat(selectedAddress.deliveryZone.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base lg:text-lg font-bold pt-2 border-t">
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

              {/* Desktop Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={
                  createOrder.isPending ||
                  isProcessingPayment ||
                  (paymentMethod === 'CARD' && !!paymentClientSecret) ||
                  (fulfillmentType === 'DELIVERY' && (!selectedAddressId || !selectedSlotId)) ||
                  (fulfillmentType === 'DELIVERY' && cartValidation && !cartValidation.canProceed)
                }
                className="hidden lg:block w-full bg-primary text-primary-foreground py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cartValidation && !cartValidation.canProceed && fulfillmentType === 'DELIVERY' ? 
                 'Minimum Order Not Met' :
                 isProcessingPayment ? 'Processing...' : 
                 createOrder.isPending ? 'Creating Order...' : 
                 paymentMethod === 'CARD' && paymentClientSecret ? 'Complete Payment Above' :
                 paymentMethod === 'CARD' ? 'Proceed to Payment' :
                 'Place Order'}
              </button>

              {paymentMethod === 'CARD' && paymentClientSecret && (
                <p className="hidden lg:block text-sm text-center text-muted-foreground mt-2">
                  Complete payment form above to finalize your order
                </p>
              )}

              <Link
                href="/cart"
                className="block text-center text-xs lg:text-sm text-muted-foreground hover:text-primary mt-3 lg:mt-4"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-4 z-[100]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Total:</span>
          <span className="text-lg font-bold text-primary">
            £{(
              parseFloat(cart.subtotal.toString()) +
              (fulfillmentType === 'DELIVERY' && selectedAddress?.deliveryZone
                ? parseFloat(selectedAddress.deliveryZone.deliveryFee)
                : 0)
            ).toFixed(2)}
          </span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={
            createOrder.isPending ||
            isProcessingPayment ||
            (paymentMethod === 'CARD' && !!paymentClientSecret) ||
            (fulfillmentType === 'DELIVERY' && (!selectedAddressId || !selectedSlotId)) ||
            (fulfillmentType === 'DELIVERY' && cartValidation && !cartValidation.canProceed)
          }
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-lg text-base font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {cartValidation && !cartValidation.canProceed && fulfillmentType === 'DELIVERY' ? 
           'Minimum Order Not Met' :
           isProcessingPayment ? 'Processing...' : 
           createOrder.isPending ? 'Creating Order...' : 
           paymentMethod === 'CARD' && paymentClientSecret ? 'Complete Payment Above' :
           paymentMethod === 'CARD' ? 'Proceed to Payment' :
           `Place Order - ${cart.items.length} item${cart.items.length !== 1 ? 's' : ''}`}
        </button>
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
