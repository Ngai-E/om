'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, DollarSign, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { TopNav } from '@/components/marketplace/top-nav';
import { MobileNav } from '@/components/marketplace/mobile-nav';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceMatchesApi, marketplaceOffersApi, marketplaceProvidersApi, MarketplaceMatch } from '@/lib/api/marketplace';
import { formatTimeAgo, formatBudget } from '@/lib/utils/formatters';

export default function ProviderDashboardPage() {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MarketplaceMatch | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/marketplace/provider');
    } else if (!user?.tenantId) {
      // User is authenticated but doesn't have a provider profile
      router.push('/onboarding?message=You need to create a store to access the provider dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Fetch provider profile and stats
  const { data: provider } = useQuery({
    queryKey: ['my-provider'],
    queryFn: () => marketplaceProvidersApi.getMyProvider(),
    enabled: isAuthenticated && !!user?.tenantId,
  });

  const { data: providerStats } = useQuery({
    queryKey: ['provider-stats', provider?.id],
    queryFn: () => marketplaceProvidersApi.getProviderStats(provider!.id),
    enabled: !!provider?.id,
  });

  // Fetch matched requests
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => marketplaceMatchesApi.getMyMatches({ status: 'MATCHED', limit: 20 }),
    enabled: isAuthenticated && !!user?.tenantId,
  });

  // Fetch my offers
  const { data: offersData } = useQuery({
    queryKey: ['my-offers'],
    queryFn: () => marketplaceOffersApi.listMyOffers({ limit: 20 }),
    enabled: isAuthenticated && !!user?.tenantId,
  });

  // Submit offer mutation
  const submitOfferMutation = useMutation({
    mutationFn: (data: { requestId: string; price: number; message: string; estimatedDeliveryDays?: number }) =>
      marketplaceOffersApi.submitOffer(data.requestId, {
        price: data.price,
        currency: 'USD',
        message: data.message,
        estimatedDeliveryDays: data.estimatedDeliveryDays,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
      setShowOfferModal(false);
      setSelectedMatch(null);
      setOfferPrice('');
      setOfferMessage('');
      setEstimatedDays('');
    },
  });

  const handleSubmitOffer = () => {
    if (!selectedMatch || !offerPrice || !offerMessage) return;

    submitOfferMutation.mutate({
      requestId: selectedMatch.requestId,
      price: parseFloat(offerPrice),
      message: offerMessage,
      estimatedDeliveryDays: estimatedDays ? parseInt(estimatedDays) : undefined,
    });
  };

  const handleMakeOffer = (match: MarketplaceMatch) => {
    setSelectedMatch(match);
    setShowOfferModal(true);
  };

  // Show loading while checking authentication
  if (!isAuthenticated || !user?.tenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const matches = matchesData?.matches || [];
  const offers = offersData?.offers || [];
  const stats = providerStats || { totalOffers: 0, acceptedOffers: 0, rating: 0 };

  return (
    <div className="min-h-screen bg-background py-8">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Provider Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Total Offers */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.totalOffers || 0}</p>
            <p className="text-sm text-muted-foreground">Total offers submitted</p>
          </div>

          {/* Accepted Offers */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.acceptedOffers || 0}</p>
            <p className="text-sm text-muted-foreground">Accepted offers</p>
          </div>

          {/* Rating */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.rating ? stats.rating.toFixed(1) : 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Average rating</p>
          </div>
        </div>

        {/* Matched Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Matched Requests</h2>
            <span className="text-sm text-muted-foreground">{matches.length} matches</span>
          </div>
          
          {matchesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading matches...</p>
            </div>
          ) : matches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <div key={match.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{match.request?.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {match.request?.description}
                      </p>
                    </div>
                    <div className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-semibold ml-2">
                      {match.score}%
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {match.request && formatBudget(match.request) && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Budget:</span>{' '}
                        <span className="font-medium">{formatBudget(match.request)}</span>
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="text-muted-foreground">Match reason:</span>{' '}
                      <span className="text-xs">{match.reasonSummary}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(match.createdAt)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleMakeOffer(match)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Submit Offer
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
              <p className="text-muted-foreground">
                When buyers post requests that match your categories and service areas, they'll appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      <MobileNav />

      {/* Offer Submission Modal */}
      {showOfferModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-border">
            <h3 className="text-xl font-bold mb-4">Submit Your Offer</h3>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-1">{selectedMatch.request?.title}</h4>
              <p className="text-sm text-muted-foreground">{selectedMatch.request?.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Price (USD)</label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="e.g., 2500"
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Delivery (days)</label>
                <input
                  type="number"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  placeholder="e.g., 7"
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Your Proposal</label>
                <textarea
                  rows={6}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Explain why you're the best fit for this request..."
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            
            {submitOfferMutation.isError && (
              <div className="mt-4 bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                {(submitOfferMutation.error as any)?.response?.data?.message || 'Failed to submit offer. Please try again.'}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setSelectedMatch(null);
                  setOfferPrice('');
                  setOfferMessage('');
                  setEstimatedDays('');
                }}
                disabled={submitOfferMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={!offerPrice || !offerMessage || submitOfferMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitOfferMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Offer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
