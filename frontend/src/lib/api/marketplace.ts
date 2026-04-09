import { apiClient } from './client';

// Types
export interface MarketplaceRequest {
  id: string;
  title: string;
  description: string;
  categoryKey: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency?: string;
  urgency: string;
  city?: string;
  countryCode?: string;
  status: string;
  buyerUserId: string;
  acceptedOfferId?: string;
  createdAt: string;
  updatedAt: string;
  images?: Array<{ url: string; caption?: string }>;
  offerCount?: number;
}

export interface MarketplaceProvider {
  id: string;
  tenantId?: string;
  displayName: string;
  businessName?: string; // Legacy field for compatibility
  slug?: string;
  description?: string;
  providerType: string;
  email?: string;
  phone?: string;
  status: string;
  isVerified: boolean;
  averageRating?: number;
  rating?: number; // Legacy field for compatibility
  totalReviews?: number;
  totalCompletedJobs?: number; // Legacy field for compatibility
  createdAt: string;
  updatedAt: string;
  // Relations
  categories?: Array<{ id: string; categoryKey: string }>;
  categoryKeys?: string[]; // Legacy field for compatibility
  serviceAreas?: Array<{ id: string; countryCode?: string; city?: string }>;
  city?: string; // Legacy field for compatibility
  countryCode?: string; // Legacy field for compatibility
}

export interface MarketplaceOffer {
  id: string;
  requestId: string;
  providerId: string;
  price: number;
  currency: string;
  message: string;
  estimatedDeliveryDays?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  provider?: MarketplaceProvider;
}

export interface MarketplaceMatch {
  id: string;
  requestId: string;
  providerId: string;
  score: number;
  reasonSummary: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  request?: MarketplaceRequest;
}

export interface ListRequestsParams {
  status?: string;
  categoryKey?: string;
  city?: string;
  countryCode?: string;
  limit?: number;
  offset?: number;
}

export interface ListProvidersParams {
  status?: string;
  providerType?: string;
  categoryKey?: string;
  city?: string;
  countryCode?: string;
  limit?: number;
  offset?: number;
}

export interface CreateRequestDto {
  requestType: 'PRODUCT' | 'SERVICE';
  title: string;
  description: string;
  categoryKey: string;
  budgetMin?: number;
  budgetMax?: number;
  currencyCode?: string;
  urgency?: string;
  city?: string;
  countryCode?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface CreateOfferDto {
  price: number;
  currency: string;
  message: string;
  estimatedDeliveryDays?: number;
}

// Marketplace Requests API
export const marketplaceRequestsApi = {
  // List all requests (public)
  listRequests: async (params?: ListRequestsParams) => {
    const { data } = await apiClient.get<{ requests: MarketplaceRequest[]; total: number }>('/marketplace/requests', { params });
    return data;
  },

  // Get single request
  getRequest: async (id: string) => {
    const { data } = await apiClient.get<MarketplaceRequest>(`/marketplace/requests/${id}`);
    return data;
  },

  // Create request (authenticated)
  createRequest: async (dto: CreateRequestDto) => {
    const { data } = await apiClient.post<MarketplaceRequest>('/marketplace/requests', dto);
    return data;
  },

  // List my requests (authenticated)
  listMyRequests: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const { data } = await apiClient.get<{ requests: MarketplaceRequest[]; total: number }>('/marketplace/my/requests', { params });
    return data;
  },

  // Cancel request (authenticated)
  cancelRequest: async (id: string) => {
    const { data } = await apiClient.patch<MarketplaceRequest>(`/marketplace/requests/${id}/cancel`);
    return data;
  },

  // Get request stats
  getRequestStats: async (id: string) => {
    const { data } = await apiClient.get<{ offerCount: number; avgOfferPrice?: number }>(`/marketplace/requests/${id}/stats`);
    return data;
  },

  // List offers for a request
  listRequestOffers: async (requestId: string) => {
    const { data } = await apiClient.get<{ offers: MarketplaceOffer[]; total: number }>(`/marketplace/requests/${requestId}/offers`);
    return data;
  },

  // Accept an offer (authenticated)
  acceptOffer: async (requestId: string, offerId: string) => {
    const { data } = await apiClient.patch<MarketplaceRequest>(`/marketplace/requests/${requestId}/offers/${offerId}/accept`);
    return data;
  },
};

// Marketplace Providers API
export const marketplaceProvidersApi = {
  // List all providers (public)
  listProviders: async (params?: ListProvidersParams) => {
    const { data } = await apiClient.get<{ providers: MarketplaceProvider[]; total: number }>('/marketplace/providers', { params });
    return data;
  },

  // Get single provider
  getProvider: async (id: string) => {
    const { data } = await apiClient.get<MarketplaceProvider>(`/marketplace/providers/${id}`);
    return data;
  },

  // Get provider by slug
  getProviderBySlug: async (slug: string) => {
    const { data } = await apiClient.get<MarketplaceProvider>(`/marketplace/providers/slug/${slug}`);
    return data;
  },

  // Get my provider profile (authenticated)
  getMyProvider: async () => {
    const { data } = await apiClient.get<MarketplaceProvider | null>('/marketplace/providers/me');
    return data;
  },

  // Get provider stats
  getProviderStats: async (id: string) => {
    const { data } = await apiClient.get<{ 
      totalOffers: number; 
      acceptedOffers: number; 
      completedJobs: number;
      rating?: number;
      totalReviews?: number;
    }>(`/marketplace/providers/${id}/stats`);
    return data;
  },
};

// Marketplace Offers API
export const marketplaceOffersApi = {
  // Submit offer to a request (authenticated)
  submitOffer: async (requestId: string, dto: CreateOfferDto) => {
    const { data } = await apiClient.post<MarketplaceOffer>(`/marketplace/requests/${requestId}/offers`, dto);
    return data;
  },

  // Get single offer
  getOffer: async (id: string) => {
    const { data } = await apiClient.get<MarketplaceOffer>(`/marketplace/offers/${id}`);
    return data;
  },

  // List my offers (authenticated)
  listMyOffers: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const { data } = await apiClient.get<{ offers: MarketplaceOffer[]; total: number }>('/marketplace/providers/me/offers', { params });
    return data;
  },

  // Withdraw offer (authenticated)
  withdrawOffer: async (id: string) => {
    const { data } = await apiClient.patch<MarketplaceOffer>(`/marketplace/offers/${id}/withdraw`);
    return data;
  },
};

// Marketplace Matches API
export const marketplaceMatchesApi = {
  // Get my matches (authenticated provider)
  getMyMatches: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const { data } = await apiClient.get<{ matches: MarketplaceMatch[]; total: number }>('/marketplace/providers/me/matches', { params });
    return data;
  },

  // Mark match as viewed
  markMatchViewed: async (matchId: string) => {
    const { data } = await apiClient.patch<MarketplaceMatch>(`/marketplace/matches/${matchId}/view`);
    return data;
  },

  // Skip a match
  skipMatch: async (matchId: string) => {
    const { data } = await apiClient.patch<MarketplaceMatch>(`/marketplace/matches/${matchId}/skip`);
    return data;
  },
};
