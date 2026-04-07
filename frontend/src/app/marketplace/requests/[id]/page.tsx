'use client';

import React, { useState } from 'react';
import { ArrowLeft, MapPin, Clock, DollarSign, MessageCircle, FileText, Users, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { MobileNav } from '@/components/marketplace/mobile-nav';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceRequestsApi, MarketplaceOffer } from '@/lib/api/marketplace';
import { formatTimeAgo, formatPrice } from '@/lib/utils/formatters';
import { useAuthStore } from '@/lib/store/auth-store';
import { ConfirmationModal, AlertModal } from '@/components/ui/confirmation-modal';

export default function RequestDetailPage() {
  const [activeTab, setActiveTab] = useState<'details' | 'offers' | 'chat'>('details');
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Calculate header height dynamically
  React.useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  // Fetch request details
  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => marketplaceRequestsApi.getRequest(requestId),
    retry: false,
  });

  // Fetch offers for this request
  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['request-offers', requestId],
    queryFn: () => marketplaceRequestsApi.listRequestOffers(requestId),
    retry: false,
    enabled: !!requestId,
  });

  const offers = offersData?.offers || [];

  // Accept offer mutation
  const acceptOfferMutation = useMutation({
    mutationFn: (offerId: string) => marketplaceRequestsApi.acceptOffer(requestId, offerId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request-offers', requestId] });
      setAcceptingOfferId(null);
      setShowConfirmModal(false);
      setPendingOfferId(null);
    },
    onError: (error: any) => {
      console.error('Failed to accept offer:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to accept offer. Please try again.');
      setShowErrorModal(true);
      setAcceptingOfferId(null);
      setShowConfirmModal(false);
      setPendingOfferId(null);
    },
  });

  const handleAcceptOffer = (offerId: string) => {
    if (!user || request?.buyerUserId !== user.id) {
      setErrorMessage('You can only accept offers on your own requests');
      setShowErrorModal(true);
      return;
    }

    setPendingOfferId(offerId);
    setShowConfirmModal(true);
  };

  const confirmAcceptOffer = () => {
    if (pendingOfferId) {
      setAcceptingOfferId(pendingOfferId);
      acceptOfferMutation.mutate(pendingOfferId);
    }
  };

  const formatBudget = () => {
    if (!request) return '';
    if (!request.budgetMin && !request.budgetMax) return 'Budget not specified';
    const currency = request.budgetCurrency || '$';
    if (request.budgetMin && request.budgetMax) {
      return `${currency}${request.budgetMin.toLocaleString()} - ${currency}${request.budgetMax.toLocaleString()}`;
    }
    if (request.budgetMin) return `${currency}${request.budgetMin.toLocaleString()}+`;
    if (request.budgetMax) return `Up to ${currency}${request.budgetMax.toLocaleString()}`;
    return 'Budget not specified';
  };

  // Check if user is the request owner
  const isOwner = user && request && request.buyerUserId === user.id;
  const canAcceptOffers = isOwner && request?.status === 'RECEIVING_OFFERS';

  if (requestLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Request not found</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div ref={headerRef} className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold">{request.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{request.city && request.countryCode ? `${request.city}, ${request.countryCode}` : request.city || 'Location not specified'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTimeAgo(request.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatBudget()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div 
        className="bg-card border-b border-border sticky z-10"
        style={{ top: `${headerHeight}px` }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </div>
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`py-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'offers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Offers ({offers.length})
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'details' && (
          <div className="max-w-3xl">
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{request.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{request.categoryKey}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-medium">{request.urgency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{request.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="space-y-4">
            {offersLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading offers...</p>
              </div>
            ) : offers.length > 0 ? (
              offers.map((offer: MarketplaceOffer) => (
                <div key={offer.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{offer.provider?.displayName || 'Provider'}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {offer.provider?.averageRating && (
                          <>
                            <span>⭐ {offer.provider.averageRating.toFixed(1)}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatTimeAgo(offer.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">{formatPrice(offer)}</p>
                      {offer.estimatedDeliveryDays && (
                        <p className="text-sm text-muted-foreground">ETA: {offer.estimatedDeliveryDays} days</p>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{offer.message}</p>
                  {offer.status && (
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        offer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {canAcceptOffers && offer.status === 'SUBMITTED' && (
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        disabled={acceptingOfferId === offer.id}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {acceptingOfferId === offer.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          'Accept Offer'
                        )}
                      </button>
                    )}
                    {!canAcceptOffers && offer.status === 'SUBMITTED' && (
                      <div className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-center font-medium">
                        {isOwner ? 'Cannot accept (request not active)' : 'Only request owner can accept'}
                      </div>
                    )}
                    <button className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium">
                      Message
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No offers yet. Providers will submit offers soon!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <MobileNav />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingOfferId(null);
        }}
        onConfirm={confirmAcceptOffer}
        title="Accept Offer"
        message="Are you sure you want to accept this offer? This will reject all other offers and you won't be able to undo this action."
        confirmText="Accept Offer"
        cancelText="Cancel"
        variant="success"
        isLoading={!!acceptingOfferId}
      />

      {/* Error Modal */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        variant="error"
      />
    </div>
  );
}
