'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/lib/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api/cart';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { Product } from '@/types';

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
  
  const [isClearing, setIsClearing] = useState(false);

  // Fetch product details for guest cart items
  useEffect(() => {
    const fetchGuestCartProducts = async () => {
      if (!isAuthenticated && guestCart.items.length > 0) {
        setLoadingGuestProducts(true);
        try {
          const productsWithDetails = await Promise.all(
            guestCart.items.map(async (item) => {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${item.productId}`);
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
    if (!confirm('Are you sure you want to clear your cart?')) return;
    
    if (!isAuthenticated) {
      guestCart.clearCart();
      return;
    }
    
    try {
      setIsClearing(true);
      await cartApi.clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
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
                    {item.product.imageUrl && (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded"
                      />
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
                          onClick={() => guestCart.updateItem(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => guestCart.updateItem(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-muted rounded"
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

                <Link
                  href="/checkout/guest"
                  className="block w-full bg-primary text-primary-foreground py-3 rounded-lg text-center font-semibold hover:opacity-90 transition mb-3"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/products"
                  className="block w-full border border-primary text-primary py-3 rounded-lg text-center font-semibold hover:bg-primary/5 transition"
                >
                  Continue Shopping
                </Link>

                <button
                  onClick={handleClearCart}
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
            onClick={handleClearCart}
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
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-card border rounded-lg p-4 flex gap-4"
              >
                {/* Product Image */}
                <Link
                  href={`/products/${item.product.slug}`}
                  className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0"
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
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      className="w-8 h-8 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={updateItem.isPending}
                      className="w-8 h-8 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-50"
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
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={removeItem.isPending}
                    className="text-destructive hover:underline text-sm flex items-center gap-1"
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
                    £{parseFloat(cart.subtotal.toString()).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{cart.itemCount}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    £{parseFloat(cart.subtotal.toString()).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition mb-3"
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
    </div>
  );
}
