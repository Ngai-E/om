import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Minus, Plus, X, ShoppingBag, Tag } from 'lucide-react';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';

export function Cart() {
  const { cart, removeFromCart, updateCartQuantity, getCartTotal } = useStore();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const subtotal = getCartTotal();
  const deliveryFee = subtotal >= 50 ? 0 : 4.99;
  const total = subtotal - discount + deliveryFee;

  useEffect(() => {
    // Fetch images for cart items
    const fetchImages = async () => {
      const urls: Record<string, string> = {};
      for (const item of cart) {
        try {
          const response = await fetch(
            `https://source.unsplash.com/200x200/?${encodeURIComponent(item.product.image)}&${item.product.id}`
          );
          urls[item.product.id] = response.url;
        } catch (error) {
          console.error('Failed to load image:', error);
        }
      }
      setImageUrls(urls);
    };
    if (cart.length > 0) {
      fetchImages();
    }
  }, [cart]);

  const handleApplyPromo = () => {
    // Simple promo code logic
    if (promoCode.toUpperCase() === 'OMEGA10') {
      setDiscount(subtotal * 0.1);
    } else if (promoCode.toUpperCase() === 'FRESH20') {
      setDiscount(subtotal * 0.2);
    } else {
      setDiscount(0);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1
            className="text-3xl md:text-4xl font-black text-[#036637] mb-8"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Shopping Cart
          </h1>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-6 bg-gray-100 rounded-full">
                <ShoppingBag className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some products to get started!
            </p>
            <Link to="/products">
              <Button className="bg-[#FF7730] hover:bg-[#FF6520] text-white">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          className="text-3xl md:text-4xl font-black text-[#036637] mb-8"
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
        >
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => {
              const price = item.selectedVariant?.price || item.product.price;
              const itemTotal = price * item.quantity;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4"
                >
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {imageUrls[item.product.id] && (
                      <img
                        src={imageUrls[item.product.id]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <Link to={`/product/${item.product.id}`}>
                          <h3 className="font-semibold text-[#036637] hover:text-[#014D29] truncate">
                            {item.product.name}
                          </h3>
                        </Link>
                        {item.selectedVariant && (
                          <p className="text-sm text-gray-500">
                            {item.selectedVariant.name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateCartQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateCartQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-[#036637]">
                          £{itemTotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          £{price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-[#036637] mb-4">
                Order Summary
              </h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleApplyPromo}
                    className="border-[#036637] text-[#036637] hover:bg-[#E8F5E9]"
                  >
                    Apply
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Promo code applied! Saved £{discount.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-£{discount.toFixed(2)}</span>
                  </div>
                )}
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
                {subtotal < 50 && subtotal > 0 && (
                  <p className="text-xs text-gray-500">
                    Add £{(50 - subtotal).toFixed(2)} more for free delivery
                  </p>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#036637]">Total</span>
                    <span className="font-bold text-[#036637] text-xl">
                      £{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link to="/checkout">
                <Button className="w-full bg-[#FF7730] hover:bg-[#FF6520] text-white">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link to="/products">
                <Button variant="ghost" className="w-full mt-3 text-[#036637]">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
