'use client';

import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RequestCard } from '@/components/marketplace/request-card';
import { ProviderCard } from '@/components/marketplace/provider-card';
import { CategoryChip } from '@/components/marketplace/category-chip';
import { MobileNav } from '@/components/marketplace/mobile-nav';
import { TopNav } from '@/components/marketplace/top-nav';
import { useQuery } from '@tanstack/react-query';
import { marketplaceRequestsApi, marketplaceProvidersApi } from '@/lib/api/marketplace';

const categories = ['All', 'Products', 'Services', 'Logistics', 'Agriculture', 'Creative'];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Fetch requests based on selected category
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['marketplace-requests', selectedCategory],
    queryFn: () => marketplaceRequestsApi.listRequests({
      status: 'RECEIVING_OFFERS',
      categoryKey: selectedCategory !== 'All' ? selectedCategory : undefined,
      limit: 20,
    }),
    retry: false,
  });

  // Fetch featured providers
  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ['featured-providers'],
    queryFn: () => marketplaceProvidersApi.listProviders({
      limit: 3,
    }),
    retry: false,
  });

  const requests = requestsData?.requests || [];
  const featuredProviders = providersData?.providers || [];

  // Helper functions
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const formatBudget = (request: any) => {
    if (!request.budgetMin && !request.budgetMax) return undefined;
    const currency = request.budgetCurrency || '$';
    if (request.budgetMin && request.budgetMax) {
      return `${currency}${request.budgetMin.toLocaleString()} - ${currency}${request.budgetMax.toLocaleString()}`;
    }
    if (request.budgetMin) return `${currency}${request.budgetMin.toLocaleString()}+`;
    return `Up to ${currency}${request.budgetMax.toLocaleString()}`;
  };

  // Filter requests by search query
  const filteredRequests = searchQuery
    ? requests.filter((req) =>
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : requests;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search or post what you need"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => router.push('/marketplace/post-request')}
          className="w-full mb-6 bg-accent text-accent-foreground py-4 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <Plus className="h-5 w-5" />
          <span>Post a request</span>
        </button>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>

        {/* Recent Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Requests</h2>
            <button
              onClick={() => router.push('/marketplace/post-request')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              Post Request
            </button>
          </div>
          {requestsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading requests...</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  id={request.id}
                  title={request.title}
                  category={request.categoryKey}
                  budget={formatBudget(request)}
                  location={request.city && request.countryCode ? `${request.city}, ${request.countryCode}` : request.city || 'Location not specified'}
                  timePosted={formatTimeAgo(request.createdAt)}
                  status={request.status}
                  offers={request.offerCount}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">
                {searchQuery ? 'No requests match your search.' : 'No active requests yet. Be the first to post!'}
              </p>
            </div>
          )}
        </div>

        {/* Featured Providers */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Providers</h2>
          {providersLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading providers...</p>
            </div>
          ) : featuredProviders.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {featuredProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  name={provider.displayName || provider.businessName || 'Provider'}
                  rating={provider.averageRating || provider.rating || 0}
                  specialization={provider.categories?.[0]?.categoryKey || provider.categoryKeys?.[0] || 'General Services'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">No providers available yet.</p>
            </div>
          )}
        </div>

        {/* Trust strip */}
        <div className="bg-card rounded-lg p-6 text-center border border-border">
          <p className="text-muted-foreground">
            Join over <span className="text-accent font-semibold">10,000+</span> satisfied customers and{' '}
            <span className="text-accent font-semibold">5,000+</span> verified providers
          </p>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
