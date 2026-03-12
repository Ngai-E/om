'use client';

import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');
  const { data: product, isLoading } = useProductBySlug(slug);
  const addToCart = useAddToCart();
  const guestCart = useGuestCartStore();
  const { setItemCount } = useCartStore();

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      // Add to guest cart (localStorage)
      guestCart.addItem(product.id, quantity);
      setItemCount(guestCart.getItemCount());
      router.push('/cart');
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity,
      });
      router.push('/cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
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

  const inStock = product.inventory && product.inventory.quantity > 0;
  const maxQuantity = product.inventory?.quantity || 0;

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

            {/* Stock Status */}
            <div className="mb-6">
              {inStock ? (
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
              disabled={!inStock || addToCart.isPending}
              className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
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
