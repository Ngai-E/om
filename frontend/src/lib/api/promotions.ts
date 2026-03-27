import { apiClient } from './client';

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  code?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  startAt?: string;
  endAt?: string;
  budgetType: 'NONE' | 'TOTAL_DISCOUNT' | 'TOTAL_USES' | 'BOTH';
  maxTotalDiscountAmount?: number;
  maxTotalRedemptions?: number;
  maxRedemptionsPerUser?: number;
  minSubtotal?: number;
  firstOrderOnly: boolean;
  allowedFulfillment?: 'DELIVERY' | 'COLLECTION';
  allowGuests: boolean;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountPerOrder?: number;
  applyToSubtotal: boolean;
  applyToDeliveryFee: boolean;
  allowStacking: boolean;
  priority: number;
  // Social Proof
  isFeatured?: boolean;
  usageCount?: number; // Can be manually updated or auto-calculated
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalRedemptions: number;
    totalDiscountGiven: number;
    remainingBudgetAmount?: number;
    remainingBudgetUses?: number;
    percentUsed: number;
  };
}

export interface CreatePromotionDto {
  name: string;
  description?: string;
  imageUrl?: string;
  code?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  startAt?: string;
  endAt?: string;
  budgetType: 'NONE' | 'TOTAL_DISCOUNT' | 'TOTAL_USES' | 'BOTH';
  maxTotalDiscountAmount?: number;
  maxTotalRedemptions?: number;
  maxRedemptionsPerUser?: number;
  minSubtotal?: number;
  firstOrderOnly: boolean;
  allowedFulfillment?: 'DELIVERY' | 'COLLECTION';
  allowGuests: boolean;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountPerOrder?: number;
  applyToSubtotal: boolean;
  applyToDeliveryFee: boolean;
  allowStacking: boolean;
  priority: number;
  // Social Proof
  isFeatured?: boolean;
  usageCount?: number;
}

export const promotionsApi = {
  // Public endpoints
  getActivePromotions: async () => {
    const { data } = await apiClient.get<Promotion[]>('/promotions/active');
    return data;
  },

  getPromotionById: async (id: string) => {
    const { data } = await apiClient.get<Promotion>(`/promotions/${id}/public`);
    return data;
  },

  getPromotionByCode: async (code: string) => {
    const { data } = await apiClient.get<Promotion>(`/promotions/code/${code}`);
    return data;
  },

  getEligiblePromotions: async () => {
    const { data } = await apiClient.get<Promotion[]>('/promotions/eligible');
    return data;
  },

  // Admin endpoints
  getAllPromotions: async (params?: { status?: string; search?: string }) => {
    const { data } = await apiClient.get<{ data: Promotion[]; total: number }>('/promotions', { params });
    return data;
  },

  getPromotion: async (id: string) => {
    const { data } = await apiClient.get<Promotion>(`/promotions/${id}`);
    return data;
  },

  createPromotion: async (dto: CreatePromotionDto) => {
    const { data } = await apiClient.post<Promotion>('/promotions', dto);
    return data;
  },

  updatePromotion: async (id: string, dto: Partial<CreatePromotionDto>) => {
    const { data } = await apiClient.put<Promotion>(`/promotions/${id}`, dto);
    return data;
  },

  deletePromotion: async (id: string) => {
    const { data } = await apiClient.delete(`/promotions/${id}`);
    return data;
  },

  activatePromotion: async (id: string) => {
    const { data } = await apiClient.patch<Promotion>(`/promotions/${id}/activate`);
    return data;
  },

  pausePromotion: async (id: string) => {
    const { data } = await apiClient.patch<Promotion>(`/promotions/${id}/pause`);
    return data;
  },

  endPromotion: async (id: string) => {
    const { data } = await apiClient.patch<Promotion>(`/promotions/${id}/end`);
    return data;
  },

  getPromotionStats: async (id: string) => {
    const { data } = await apiClient.get(`/promotions/${id}/stats`);
    return data;
  },

  getPromotionRedemptions: async (id: string) => {
    const { data } = await apiClient.get<{ data: any[] }>(`/promotions/${id}/redemptions`);
    return data;
  },

  // Import/Export
  importPromotions: async (promotions: CreatePromotionDto[], skipExisting = true) => {
    const { data } = await apiClient.post<{ message: string; success: number; skipped: number; failed: number; errors: string[] }>('/promotions/import', { promotions, skipExisting });
    return data;
  },

  exportPromotions: async () => {
    const { data } = await apiClient.get<{ data: any[]; count: number; exportedAt: string }>('/promotions/export/all');
    return data;
  },
};
