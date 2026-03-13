import apiClient from './client';
import type { DeliveryZone, DeliverySlot } from '@/types';

export interface PostcodeCheckResponse {
  available: boolean;
  zone?: {
    id: string;
    name: string;
    deliveryFee: string;
    minOrderValue: string;
    freeDeliveryThreshold?: string;
  };
  message: string;
}

export const deliveryApi = {
  checkPostcode: async (postcode: string): Promise<PostcodeCheckResponse> => {
    const { data } = await apiClient.post<PostcodeCheckResponse>('/delivery/check-postcode', {
      postcode,
    });
    return data;
  },

  getZones: async (): Promise<{ zones: DeliveryZone[] }> => {
    const { data } = await apiClient.get('/delivery/zones');
    return data;
  },

  getSlots: async (zoneId?: string, date?: string): Promise<{ slots: DeliverySlot[] }> => {
    const { data } = await apiClient.get('/delivery/slots', {
      params: { zoneId, date },
    });
    return data;
  },

  getSlot: async (slotId: string): Promise<DeliverySlot> => {
    const { data } = await apiClient.get<DeliverySlot>(`/delivery/slots/${slotId}`);
    return data;
  },

  // Get slots from templates for a specific date
  getAvailableSlots: async (date: string): Promise<DeliverySlot[]> => {
    const { data } = await apiClient.get(`/delivery-slots/available`, {
      params: { date },
    });
    return data;
  },
};
