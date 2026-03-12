'use client';

import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useAddToCart } from '@/lib/hooks/use-cart';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';

export default function WishlistPage() {
  const router = useRouter();
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToCart = useAddToCart();
  const guestCart = useGuestCartStore();
  const { setItemCount } = useCartStore();

  // Fetch all products and filter by wishlist IDs
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts({ limit: 100 }),
  });

  const wishlistProducts = productsData?.data.filter((product) =>
    items.includes(product.id)
  ) || [];

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      // Add to guest cart (localStorage)
      guestCart.addItem(productId, 1);
      setItemCount(guestCart.getItemCount());
      return;
    }

    try {
      await addToCart.mutateAsync({ productId, quantity: 1 });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              My Wishlist
            </h1>
            <p className="text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Save your favorite products by clicking the heart icon
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Wishlist Grid */}
        {!isLoading && wishlistProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => {
              const inStock = !product.inventory || 
                !product.inventory.isTracked || 
                product.inventory.quantity > 0;

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

                      <div className="flex items-center justify-between">
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
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={!inStock || addToCart.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
  );
}
