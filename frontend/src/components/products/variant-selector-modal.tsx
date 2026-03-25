'use client';

import { useState } from 'react';
import { X, ShoppingCart, Check, Package } from 'lucide-react';
import type { Product } from '@/types';
import { useAddToCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/lib/store/auth-store';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { useCartStore } from '@/lib/store/cart-store';
import Link from 'next/link';

interface VariantSelectorModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function VariantSelectorModal({ product, isOpen, onClose }: VariantSelectorModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id || null
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToCart = useAddToCart();
  const guestCart = useGuestCartStore();
  const { setItemCount } = useCartStore();

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);

  const handleAddToCart = async () => {
    if (!selectedVariantId) return;

    if (!isAuthenticated) {
      guestCart.addItem(product.id, quantity, selectedVariantId);
      setItemCount(guestCart.getItemCount());
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        onClose();
      }, 1000);
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity,
        variantId: selectedVariantId,
      });
      
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-20 md:pb-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Select Options</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info */}
          <div className="flex gap-4 mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {product.images?.[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
            </div>
          </div>

          {/* Variant Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Choose Variant
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {product.variants?.map((variant) => {
                const isSelected = selectedVariantId === variant.id;
                const isOutOfStock = variant.stock <= 0;
                const variantImage = variant.imageUrl || product.images?.[0]?.url;

                return (
                  <button
                    key={variant.id}
                    onClick={() => !isOutOfStock && setSelectedVariantId(variant.id)}
                    disabled={isOutOfStock}
                    className={`relative border-2 rounded-lg p-3 transition ${
                      isSelected
                        ? 'border-omega-green-dark bg-green-50'
                        : isOutOfStock
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Variant Image */}
                    {variantImage && (
                      <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                        <img
                          src={variantImage}
                          alt={variant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Variant Name */}
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {variant.name}
                    </div>
                    
                    {/* Variant Price */}
                    <div className="text-lg font-black text-omega-orange">
                      £{parseFloat(variant.price).toFixed(2)}
                    </div>

                    {/* Stock Status */}
                    {isOutOfStock ? (
                      <div className="text-xs text-red-600 font-medium mt-1">
                        Out of Stock
                      </div>
                    ) : variant.stock < 5 ? (
                      <div className="text-xs text-orange-600 font-medium mt-1">
                        Only {variant.stock} left
                      </div>
                    ) : null}

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-omega-green-dark text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          {selectedVariant && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedVariant.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(selectedVariant.stock, parseInt(e.target.value) || 1)))}
                  className="w-20 h-10 border border-gray-300 rounded-lg text-center font-semibold"
                />
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  disabled={quantity >= selectedVariant.stock}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <span className="text-sm text-gray-600 ml-2">
                  {selectedVariant.stock} available
                </span>
              </div>
            </div>
          )}

          {/* Total Price */}
          {selectedVariant && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total:</span>
                <span className="text-2xl font-black text-omega-orange">
                  £{(parseFloat(selectedVariant.price) * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 md:p-6 bg-gray-50 sticky bottom-0 shadow-lg">
          <div className="flex gap-3">
            <Link
              href={`/products/${product.slug}`}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition text-center"
              onClick={onClose}
            >
              View Details
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariantId || (selectedVariant && selectedVariant.stock <= 0) || addToCart.isPending}
              className={`flex-1 px-6 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                justAdded
                  ? 'bg-green-600 text-white'
                  : 'bg-omega-green-dark hover:bg-omega-green text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
