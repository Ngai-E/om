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

  // Platform Configuration
  getPlatformConfig: async () => {
    const { data } = await apiClient.get('/platform/config');
    return data;
  },

  updatePlatformConfig: async (config: { key: string; value: string; description?: string }) => {
    const { data } = await apiClient.put('/platform/config', config);
    return data;
  },

  getPlatformConfigValue: async (key: string) => {
    const { data } = await apiClient.get(`/platform/config/${key}`);
    return data;
  },

  // Platform Fees
  getPlatformFees: async () => {
    const { data } = await apiClient.get('/platform/fees');
    return data;
  },

  updatePlatformFees: async (fees: {
    platformFeePercent?: number;
    taxPercent?: number;
    minimumPayout?: number;
    payoutSchedule?: string;
  }) => {
    const { data } = await apiClient.put('/platform/fees', fees);
    return data;
  },

  // Tenant Balances
  getTenantBalances: async () => {
    const { data } = await apiClient.get('/platform/balances');
    return data;
  },

  getTenantBalance: async (tenantId: string) => {
    const { data } = await apiClient.get(`/platform/balances/${tenantId}`);
    return data;
  },

  // Payouts
  getPayouts: async (filters?: {
    tenantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const { data } = await apiClient.get(`/platform/payouts?${params}`);
    return data;
  },

  createPayout: async (payout: {
    tenantId: string;
    amount: number;
    paymentMethod: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankSortCode?: string;
    reference?: string;
    notes?: string;
  }) => {
    const { data } = await apiClient.post('/platform/payouts', payout);
    return data;
  },

  updatePayoutStatus: async (payoutId: string, status: string, stripePayoutId?: string) => {
    const { data } = await apiClient.put(`/platform/payouts/${payoutId}/status`, { status, stripePayoutId });
    return data;
  },

  getPayoutStats: async () => {
    const { data } = await apiClient.get('/platform/payouts/stats');
    return data;
  },

  // Image Upload Configuration
  getImageUploadConfig: async () => {
    const { data } = await apiClient.get('/platform/image-upload');
    return data;
  },

  updateImageUploadConfig: async (config: {
    service: 'imgbb' | 'cloudinary';
    imgbbApiKey?: string;
    cloudinaryConfig?: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
  }) => {
    const { data } = await apiClient.put('/platform/image-upload', config);
    return data;
  },

  // Stripe Configuration
  getStripeConfig: async () => {
    const { data } = await apiClient.get('/platform/stripe');
    return data;
  },

  updateStripeConfig: async (config: {
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    connectAccountId?: string;
  }) => {
    const { data } = await apiClient.put('/platform/stripe', config);
    return data;
  },
};
