import { getServerTenantSlug } from './tenant-server';
import type { Product, Category } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

async function serverFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const slug = await getServerTenantSlug();
  
  // Check if we're on platform port (3000) - don't send tenant slug
  const isPlatform = process.env.PORT === '3000' || typeof window !== 'undefined' && window.location.port === '3000';
  
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    'Content-Type': 'application/json',
  };
  
  // Only send tenant slug if NOT on platform
  if (!isPlatform && slug) {
    headers['X-Tenant-Slug'] = slug;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    // Enable Next.js caching by default on server
    next: {
      revalidate: 60, // Default 60 seconds revalidation
      ...((options as any).next || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const serverApi = {
  getFeaturedProducts: async (): Promise<Product[]> => {
    return serverFetch<Product[]>('/products/featured', {
      next: { revalidate: 300 }, // 5 minutes
    });
  },

  getBestSellers: async (limit = 8): Promise<Product[]> => {
    return serverFetch<Product[]>(`/products/best-sellers?limit=${limit}`, {
      next: { revalidate: 300 },
    });
  },

  getQuickCategories: async (): Promise<Category[]> => {
    return serverFetch<Category[]>('/products/categories/quick', {
      next: { revalidate: 3600 }, // 1 hour
    });
  },

  getHomepageReviews: async (): Promise<any[]> => {
    return serverFetch<any[]>('/reviews/homepage', {
      next: { revalidate: 3600 },
    });
  },

  getActiveTestimonials: async (): Promise<any[]> => {
    return serverFetch<any[]>('/testimonials/active', {
      next: { revalidate: 3600 },
    });
  },
  
  getSettings: async (): Promise<any> => {
    return serverFetch<any>('/settings', {
      next: { revalidate: 600 }, // 10 minutes
    });
  },

  getServerTenant: async () => {
    const slug = await getServerTenantSlug();
    try {
      return await serverFetch<any>(`/storefront/store/${slug}`, {
        next: {
          revalidate: 3600, // Cache for 1 hour
          tags: [`tenant-${slug}`],
        },
      });
    } catch (error) {
      console.error('Failed to fetch tenant on server:', error);
      return null;
    }
  }
};
