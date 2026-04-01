import { apiClient } from './client';

// ============================================
// PLATFORM TENANT MANAGEMENT
// ============================================

export const platformApi = {
  // Tenants
  getTenants: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get('/platform/tenants', { params: { page, limit } });
    return data;
  },

  getTenant: async (id: string) => {
    const { data } = await apiClient.get(`/platform/tenants/${id}`);
    return data;
  },

  createTenant: async (dto: {
    name: string;
    slug: string;
    email: string;
    phone?: string;
    description?: string;
  }) => {
    const { data } = await apiClient.post('/platform/tenants', dto);
    return data;
  },

  updateTenant: async (id: string, dto: {
    name?: string;
    slug?: string;
    email?: string;
    phone?: string;
    description?: string;
    status?: string;
    billingStatus?: string;
  }) => {
    const { data } = await apiClient.put(`/platform/tenants/${id}`, dto);
    return data;
  },

  deleteTenant: async (id: string) => {
    const { data } = await apiClient.delete(`/platform/tenants/${id}`);
    return data;
  },

  getPlatformStats: async () => {
    const { data } = await apiClient.get('/platform/tenants/stats');
    return data;
  },

  // Branding
  getTenantBranding: async (tenantId: string) => {
    const { data } = await apiClient.get(`/platform/tenants/${tenantId}/branding`);
    return data;
  },

  updateTenantBranding: async (tenantId: string, dto: Record<string, any>) => {
    const { data } = await apiClient.put(`/platform/tenants/${tenantId}/branding`, dto);
    return data;
  },

  // Domains
  getTenantDomains: async (tenantId: string) => {
    const { data } = await apiClient.get(`/platform/tenants/${tenantId}/domains`);
    return data;
  },

  addTenantDomain: async (tenantId: string, domain: string, type?: 'SUBDOMAIN' | 'CUSTOM') => {
    const { data } = await apiClient.post(`/platform/tenants/${tenantId}/domains`, { domain, type });
    return data;
  },

  removeTenantDomain: async (tenantId: string, domainId: string) => {
    const { data } = await apiClient.delete(`/platform/tenants/${tenantId}/domains/${domainId}`);
    return data;
  },

  // Platform Settings
  getPlatformSettings: async () => {
    const { data } = await apiClient.get('/platform/settings');
    return data;
  },

  updatePlatformSettings: async (settings: Record<string, any>) => {
    const { data } = await apiClient.put('/platform/settings', settings);
    return data;
  },
};
