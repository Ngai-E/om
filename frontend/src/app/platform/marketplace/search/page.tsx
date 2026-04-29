'use client';

import { Suspense, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, Store, Star, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku: string;
  slug: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
  tenant: {
    id: string;
    name: string;
    slug: string;
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
    };
    domains: Array<{
      domain: string;
      type: string;
    }>;
  };
  category?: {
    id: string;
    name: string;
  };
}

function MarketplaceSearchInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['marketplace-search', query],
    queryFn: () => apiClient.get('/marketplace/search', {
      params: { q: query, limit: 50 },
    }),
    enabled: !!query,
  });

  const products = searchResults?.data?.products || [];
  const total = searchResults?.data?.total || 0;

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Search for products</h2>
          <p className="text-gray-500">Enter a search term to find products across all stores</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="h-40 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Search className="w-6 h-6 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
              <p className="text-gray-600">
                {total} {total === 1 ? 'product' : 'products'} found for "{query}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              Try searching with different keywords or browse stores directly
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketplaceSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Loading search...</p>
          </div>
        </div>
      }
    >
      <MarketplaceSearchInner />
    </Suspense>
  );
}

function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images[0];
  const primaryDomain = product.tenant.domains.find(d => d.type === 'SUBDOMAIN')?.domain || product.tenant.domains[0]?.domain;
  const storeUrl = primaryDomain ? `https://${primaryDomain}` : '#';
  const productUrl = primaryDomain ? `https://${primaryDomain}/products/${product.slug}` : '#';

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition group">
      {/* Product Image */}
      <div className="h-48 bg-gray-100 relative">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-400 text-4xl">📦</div>
          </div>
        )}
        
        {/* Store Badge */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Store className="w-3 h-3" />
          {product.tenant.name}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-gray-900">
            £{Number(product.price).toFixed(2)}
          </span>
          {product.category && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            View Product
          </a>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            title={`Visit ${product.tenant.name}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
