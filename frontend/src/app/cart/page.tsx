'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, X, TrendingUp } from 'lucide-react';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/lib/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api/cart';
import { settingsApi } from '@/lib/api/settings';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { Product } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { tenantFetch } from '@/lib/tenant';

// Format large numbers: 10000 → 10k, 1000000 → 1M
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString();
}

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // Authenticated cart
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  
  // Guest cart
  const guestCart = useGuestCartStore();
  const [guestCartProducts, setGuestCartProducts] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [loadingGuestProducts, setLoadingGuestProducts] = useState(false);
  const [guestCheckoutEnabled, setGuestCheckoutEnabled] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  
  const [isClearing, setIsClearing] = useState(false);

  // Fetch settings for social proof
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  // Check if any cart items have products with variants but no variant selected
  const hasInvalidVariants = cart?.items.some(item => {
    const hasVariants = item.product.variants && item.product.variants.length > 0;
    return hasVariants && !item.variantId;
  }) || false;

  // Fetch guest checkout setting
  useEffect(() => {
    const fetchGuestCheckoutSetting = async () => {
      try {
        const enabled = await settingsApi.getGuestCheckoutEnabled();
        setGuestCheckoutEnabled(enabled);
      } catch (error) {
        console.error('Failed to fetch guest checkout setting:', error);
        setGuestCheckoutEnabled(true); // Default to enabled if fetch fails
      }
    };
    fetchGuestCheckoutSetting();
  }, []);

  // Fetch product details for guest cart items
  useEffect(() => {
    const fetchGuestCartProducts = async () => {
      if (!isAuthenticated && guestCart.items.length > 0) {
        setLoadingGuestProducts(true);
        try {
          const productsWithDetails = await Promise.all(
            guestCart.items.map(async (item) => {
              const response = await tenantFetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${item.productId}`);
              if (response.ok) {
                const product = await response.json();
                return { product, quantity: item.quantity };
              }
              return null;
            })
          );
          setGuestCartProducts(productsWithDetails.filter(Boolean) as Array<{ product: Product; quantity: number }>);
        } catch (error) {
          console.error('Failed to fetch guest cart products:', error);
        } finally {
          setLoadingGuestProducts(false);
        }
      }
    };

    fetchGuestCartProducts();
  }, [isAuthenticated, guestCart.items]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    if (!isAuthenticated) {
      // Guest cart: itemId is actually productId
      guestCart.updateItem(itemId, newQuantity);
      return;
    }
    
    try {
      await updateItem.mutateAsync({ itemId, quantity: newQuantity });
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!isAuthenticated) {
      // Guest cart: itemId is actually productId
      guestCart.removeItem(itemId);
      return;
    }
    
    try {
      await removeItem.mutateAsync(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleClearCart = async () => {
    if (!isAuthenticated) {
      guestCart.clearCart();
      setShowClearModal(false);
      return;
    }
    
    try {
      setIsClearing(true);
      await cartApi.clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Check if cart is empty (both guest and authenticated)
  const hasItems = isAuthenticated 
    ? (cart && cart.items.length > 0)
    : (guestCart.items.length > 0);

  if (!isAuthenticated && !hasItems) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some products to get started
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some products to get started
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guest user with items - show full cart with products
  if (!isAuthenticated && guestCart.items.length > 0) {
    if (loadingGuestProducts) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      );
    }

    const subtotal = guestCartProducts.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {guestCartProducts.map((item) => (
                <div key={item.product.id} className="bg-card border rounded-lg p-4">
                  <div className="flex gap-4">
                    {item.product.images && item.product.images.length > 0 && (
                      <div className="relative">
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].altText || item.product.name}
                          className="w-24 h-24 object-cover rounded"
                        />
                        {/* Social Proof Badge */}
                        {settings?.show_product_order_badges && item.product.orderCount && item.product.orderCount > 0 && (() => {
                          const inflation = settings?.product_orders_inflation || 1.0;
                          const displayCount = Math.floor(item.product.orderCount * inflation);
                          return displayCount > 0 ? (
                            <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-md">
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span>{formatNumber(displayCount)}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.product.description}</p>
                      <p className="text-lg font-bold text-primary mt-2">
                        £{parseFloat(item.product.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            guestCart.updateItem(item.product.id, item.quantity - 1);
                          }}
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50 active:scale-95 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            guestCart.updateItem(item.product.id, item.quantity + 1);
                          }}
                          className="p-1 hover:bg-muted rounded active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => guestCart.removeItem(item.product.id)}
                        className="text-destructive hover:underline text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Items</span>
                    <span>{guestCart.items.length}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">£{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {guestCheckoutEnabled ? (
                  <Link
                    href="/checkout/guest"
                    className="block w-full bg-primary text-primary-foreground py-3 rounded-lg text-center font-semibold hover:opacity-90 transition mb-3"
                  >
                    Proceed to Checkout
                  </Link>
                ) : (
                  <div className="mb-3">
                    <div className="w-full bg-muted text-muted-foreground py-3 rounded-lg text-center font-semibold mb-2 cursor-not-allowed">
                      Guest Checkout Disabled
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      Please <Link href="/login" className="text-primary hover:underline">log in</Link> or{' '}
                      <Link href="/register" className="text-primary hover:underline">create an account</Link> to continue
                    </p>
                  </div>
                )}

                <Link
                  href="/products"
                  className="block w-full border border-primary text-primary py-3 rounded-lg text-center font-semibold hover:bg-primary/5 transition"
                >
                  Continue Shopping
                </Link>

                <button
                  onClick={() => setShowClearModal(true)}
                  disabled={isClearing}
                  className="w-full mt-4 text-destructive hover:underline text-sm flex items-center gap-1 justify-center disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <button
            onClick={() => setShowClearModal(true)}
            disabled={isClearing}
            className="text-destructive hover:underline text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart?.items.map((item) => (
              <div
                key={item.id}
                className="bg-card border rounded-lg p-4 flex gap-4"
              >
                {/* Product Image */}
                <Link
                  href={`/products/${item.product.slug}`}
                  className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative"
                >
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}
                  {/* Social Proof Badge */}
                  {settings?.show_product_order_badges && item.product.orderCount && item.product.orderCount > 0 && (() => {
                    const inflation = settings?.product_orders_inflation || 1.0;
                    const displayCount = Math.floor(item.product.orderCount * inflation);
                    return displayCount > 0 ? (
                      <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-md">
                        <TrendingUp className="w-2.5 h-2.5" />
                        <span>{formatNumber(displayCount)}</span>
                      </div>
                    ) : null;
                  })()}
                </Link>

                {/* Product Info */}
                <div className="flex-1">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="font-semibold hover:text-primary"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    £{parseFloat(item.product.price).toFixed(2)} each
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 md:gap-3 mt-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleUpdateQuantity(item.id, item.quantity - 1);
                      }}
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      className="w-8 h-8 rounded border flex items-center justify-center hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleUpdateQuantity(item.id, item.quantity + 1);
                      }}
                      disabled={updateItem.isPending}
                      className="w-8 h-8 rounded border flex items-center justify-center hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price & Remove */}
                <div className="flex flex-col items-end justify-between">
                  <p className="font-bold text-lg">
                    £{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveItem(item.id);
                    }}
                    disabled={removeItem.isPending}
                    className="text-destructive hover:underline text-sm flex items-center gap-1 mt-3 md:mt-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    £{parseFloat(cart?.subtotal?.toString() || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{cart?.itemCount || 0}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    £{parseFloat(cart?.subtotal?.toString() || '0').toFixed(2)}
                  </span>
                </div>
              </div>

              {hasInvalidVariants && (
                <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Some products require variant selection. Please remove them or contact support.
                  </p>
                </div>
              )}

              <button
                onClick={() => router.push('/checkout')}
                disabled={hasInvalidVariants}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              <Link
                href="/products"
                className="block text-center text-sm text-primary hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Clear Cart?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove all items from your cart? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowClearModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCart}
                disabled={isClearing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
