'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Heart, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import type { Product } from '@/types';
import { useAddToCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/lib/store/auth-store';
import { useWishlistStore } from '@/lib/store/wishlist-store';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { StockBadge } from './stock-badge';
import { VariantSelectorModal } from './variant-selector-modal';

interface ProductCardProps {
  product: Product;
}

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

function SocialProofBadge({ product }: { product: Product }) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  // Check global setting to show badges and that count is greater than 0
  if (!settings?.show_product_order_badges || !product.orderCount || product.orderCount === 0) return null;

  const inflation = settings?.product_orders_inflation || 1.0;
  const displayCount = Math.floor(product.orderCount * inflation);

  // Don't show if calculated count is 0
  if (displayCount === 0) return null;

  return (
    <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
      <TrendingUp className="w-3 h-3" />
      <span>{formatNumber(displayCount)} orders</span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const addToCart = useAddToCart();
  const guestCart = useGuestCartStore();
  const { setItemCount } = useCartStore();
  const [showToast, setShowToast] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If product has variants, show variant selector modal
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants) {
      setShowVariantModal(true);
      return;
    }
    
    if (!isAuthenticated) {
      // Add to guest cart (localStorage)
      guestCart.addItem(product.id, 1);
      setItemCount(guestCart.getItemCount());
      
      // Show success feedback
      setJustAdded(true);
      setShowToast(true);
      setTimeout(() => setJustAdded(false), 2000);
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

  const hasVariants = product.variants && product.variants.length > 0;
  
  // Check stock: if product has variants, check if ANY variant is in stock
  // Otherwise, check the product's own inventory
  const inStock = hasVariants && product.variants
    ? product.variants.some(variant => variant.stock > 0)
    : product.inventory && product.inventory.quantity > 0;
    
  const lowStock = product.inventory && product.inventory.quantity < product.inventory.lowStockThreshold;

  return (
    <>
      {showToast && (
        <Toast
          message={`${product.name} added to cart!`}
          onClose={() => setShowToast(false)}
        />
      )}

      <VariantSelectorModal
        product={product}
        isOpen={showVariantModal}
        onClose={() => setShowVariantModal(false)}
      />
      
      <Link href={`/products/${product.slug}`}>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
        <div className="aspect-square bg-gray-100 relative">
          {/* Social Proof Badge - positioned absolutely on image */}
          <SocialProofBadge product={product} />
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
          
          {/* Best Seller Tag */}
          {product.isBestSeller && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
              Best Seller
            </div>
          )}
          
          {/* Discount Tag */}
          {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
            <div className="absolute top-2 left-2 bg-secondary text-white px-2 py-1 rounded text-xs font-bold" style={{ marginTop: product.isBestSeller ? '32px' : '0' }}>
              Save £{(parseFloat(product.compareAtPrice) - parseFloat(product.price)).toFixed(2)}
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

          {(product.inventory?.isTracked || hasVariants) && !product.isBestSeller && !(product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price)) && (
            <div className="absolute top-2 left-2">
              <StockBadge
                quantity={
                  hasVariants && product.variants
                    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                    : product.inventory?.quantity || 0
                }
                lowStockThreshold={product.inventory?.lowStockThreshold || 10}
                isTracked={true}
                size="sm"
              />
            </div>
          )}
        </div>

        <div className="p-3 text-center">
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-3xl font-black text-secondary mb-1">
            £{parseFloat(product.price).toFixed(2)}
          </p>
          {hasVariants && product.variants && product.variants.length > 1 && (
            <p className="text-xs text-gray-500 mb-2">
              +{product.variants.length - 1} variant{product.variants.length > 2 ? 's' : ''}
            </p>
          )}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || addToCart.isPending}
            className={`w-full py-2 rounded text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              justAdded
                ? 'bg-green-600 text-white'
                : !inStock
                ? 'bg-gray-400 text-white'
                : hasVariants
                ? 'bg-primary hover:bg-primary/80 text-white'
                : 'bg-primary hover:bg-primary/80 text-white'
            }`}
            title={
              !inStock 
                ? 'Out of stock' 
                : hasVariants 
                  ? 'Select variant' 
                  : 'Add to cart'
            }
          >
            {justAdded ? (
              <Check className="w-4 h-4 inline" />
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </Link>
    </>
  );
}
