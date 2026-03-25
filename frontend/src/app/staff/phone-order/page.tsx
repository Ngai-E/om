'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Minus, Trash2, Package, Truck, CreditCard, AlertTriangle, Send, Banknote, Store } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { staffApi } from '@/lib/api/staff';
import { useProducts } from '@/lib/hooks/use-products';
import { accountApi } from '@/lib/api/account';
import { deliveryApi } from '@/lib/api/delivery';
import { RoleBasedLayout } from '@/components/shared/role-based-layout';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

export default function PhoneOrderPage() {
  const router = useRouter();
  const { toast, showToast, hideToast, success, error } = useToast();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [productSearch, setProductSearch] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; product: any; quantity: number }>>([]);
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'COLLECTION'>('DELIVERY');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH_ON_DELIVERY' | 'PAY_IN_STORE'>('CARD');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const productSearchRef = useRef<HTMLInputElement>(null);
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  // Auto-focus product search
  useEffect(() => {
    if (selectedCustomer && productSearchRef.current) {
      productSearchRef.current.focus();
    }
  }, [selectedCustomer]);

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  };

  // Check if customer is new (for COD warning)
  const isNewCustomer = selectedCustomer && (selectedCustomer._count?.orders || 0) === 0;
  const codLimit = 100; // £100 COD limit
  const exceedsCodLimit = calculateTotal() > codLimit;

  const { data: customers } = useQuery({
    queryKey: ['customer-search', customerSearch],
    queryFn: () => staffApi.searchCustomers(customerSearch),
    enabled: customerSearch.length >= 3,
  });

  const { data: productsData } = useProducts({
    search: productSearch,
    page: 1,
    limit: 10,
  });

  const { data: addresses } = useQuery({
    queryKey: ['customer-addresses', selectedCustomer?.id],
    queryFn: () => staffApi.getCustomerAddresses(selectedCustomer.id),
    enabled: !!selectedCustomer,
  });

  // Auto-select default address when addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr: any) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId]);

  // Fetch delivery slots
  const { data: slotsData } = useQuery({
    queryKey: ['delivery-slots'],
    queryFn: () => deliveryApi.getSlots(),
    enabled: fulfillmentType === 'DELIVERY',
  });

  const createOrder = useMutation({
    mutationFn: staffApi.createPhoneOrder,
    onSuccess: (data) => {
      success(`Order created successfully! Order number: ${data.orderNumber}`);
      setTimeout(() => router.push('/admin/orders'), 1500);
    },
    onError: () => {
      error('Failed to create order. Please try again.');
    },
  });

  const addProduct = (product: any) => {
    const existing = orderItems.find(item => item.productId === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, { productId: product.id, product, quantity: 1 }]);
    }
    setProductSearch('');
    
    // On mobile, switch to cart view after adding product
    if (window.innerWidth < 1024) {
      setTimeout(() => setMobileView('cart'), 300);
    } else {
      // Re-focus search for next product on desktop
      setTimeout(() => productSearchRef.current?.focus(), 100);
    }
  };

  const updateItemNote = (productId: string, note: string) => {
    setItemNotes({ ...itemNotes, [productId]: note });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setOrderItems(orderItems.map(item =>
      item.productId === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeProduct = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const handleSubmit = () => {
    if (!selectedCustomer) {
      error('Please select a customer');
      return;
    }
    if (orderItems.length === 0) {
      error('Please add at least one product');
      return;
    }
    if (fulfillmentType === 'DELIVERY' && !selectedAddressId) {
      error('Please select a delivery address');
      return;
    }

    createOrder.mutate({
      customerId: selectedCustomer.id,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      fulfillmentType,
      addressId: fulfillmentType === 'DELIVERY' ? selectedAddressId : undefined,
      deliverySlotId: fulfillmentType === 'DELIVERY' ? selectedSlotId : undefined,
      paymentMethod,
    });
  };

  return (
    <RoleBasedLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-bold">📞 Phone Order</h1>
          {selectedCustomer && (
            <p className="text-sm text-gray-600 mt-1">
              Customer: <span className="font-semibold">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
              {isNewCustomer && <span className="ml-2 text-orange-600">• New Customer</span>}
            </p>
          )}
        </div>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden bg-white border-b">
          <div className="flex">
            <button
              onClick={() => setMobileView('products')}
              className={`flex-1 py-3 font-semibold transition ${
                mobileView === 'products'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              🛒 Products
            </button>
            <button
              onClick={() => setMobileView('cart')}
              className={`flex-1 py-3 font-semibold transition relative ${
                mobileView === 'cart'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Cart ({orderItems.length})
              {orderItems.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Product Search & List */}
          <div className={`
            w-full lg:w-[70%] lg:border-r overflow-y-auto p-4 lg:p-6 space-y-6
            ${mobileView === 'cart' ? 'hidden lg:block' : ''}
          `}>
            {!selectedCustomer ? (
              /* Customer Selection */
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6">👤 Select Customer</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {customers && customers.length > 0 && (
                  <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                    {customers.map((customer: any) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className="w-full text-left p-5 border-2 rounded-xl hover:bg-green-50 hover:border-green-500 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold">{customer.firstName} {customer.lastName}</p>
                            <p className="text-sm text-gray-600">{customer.email} • {customer.phone}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {customer._count?.orders || 0} previous orders
                            </p>
                          </div>
                          {(customer._count?.orders || 0) === 0 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              </div>
            ) : (

              /* Product Search - Auto-focused */
              <>
                <div className="bg-white rounded-xl p-6 border-2 border-green-500 shadow-lg">
                  <h2 className="text-2xl font-bold mb-4">🛒 Add Products</h2>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                      ref={productSearchRef}
                      type="text"
                      placeholder="Search products... (auto-focused)"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Product Search Results - Large Tap Targets */}
                  {productsData && productsData.data.length > 0 && productSearch && (
                    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                      {productsData.data.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="w-full text-left p-5 border-2 rounded-xl hover:bg-green-50 hover:border-green-500 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            {product.images?.[0]?.url && (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <p className="text-lg font-bold">{product.name}</p>
                              <p className="text-xl text-green-600 font-bold">£{parseFloat(product.price).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="bg-green-500 text-white p-3 rounded-lg group-hover:bg-green-600 transition">
                            <Plus className="w-6 h-6" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>



          {/* RIGHT: Cart & Actions */}
          <div className={`
            w-full lg:w-[30%] bg-gray-50 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6
            ${mobileView === 'products' ? 'hidden lg:block' : ''}
          `}>
            {/* Mobile: Back to Products Button */}
            <button
              onClick={() => setMobileView('products')}
              className="lg:hidden w-full mb-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition"
            >
              ← Back to Products
            </button>

            {/* Cart */}
            <div className="bg-white rounded-xl border-2 p-4">
              <h2 className="text-xl font-bold mb-4">🛒 Cart ({orderItems.length})</h2>
              
              {orderItems.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No items yet</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.productId} className="border-2 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-sm flex-1">{item.product.name}</p>
                        <button
                          onClick={() => removeProduct(item.productId)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Quantity Stepper - Large Buttons */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center font-bold"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-12 text-center text-xl font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center font-bold"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-lg font-bold">
                          £{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Item Notes */}
                      <input
                        type="text"
                        placeholder="Add note (e.g., ripe bananas)..."
                        value={itemNotes[item.productId] || ''}
                        onChange={(e) => updateItemNote(item.productId, e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              {orderItems.length > 0 && (
                <div className="mt-4 pt-4 border-t-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-3xl font-bold text-green-600">
                      £{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery/Collection */}
            {selectedCustomer && orderItems.length > 0 && (
              <div className="bg-white rounded-xl border-2 p-4">
                <h3 className="font-bold mb-3">📦 Fulfillment</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => setFulfillmentType('DELIVERY')}
                    className={`p-3 rounded-lg font-semibold transition ${
                      fulfillmentType === 'DELIVERY'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Truck className="w-5 h-5 mx-auto mb-1" />
                    Delivery
                  </button>
                  <button
                    onClick={() => setFulfillmentType('COLLECTION')}
                    className={`p-3 rounded-lg font-semibold transition ${
                      fulfillmentType === 'COLLECTION'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Package className="w-5 h-5 mx-auto mb-1" />
                    Pick Up
                  </button>
                </div>

                {fulfillmentType === 'DELIVERY' && addresses && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-3"
                    >
                      <option value="">Select address...</option>
                      {addresses.map((address: any) => (
                        <option key={address.id} value={address.id}>
                          {address.isDefault ? '⭐ ' : ''}{address.label || 'Address'} - {address.addressLine1}, {address.postcode}
                        </option>
                      ))}
                    </select>

                    {/* Delivery Slot Picker */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Delivery Slot
                      </label>
                      <select
                        value={selectedSlotId}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="">Select time slot...</option>
                        {slotsData?.slots?.map((slot: any) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.startTime} - {slot.endTime} ({slot.capacity - (slot._count?.orders || 0)} available)
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Payment Section - Big Toggle Buttons */}
            {selectedCustomer && orderItems.length > 0 && (
              <div className="bg-white rounded-xl border-2 p-4">
                <h3 className="font-bold mb-3">💳 Payment</h3>
                
                <div className="space-y-3">
                  {/* Send Payment Link (CARD) */}
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`w-full p-4 rounded-xl font-bold text-left transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-green-500 text-white border-4 border-green-600'
                        : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Send className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg">🟢 Send Payment Link</p>
                        <p className={`text-xs ${
                          paymentMethod === 'CARD' ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          Customer pays online
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Cash on Delivery or Pay in Store */}
                  {fulfillmentType === 'DELIVERY' ? (
                    <button
                      onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                      className={`w-full p-4 rounded-xl font-bold text-left transition-all ${
                        paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'bg-orange-500 text-white border-4 border-orange-600'
                          : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-lg">🟠 Cash on Delivery</p>
                          <p className={`text-xs ${
                            paymentMethod === 'CASH_ON_DELIVERY' ? 'text-white/80' : 'text-gray-500'
                          }`}>
                            Pay when delivered
                          </p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => setPaymentMethod('PAY_IN_STORE')}
                      className={`w-full p-4 rounded-xl font-bold text-left transition-all ${
                        paymentMethod === 'PAY_IN_STORE'
                          ? 'bg-purple-500 text-white border-4 border-purple-600'
                          : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-lg">🟣 Pay in Store</p>
                          <p className={`text-xs ${
                            paymentMethod === 'PAY_IN_STORE' ? 'text-white/80' : 'text-gray-500'
                          }`}>
                            Pay when picking up
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Warnings */}
                {paymentMethod === 'CASH_ON_DELIVERY' && (
                  <div className="mt-3 space-y-2">
                    {isNewCustomer && (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-orange-900">⚠ New Customer COD</p>
                          <p className="text-xs text-orange-700">First-time customer using cash payment</p>
                        </div>
                      </div>
                    )}
                    {exceedsCodLimit && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-900">⚠ COD Limit Exceeded</p>
                          <p className="text-xs text-red-700">Order exceeds £{codLimit} COD limit</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Create Order Button */}
            {selectedCustomer && orderItems.length > 0 && (
              <button
                onClick={handleSubmit}
                disabled={createOrder.isPending || (fulfillmentType === 'DELIVERY' && !selectedAddressId)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-xl font-bold text-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {createOrder.isPending ? '⏳ Creating...' : '✅ Create Order'}
              </button>
            )}
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
    </RoleBasedLayout>
  );
}
