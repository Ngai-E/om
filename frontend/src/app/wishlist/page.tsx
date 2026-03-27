'use client';

import { useState } from 'react';
import { Heart, ShoppingCart, Trash2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useAddToCart } from '@/lib/hooks/use-cart';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { VariantSelectorModal } from '@/components/products/variant-selector-modal';
import type { Product } from '@/types';
import { settingsApi } from '@/lib/api/settings';

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

export default function WishlistPage() {
  const router = useRouter();
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToCart = useAddToCart();
  const guestCart = useGuestCartStore();
  const { setItemCount } = useCartStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Fetch settings for social proof
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  // Fetch wishlist products by their IDs
  const { data: wishlistProducts, isLoading } = useQuery({
    queryKey: ['wishlist-products', items],
    queryFn: async () => {
      if (items.length === 0) return [];
      
      // Fetch each product individually
      const products = await Promise.all(
        items.map(id => productsApi.getProduct(id).catch(() => null))
      );
      
      // Filter out any failed fetches (null values)
      return products.filter((p): p is NonNullable<typeof p> => p !== null);
    },
    enabled: items.length > 0,
  });

  const wishlistProductsList = wishlistProducts || [];

  const handleAddToCart = async (product: Product) => {
    const hasVariants = product.variants && product.variants.length > 0;
    
    // If product has variants, open variant selector modal
    if (hasVariants) {
      setSelectedProduct(product);
      setShowVariantModal(true);
      return;
    }

    if (!isAuthenticated) {
      // Add to guest cart (localStorage)
      guestCart.addItem(product.id, 1);
      setItemCount(guestCart.getItemCount());
      return;
    }

    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <>
      {selectedProduct && (
        <VariantSelectorModal
          product={selectedProduct}
          isOpen={showVariantModal}
          onClose={() => {
            setShowVariantModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#036637] mb-2">
            My Wishlist
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-card border rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-6 bg-gray-100 rounded-full">
                <Heart className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding your favorite products to your wishlist!
            </p>
            <Link href="/products">
              <button className="bg-[#FF7730] hover:bg-[#FF6520] text-white px-6 py-3 rounded-lg font-semibold transition">
                Browse Products
              </button>
            </Link>
          </div>
        )}

        {/* Wishlist Grid */}
        {!isLoading && wishlistProductsList.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {wishlistProductsList.map((product) => {
              const hasVariants = product.variants && product.variants.length > 0;
              const inStock = hasVariants && product.variants
                ? product.variants.some(v => v.stock > 0)
                : (!product.inventory || 
                   !product.inventory.isTracked || 
                   product.inventory.quantity > 0);

              return (
                <div key={product.id} className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition group">
                  <Link href={`/products/${product.slug}`} className="block">
                    {/* Image */}
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].altText || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}

                      {/* Remove from wishlist button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeItem(product.id);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition z-10"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>

                      {/* Social Proof Badge */}
                      {settings?.show_product_order_badges && product.orderCount && product.orderCount > 0 && (() => {
                        const inflation = settings?.product_orders_inflation || 1.0;
                        const displayCount = Math.floor(product.orderCount * inflation);
                        return displayCount > 0 ? (
                          <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                            <TrendingUp className="w-3 h-3" />
                            <span>{formatNumber(displayCount)} orders</span>
                          </div>
                        ) : null;
                      })()}

                      {!inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded font-medium">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xl font-bold text-primary">
                            £{parseFloat(product.price).toFixed(2)}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-muted-foreground line-through ml-2">
                              £{parseFloat(product.compareAtPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasVariants && product.variants && product.variants.length > 1 && (
                        <p className="text-xs text-gray-500">
                          +{product.variants.length - 1} variant{product.variants.length > 2 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock || addToCart.isPending || (hasVariants && !inStock)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      title={hasVariants ? 'Select variant' : 'Add to cart'}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-2 border rounded-lg hover:bg-destructive/10 hover:border-destructive transition"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
