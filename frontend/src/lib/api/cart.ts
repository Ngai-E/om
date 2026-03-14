import apiClient from './client';
import type { Cart } from '@/types';

export interface AddToCartData {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const { data } = await apiClient.get<Cart>('/cart');
    return data;
  },

  addItem: async (item: AddToCartData): Promise<Cart> => {
    const { data } = await apiClient.post<Cart>('/cart/items', item);
    return data;
  },

  updateItem: async (itemId: string, update: UpdateCartItemData): Promise<Cart> => {
    const { data } = await apiClient.patch<Cart>(`/cart/items/${itemId}`, update);
    return data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const { data } = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return data;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete('/cart');
  },
};
