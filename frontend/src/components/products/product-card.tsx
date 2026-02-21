'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Heart } from 'lucide-react';
import type { Product } from '@/types';
import { useAddToCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/lib/store/auth-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { StockBadge } from './stock-badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const addToCart = useAddToCart();
  const [showToast, setShowToast] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      
      // Show success feedback
      setJustAdded(true);
      setShowToast(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const inStock = product.inventory && product.inventory.quantity > 0;
  const lowStock = product.inventory && product.inventory.quantity < product.inventory.lowStockThreshold;

  return (
    <>
      {showToast && (
        <Toast
          message={`${product.name} added to cart!`}
          onClose={() => setShowToast(false)}
        />
      )}
      
      <Link href={`/products/${product.slug}`}>
        <div className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square bg-muted relative">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              inWishlist ? removeItem(product.id) : addItem(product.id);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition z-10"
          >
            <Heart
              className={`w-5 h-5 ${
                inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>

          {product.inventory && product.inventory.isTracked && (
            <div className="absolute top-2 left-2">
              <StockBadge
                quantity={product.inventory.quantity}
                lowStockThreshold={product.inventory.lowStockThreshold}
                isTracked={product.inventory.isTracked}
                size="sm"
              />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">
                £{parseFloat(product.price).toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  £{parseFloat(product.compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock || addToCart.isPending}
              className={`p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                justAdded
                  ? 'bg-green-600 text-white'
                  : !inStock
                  ? 'bg-gray-400 text-white'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
              title={!inStock ? 'Out of stock' : 'Add to cart'}
            >
              {justAdded ? (
                <Check className="w-5 h-5" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
    </>
  );
}
