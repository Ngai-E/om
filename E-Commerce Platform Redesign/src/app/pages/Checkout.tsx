import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Check, CreditCard, Truck, Package, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PaymentMethod } from '../types';

export function Checkout() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [guestCheckout, setGuestCheckout] = useState(true);

  // Delivery Details
  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
  });

  // Payment & Delivery
  const [deliverySlot, setDeliverySlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [saveDetails, setSaveDetails] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = subtotal >= 50 ? 0 : 4.99;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Add some products before checking out.
          </p>
          <Link to="/products">
            <Button className="bg-[#FF7730] hover:bg-[#FF6520] text-white">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate delivery details
    if (!deliveryDetails.firstName || !deliveryDetails.email || !deliveryDetails.address) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(2);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverySlot) {
      toast.error('Please select a delivery slot');
      return;
    }
    setStep(3);
  };

  const handlePlaceOrder = () => {
    // Simulate order placement
    toast.success('Order placed successfully!');
    clearCart();
    setTimeout(() => {
      navigate('/orders');
    }, 2000);
  };

  const deliverySlots = [
    'Today, 4pm - 6pm',
    'Tomorrow, 10am - 12pm',
    'Tomorrow, 2pm - 4pm',
    'Tomorrow, 4pm - 6pm',
  ];

  const steps = [
    { number: 1, title: 'Delivery', icon: Truck },
    { number: 2, title: 'Payment', icon: CreditCard },
    { number: 3, title: 'Review', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1
          className="text-3xl md:text-4xl font-black text-[#036637] mb-8"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Checkout
        </h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;

              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? 'bg-[#036637] border-[#036637] text-white'
                          : isActive
                          ? 'bg-[#FF7730] border-[#FF7730] text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <p
                      className={`text-sm mt-2 ${
                        isActive || isCompleted ? 'text-[#036637] font-semibold' : 'text-gray-500'
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        step > s.number ? 'bg-[#036637]' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Delivery Details */}
            {step === 1 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-[#036637] mb-6">
                  Delivery Details
                </h2>

                {/* Guest Checkout Toggle */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="guest"
                      checked={guestCheckout}
                      onCheckedChange={(checked) => setGuestCheckout(checked as boolean)}
                    />
                    <Label htmlFor="guest">Continue as guest</Label>
                  </div>
                </div>

                <form onSubmit={handleDeliverySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        required
                        value={deliveryDetails.firstName}
                        onChange={e =>
                          setDeliveryDetails({ ...deliveryDetails, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={deliveryDetails.lastName}
                        onChange={e =>
                          setDeliveryDetails({ ...deliveryDetails, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={deliveryDetails.email}
                      onChange={e =>
                        setDeliveryDetails({ ...deliveryDetails, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={deliveryDetails.phone}
                      onChange={e =>
                        setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      required
                      value={deliveryDetails.address}
                      onChange={e =>
                        setDeliveryDetails({ ...deliveryDetails, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={deliveryDetails.city}
                        onChange={e =>
                          setDeliveryDetails({ ...deliveryDetails, city: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={deliveryDetails.postcode}
                        onChange={e =>
                          setDeliveryDetails({ ...deliveryDetails, postcode: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#FF7730] hover:bg-[#FF6520] text-white"
                  >
                    Continue to Payment
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            )}

            {/* Step 2: Payment & Delivery */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Delivery Slot */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-[#036637] mb-4">
                    Select Delivery Slot
                  </h2>
                  <RadioGroup value={deliverySlot} onValueChange={setDeliverySlot}>
                    <div className="space-y-3">
                      {deliverySlots.map(slot => (
                        <div
                          key={slot}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <RadioGroupItem value={slot} id={slot} />
                          <Label htmlFor={slot} className="flex-1 cursor-pointer">
                            {slot}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-[#036637] mb-4">
                    Payment Method
                  </h2>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="apple-pay" id="apple-pay" />
                        <Label htmlFor="apple-pay" className="flex-1 cursor-pointer">
                          Apple Pay
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="google-pay" id="google-pay" />
                        <Label htmlFor="google-pay" className="flex-1 cursor-pointer">
                          Google Pay
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex-1 cursor-pointer">
                          Cash on Delivery
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="pay-in-store" id="pay-in-store" />
                        <Label htmlFor="pay-in-store" className="flex-1 cursor-pointer">
                          Pay in Store
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {!guestCheckout && (
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox
                        id="save"
                        checked={saveDetails}
                        onCheckedChange={(checked) => setSaveDetails(checked as boolean)}
                      />
                      <Label htmlFor="save" className="text-sm">
                        Save payment details for future orders
                      </Label>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-[#FF7730] hover:bg-[#FF6520] text-white"
                    onClick={handlePaymentSubmit}
                  >
                    Review Order
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Delivery Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#036637]">Delivery Details</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#FF7730]"
                      onClick={() => setStep(1)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="text-sm space-y-1 text-gray-700">
                    <p>{deliveryDetails.firstName} {deliveryDetails.lastName}</p>
                    <p>{deliveryDetails.email}</p>
                    <p>{deliveryDetails.phone}</p>
                    <p>{deliveryDetails.address}</p>
                    <p>{deliveryDetails.city} {deliveryDetails.postcode}</p>
                  </div>
                </div>

                {/* Delivery & Payment */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#036637]">Delivery & Payment</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#FF7730]"
                      onClick={() => setStep(2)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="text-sm space-y-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#036637]" />
                      <span>{deliverySlot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#036637]" />
                      <span className="capitalize">{paymentMethod.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-[#036637] mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {cart.map(item => {
                      const price = item.selectedVariant?.price || item.product.price;
                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            {item.selectedVariant && (
                              <p className="text-gray-500 text-xs">
                                {item.selectedVariant.name}
                              </p>
                            )}
                            <p className="text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-[#036637]">
                            £{(price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
                    onClick={() => setStep(2)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-[#036637] hover:bg-[#014D29] text-white"
                    onClick={handlePlaceOrder}
                  >
                    Place Order
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-[#036637] mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `£${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#036637]">Total</span>
                    <span className="font-bold text-[#036637] text-xl">
                      £{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#E8F5E9] rounded-lg p-4 text-sm text-gray-700">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#036637] mt-0.5 flex-shrink-0" />
                  <span>Secure checkout guaranteed</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
