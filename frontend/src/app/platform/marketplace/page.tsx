'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Store, Star, MapPin, Filter, Grid, List } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  domains: Array<{
    domain: string;
    type: string;
  }>;
  _count?: {
    products: number;
  };
}

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch all active tenants
  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['marketplace-tenants', searchTerm, selectedCategory],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketplace/tenants', {
        params: {
          search: searchTerm || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        },
      });
      return data;
    },
  });

  const tenants = tenantsData?.tenants || [];

  const categories = [
    { id: 'all', name: 'All Stores', icon: '🏪' },
    { id: 'grocery', name: 'Grocery', icon: '🛒' },
    { id: 'fashion', name: 'Fashion', icon: '👗' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'home', name: 'Home & Garden', icon: '🏠' },
    { id: 'health', name: 'Health & Beauty', icon: '💄' },
    { id: 'food', name: 'Food & Dining', icon: '🍽️' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-6">
                <div className="h-32 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
              <p className="text-gray-600 mt-1">Discover amazing stores and products</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores, products, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stores Grid/List */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back soon for new stores'
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {tenants.map((tenant: Tenant) => (
              <StoreCard key={tenant.id} tenant={tenant} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoreCard({ tenant, viewMode }: { tenant: Tenant; viewMode: 'grid' | 'list' }) {
  const primaryDomain = tenant.domains.find(d => d.type === 'SUBDOMAIN')?.domain || tenant.domains[0]?.domain;
  const storeUrl = primaryDomain ? `https://${primaryDomain}` : '#';

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            {tenant.branding?.logoUrl ? (
              <img src={tenant.branding.logoUrl} alt={tenant.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Store className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{tenant.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{tenant.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Online Store
              </span>
              {tenant._count?.products && (
                <span>{tenant._count.products} products</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Visit Store
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition">
      <div className="h-48 bg-gray-100 flex items-center justify-center">
        {tenant.branding?.logoUrl ? (
          <img src={tenant.branding.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <Store className="w-16 h-16 text-gray-400" />
        )}
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">{tenant.name}</h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{tenant.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {tenant._count?.products && (
              <span>{tenant._count.products} products</span>
            )}
          </div>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Visit Store
          </a>
        </div>
      </div>
    </div>
  );
}
