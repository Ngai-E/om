import apiClient from './client';
import type { Order, PaginatedResponse } from '@/types';

export interface CreateOrderData {
  fulfillmentType: 'DELIVERY' | 'COLLECTION';
  addressId?: string;
  deliverySlotId?: string;
  notes?: string;
}

export const ordersApi = {
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    const { data } = await apiClient.post<Order>('/orders', orderData);
    return data;
  },

  getOrders: async (page = 1, limit = 10): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: { page, limit },
    });
    return data;
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/orders/${orderId}`);
    return data;
  },

  cancelOrder: async (orderId: string): Promise<Order> => {
    const { data } = await apiClient.post<Order>(`/orders/${orderId}/cancel`);
    return data;
  },
};
