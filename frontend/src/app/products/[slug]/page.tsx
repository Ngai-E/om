'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useProductBySlug } from '@/lib/hooks/use-products';
import { useAddToCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/lib/store/auth-store';
import { useGuestCartStore } from '@/lib/store/guest-cart-store';
import { useCartStore } from '@/lib/store/cart-store';
import { ProductReviews } from '@/components/products/product-reviews';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');
  const { data: product, isLoading } = useProductBySlug(slug);
  const addToCart = useAddToCart();
  const guestCart = useGuestCartStore();
  const { setItemCount } = useCartStore();

  // Get selected variant or use product defaults
  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId);
  const hasVariants = product?.variants && product.variants.length > 0;

  // Debug: Log product variants
  useEffect(() => {
    if (product) {
      console.log('Product loaded:', product.name);
      console.log('Has variants:', hasVariants);
      console.log('Variants:', product.variants);
    }
  }, [product, hasVariants]);

  const handleAddToCart = async () => {
    if (!product) return;

    // If product has variants but none selected, show error
    if (hasVariants && !selectedVariantId) {
      alert('Please select a variant before adding to cart');
      return;
    }

    if (!isAuthenticated) {
      // Add to guest cart (localStorage)
      guestCart.addItem(product.id, quantity, selectedVariantId || undefined);
      setItemCount(guestCart.getItemCount());
      router.push('/cart');
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        variantId: selectedVariantId || undefined,
        quantity,
      });
      router.push('/cart');
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to add to cart. Please try again.';
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-24 bg-muted rounded" />
                <div className="h-12 bg-muted rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  // Check stock based on whether a variant is selected
  // If product has variants but none selected, check if ANY variant has stock
  const inStock = selectedVariant 
    ? selectedVariant.stock > 0 
    : hasVariants && product.variants
      ? product.variants.some(v => v.stock > 0)
      : (product.inventory && product.inventory.quantity > 0);
  const maxQuantity = selectedVariant 
    ? selectedVariant.stock 
    : (product.inventory?.quantity || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to products
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].url}
                alt={product.images[0].altText || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-sm text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            </div>

            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">
                £{parseFloat(product.price).toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  £{parseFloat(product.compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Variant Selector */}
            {hasVariants && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Choose Variant <span className="text-red-600">*</span>
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
                        className={`relative border-2 rounded-lg p-3 transition text-left ${
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
                        ) : (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            In Stock
                          </div>
                        )}

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-omega-green-dark text-white rounded-full p-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!selectedVariantId && (
                  <p className="text-sm text-gray-600 mt-2">
                    Please select a variant to continue
                  </p>
                )}
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {selectedVariant ? (
                selectedVariant.stock > 0 ? (
                  <p className="text-sm text-green-600">
                    ✓ In stock ({selectedVariant.stock} available)
                  </p>
                ) : (
                  <p className="text-sm text-destructive">✗ Out of stock</p>
                )
              ) : hasVariants && product.variants ? (
                inStock ? (
                  <p className="text-sm text-green-600">
                    ✓ In stock ({product.variants.reduce((sum, v) => sum + v.stock, 0)} total across all variants)
                  </p>
                ) : (
                  <p className="text-sm text-destructive">✗ Out of stock</p>
                )
              ) : inStock ? (
                <p className="text-sm text-green-600">
                  ✓ In stock ({product.inventory?.quantity} available)
                </p>
              ) : (
                <p className="text-sm text-destructive">✗ Out of stock</p>
              )}
            </div>

            {/* Quantity Selector */}
            {inStock && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-muted"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-muted"
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock || addToCart.isPending || (hasVariants && !selectedVariantId)}
              className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {addToCart.isPending 
                ? 'Adding...' 
                : hasVariants && !selectedVariantId 
                  ? 'Select a Variant' 
                  : 'Add to Cart'}
            </button>

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-12">
          {/* Tab Headers */}
          <div className="border-b">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 px-2 font-medium transition border-b-2 ${
                  activeTab === 'description'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-4 px-2 font-medium transition border-b-2 ${
                  activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Details & Ingredients
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 px-2 font-medium transition border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Reviews
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">Product Information</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                      <dd className="mt-1">{product.category.name}</dd>
                    </div>
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Tags</dt>
                        <dd className="mt-1">{product.tags.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">Ingredients</h3>
                  <p className="text-muted-foreground">
                    Ingredient information will be displayed here when available.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">Allergen Information</h3>
                  <p className="text-muted-foreground">
                    Allergen information will be displayed here when available.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please check product packaging for the most up-to-date allergen information.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProductReviews productId={product.id} productName={product.name} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
