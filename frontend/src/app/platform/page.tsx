'use client';

import React from 'react';
import { Package, Wrench, Truck, Leaf, Palette, ArrowRight, Star, TrendingUp, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/marketplace/top-nav';
import { RequestCard } from '@/components/marketplace/request-card';
import { ProviderCard } from '@/components/marketplace/provider-card';
import { MobileNav } from '@/components/marketplace/mobile-nav';
import { useQuery } from '@tanstack/react-query';
import { marketplaceRequestsApi, marketplaceProvidersApi } from '@/lib/api/marketplace';

const CategoryItem = ({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) => (
  <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
    <div className="w-12 h-12 mx-auto mb-3 text-primary">{icon}</div>
    <h4 className="font-semibold mb-1">{label}</h4>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function PlatformLandingPage() {
  const router = useRouter();

  // Fetch trending requests
  const { data: requestsData } = useQuery({
    queryKey: ['trending-requests'],
    queryFn: () => marketplaceRequestsApi.listRequests({ status: 'RECEIVING_OFFERS', limit: 6 }),
    retry: false,
  });

  // Fetch recommended providers
  const { data: providersData } = useQuery({
    queryKey: ['recommended-providers'],
    queryFn: () => marketplaceProvidersApi.listProviders({ limit: 4 }),
    retry: false,
  });

  const trendingRequests = requestsData?.requests || [];
  const recommendedProviders = providersData?.providers || [];

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Helper function to format budget
  const formatBudget = (request: any) => {
    if (!request.budgetMin && !request.budgetMax) return undefined;
    const currency = request.budgetCurrency || '$';
    if (request.budgetMin && request.budgetMax) {
      return `${currency}${request.budgetMin.toLocaleString()} - ${currency}${request.budgetMax.toLocaleString()}`;
    }
    if (request.budgetMin) return `${currency}${request.budgetMin.toLocaleString()}+`;
    return `Up to ${currency}${request.budgetMax.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-16 lg:py-24">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">
            Tell us what you want. We'll bring you options.
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 px-4">
            Post your request and get competitive offers from verified providers in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm md:text-base"
            >
              Post a request
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-accent text-accent-foreground px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-accent/90 transition-colors text-sm md:text-base"
            >
              Launch your store
            </button>
          </div>
        </div>

        {/* Hero Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
          {/* Recent Request Preview */}
          <div className="bg-card border-2 border-primary/20 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Recent Request</p>
                <p className="text-xs text-muted-foreground">Posted 2 hours ago</p>
              </div>
            </div>
            <h3 className="font-semibold mb-2 text-sm md:text-base">Need 500 custom t-shirts for company event</h3>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-3">
              <span>San Francisco, CA</span>
              <span>$2,000 - $3,000</span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs md:text-sm font-medium text-accent">12 offers received</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Store Preview */}
          <div className="bg-card border-2 border-accent/20 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Featured Store</p>
                <p className="text-xs text-muted-foreground">Launched this month</p>
              </div>
            </div>
            <h3 className="font-semibold mb-2 text-sm md:text-base">Omega Afro Shop</h3>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-3">
              <span>Groceries & Food</span>
              <span>250 products</span>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-xs md:text-sm font-medium">4.9 rating</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Post request</h3>
              <p className="text-muted-foreground">
                Tell us what you need with photos and details
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get offers</h3>
              <p className="text-muted-foreground">
                Receive competitive quotes from verified providers
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose best</h3>
              <p className="text-muted-foreground">
                Compare and select the offer that fits your needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Browse categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <CategoryItem icon={<Package className="w-full h-full" />} label="Products" description="Physical goods and merchandise" />
          <CategoryItem icon={<Wrench className="w-full h-full" />} label="Services" description="Professional services" />
          <CategoryItem icon={<Truck className="w-full h-full" />} label="Logistics" description="Shipping and delivery" />
          <CategoryItem icon={<Leaf className="w-full h-full" />} label="Agriculture" description="Farm products and supplies" />
          <CategoryItem icon={<Palette className="w-full h-full" />} label="Creative" description="Design and creative work" />
        </div>
      </section>

      {/* Trending Requests */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Trending Requests</h2>
            <p className="text-muted-foreground">Active requests from buyers in your area</p>
          </div>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
          >
            View All
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingRequests.length > 0 ? (
            trendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                id={request.id}
                title={request.title}
                category={request.categoryKey}
                location={request.city && request.countryCode ? `${request.city}, ${request.countryCode}` : request.city || 'Location not specified'}
                budget={formatBudget(request)}
                timePosted={formatTimeAgo(request.createdAt)}
                offers={request.offerCount}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No active requests at the moment. Be the first to post!</p>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Providers */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Recommended Providers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProviders.length > 0 ? (
            recommendedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                name={provider.displayName || provider.businessName || 'Provider'}
                rating={provider.averageRating || provider.rating || 0}
                specialization={provider.categories?.[0]?.categoryKey || provider.categoryKeys?.[0] || 'General Services'}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No providers available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Sample Stores Created */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Stores on Our Platform</h2>
            <p className="text-muted-foreground">Join thousands of successful businesses</p>
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-accent text-accent-foreground px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors font-semibold"
          >
            Launch Your Store
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Omega Afro Shop', category: 'Groceries & Food', products: 250 },
            { name: 'Urban Fashion Hub', category: 'Clothing & Apparel', products: 180 },
            { name: 'Green Garden Supply', category: 'Agriculture', products: 120 },
            { name: 'Tech Gadgets Pro', category: 'Electronics', products: 340 },
          ].map((store, index) => (
            <div key={index} className="p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-1">{store.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">{store.category}</p>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{store.products} products</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For Businesses */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Get customers, not just a store</h2>
            <p className="text-xl mb-8 opacity-90">
              Launch your storefront and start bidding on customer requests instantly.
              No waiting for organic traffic.
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-accent text-accent-foreground px-8 py-4 rounded-lg font-semibold hover:bg-accent/90 transition-colors inline-flex items-center gap-2"
            >
              Launch your store <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">Verified Providers</h3>
              <p className="text-primary-foreground/80">All providers are thoroughly vetted and verified</p>
            </div>
            <div>
              <Star className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">Fast Responses</h3>
              <p className="text-primary-foreground/80">Get offers within hours, not days</p>
            </div>
            <div>
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">Top Ratings</h3>
              <p className="text-primary-foreground/80">Average provider rating of 4.8/5 stars</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/marketplace/post-request" className="hover:text-foreground">Post a Request</Link></li>
                <li><Link href="/marketplace" className="hover:text-foreground">Browse Categories</Link></li>
                <li><Link href="/platform" className="hover:text-foreground">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/onboarding" className="hover:text-foreground">Launch Your Store</Link></li>
                <li><Link href="/marketplace" className="hover:text-foreground">Respond to Requests</Link></li>
                <li><Link href="/marketplace/provider" className="hover:text-foreground">Provider Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Trust & Safety</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Commerce Ecosystem. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <MobileNav />
    </div>
  );
}
