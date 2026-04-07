'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Target, DollarSign, Plus, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { RequestCard } from '@/components/marketplace/request-card';
import { TopNav } from '@/components/marketplace/top-nav';
import { MobileNav } from '@/components/marketplace/mobile-nav';

const mockAvailableRequests = [
  {
    id: '1',
    title: 'Need custom wooden furniture for office',
    budget: '$2,000 - $3,000',
    location: 'San Francisco, CA',
    timePosted: '2 hours ago',
    matchScore: 95,
  },
  {
    id: '2',
    title: 'Looking for organic vegetable delivery',
    budget: '$50/week',
    location: 'Los Angeles, CA',
    timePosted: '4 hours ago',
    matchScore: 88,
  },
];

export default function ProviderDashboardPage() {
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/marketplace/provider');
    } else if (!user?.tenantId) {
      // User is authenticated but doesn't have a provider profile
      router.push('/onboarding?message=You need to create a store to access the provider dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Show loading while checking authentication
  if (!isAuthenticated || !user?.tenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleBid = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowBidModal(true);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Placeholder Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Placeholder UI:</strong> This provider dashboard uses mock data. Wallet credits, bid statistics, and revenue metrics are not connected to real backend APIs. This is for UI demonstration only.
              </p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-8">Provider Dashboard</h1>

        {/* Stats Grid - MOCK DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Wallet */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <button
                disabled
                className="text-xs text-muted-foreground font-medium flex items-center gap-1 cursor-not-allowed opacity-50"
                title="Placeholder feature - not implemented"
              >
                <Plus className="h-3 w-3" />
                Top up
              </button>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">250</p>
            <p className="text-sm text-muted-foreground">Credits (mock data)</p>
          </div>

          {/* Active Bids */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-muted-foreground">12</p>
            <p className="text-sm text-muted-foreground">Active bids (mock)</p>
          </div>

          {/* Win Rate */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-muted-foreground">68%</p>
            <p className="text-sm text-muted-foreground">Win rate (mock)</p>
          </div>

          {/* Revenue */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-muted-foreground">$8,450</p>
            <p className="text-sm text-muted-foreground">Revenue (mock)</p>
          </div>
        </div>

        {/* Available Requests - MOCK DATA */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Available requests</h2>
            <span className="text-sm text-muted-foreground">Sorted by match score</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockAvailableRequests.map((request) => (
              <div key={request.id} className="relative">
                <div className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-semibold">
                  {request.matchScore}% match
                </div>
                <RequestCard {...request} />
                <button
                  disabled
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed font-medium"
                  title="Placeholder feature - not implemented"
                >
                  Place bid (disabled)
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Top-up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Top up credits</h3>
              <div className="space-y-3 mb-6">
                {[
                  { credits: 100, price: 49, popular: false },
                  { credits: 250, price: 99, popular: true },
                  { credits: 500, price: 179, popular: false },
                ].map((package_) => (
                  <button
                    key={package_.credits}
                    className={`w-full p-4 rounded-lg border-2 text-left hover:border-primary transition-colors ${
                      package_.popular ? 'border-accent bg-accent/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{package_.credits} credits</p>
                        <p className="text-sm text-muted-foreground">
                          ${(package_.price / package_.credits).toFixed(2)} per credit
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${package_.price}</p>
                        {package_.popular && (
                          <span className="text-xs text-accent font-medium">Most popular</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold">
                  Purchase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bid Composer Modal */}
        {showBidModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Place your bid</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Your price</label>
                  <input
                    type="text"
                    placeholder="e.g., $2,500"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated completion time</label>
                  <input
                    type="text"
                    placeholder="e.g., 2-3 weeks"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message to buyer</label>
                  <textarea
                    placeholder="Explain why you're the best fit for this request..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost to submit bid:</span>
                    <span className="font-semibold">5 credits</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Your balance after:</span>
                    <span className="font-semibold">245 credits</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-semibold">
                  Submit bid
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
