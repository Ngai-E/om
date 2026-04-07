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

        {/* Available Requests - PLACEHOLDER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Matched Requests <span className="text-sm font-normal text-muted-foreground">(Coming Soon)</span></h2>
          </div>
          
          {/* Placeholder State */}
          <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Provider Matching Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                The automatic matching system will connect you with relevant marketplace requests based on your categories, service areas, and ratings.
              </p>
              <div className="bg-card border border-border rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium">Planned Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI-powered request matching</li>
                  <li>• Credit-based bidding system</li>
                  <li>• Real-time notifications</li>
                  <li>• Match score analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
