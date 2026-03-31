'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';
import { MapPin, User, Mail, Phone, ShoppingBag, Truck, Store, CreditCard, Clock } from 'lucide-react';
import { tenantFetch } from '@/lib/tenant';

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { items: guestItems, clearCart } = useGuestCartStore();
  const { toast, hideToast, error, success } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'COLLECTION'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH_ON_DELIVERY' | 'PAY_IN_STORE'>('CASH_ON_DELIVERY');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    countryCode: '+44',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United Kingdom',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Step 1: Create/find guest user
      const guestResponse = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/guest/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!guestResponse.ok) {
        const errorData = await guestResponse.json();
        throw new Error(errorData.message || 'Failed to process guest checkout');
      }

      const guestData = await guestResponse.json();
      const { token, user } = guestData;

      // Step 2: Add items to cart using guest token
      for (const item of guestItems) {
        await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
          }),
        });
      }

      // Step 3: Create order
      const orderData: any = {
        fulfillmentType,
        notes: 'Guest order',
      };

      // Add address if delivery selected
      if (fulfillmentType === 'DELIVERY' && user.addresses && user.addresses.length > 0) {
        orderData.addressId = user.addresses[0].id;
      }

      const orderResponse = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const order = await orderResponse.json();

      // Clear guest cart
      clearCart();

      // Show success message
      success('Order placed successfully!');

      // Redirect to order confirmation with orderId
      setTimeout(() => {
        router.push(`/order-confirmation?orderId=${order.id}`);
      }, 1000);

    } catch (err: any) {
      error(err.message || 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (guestItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Link href="/products" className="text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-4 lg:py-8">
        <div className="mb-4 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-1 lg:mb-2">Guest Checkout</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Complete your order without creating an account
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              {/* Fulfillment Type */}
              <div className="bg-card border rounded-lg p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 lg:w-5 lg:h-5" />
                  Fulfillment Method
                </h2>
                
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('DELIVERY')}
                    className={`p-3 lg:p-4 border-2 rounded-lg transition ${
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
                    type="button"
                    onClick={() => {
                      setFulfillmentType('COLLECTION');
                      setPaymentMethod('PAY_IN_STORE');
                    }}
                    className={`p-3 lg:p-4 border-2 rounded-lg transition ${
                      fulfillmentType === 'COLLECTION'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Store className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2" />
                    <p className="font-semibold text-sm lg:text-base">Pick Up</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Collect from store</p>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-card border rounded-lg p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 lg:w-5 lg:h-5" />
                  Contact Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your.email@example.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll send your order confirmation to this email
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="countryCode"
                        value={formData.countryCode || '+44'}
                        onChange={handleChange}
                        className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+234">🇳🇬 +234</option>
                        <option value="+233">🇬🇭 +233</option>
                        <option value="+254">🇰🇪 +254</option>
                        <option value="+27">🇿🇦 +27</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+33">🇫🇷 +33</option>
                      </select>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="7700 900000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address - Only show for delivery */}
              {fulfillmentType === 'DELIVERY' && (
                <div className="bg-card border rounded-lg p-4 lg:p-6">
                  <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
                    Delivery Address
                  </h2>

                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      required
                      className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        County/State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="SW1A 1AA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Payment Method */}
              <div className="bg-card border rounded-lg p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />
                  Payment Method
                </h2>

                <div className="space-y-2 lg:space-y-3">
                  {/* Cash on Delivery - Only for delivery */}
                  {fulfillmentType === 'DELIVERY' && (
                    <button
                      type="button"
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

                  {/* Pay in Store - Only for collection */}
                  {fulfillmentType === 'COLLECTION' && (
                    <button
                      type="button"
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

                  {/* Card Payment - Available for both */}
                  <button
                    type="button"
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
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Your account will be automatically created with your email. 
                  Check your email for login details after placing your order.
                </p>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-card border rounded-lg p-4 lg:p-6 lg:sticky lg:top-4">
              <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4">Order Summary</h2>

              <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
                {guestItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs lg:text-sm">
                    <span className="truncate mr-2">{item.quantity}x Product</span>
                    <span className="text-muted-foreground">#{item.productId.slice(0, 6)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 lg:pt-4 mb-4 lg:mb-6">
                <div className="flex justify-between text-xs lg:text-sm mb-2">
                  <span>Items</span>
                  <span className="font-semibold">{guestItems.length}</span>
                </div>
                <div className="flex justify-between text-xs lg:text-sm mb-2">
                  <span>Fulfillment</span>
                  <span className="font-semibold">{fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Collection'}</span>
                </div>
                <div className="flex justify-between text-xs lg:text-sm">
                  <span>Payment</span>
                  <span className="font-semibold text-right">
                    {paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 
                     paymentMethod === 'PAY_IN_STORE' ? 'Pay in Store' : 'Card'}
                  </span>
                </div>
              </div>

              {/* Desktop Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="hidden lg:block w-full bg-primary text-primary-foreground py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>

              <p className="hidden lg:block text-xs text-center text-muted-foreground mt-3 lg:mt-4">
                By placing this order, you agree to our terms
              </p>

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
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-lg text-base font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isSubmitting ? 'Processing...' : `Place Order - ${guestItems.length} item${guestItems.length !== 1 ? 's' : ''}`}
        </button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          By placing this order, you agree to our terms
        </p>
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
