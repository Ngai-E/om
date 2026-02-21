import apiClient from './client';
import type { Product, Category, PaginatedResponse } from '@/types';

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  page?: number;
  limit?: number;
  includeInactive?: boolean; // For admin use
}

export const productsApi = {
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: filters,
    });
    return data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/products/slug/${slug}`);
    return data;
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>('/products/featured');
    return data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/products/categories');
    return data;
  },

  // Admin functions
  createProduct: async (productData: any): Promise<Product> => {
    const { data } = await apiClient.post<Product>('/admin/products', productData);
    return data;
  },

  updateProduct: async (id: string, productData: any): Promise<Product> => {
    const { data } = await apiClient.put<Product>(`/admin/products/${id}`, productData);
    return data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  updateInventory: async (id: string, data: { quantity: number; action: string }): Promise<any> => {
    const { data: response } = await apiClient.patch(`/admin/products/${id}/inventory`, data);
    return response;
  },
};
