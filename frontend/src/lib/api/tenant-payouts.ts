import { apiClient } from './client';

export const tenantPayoutsApi = {
  // Get tenant balance
  getBalance: async () => {
    const { data } = await apiClient.get('/tenant/payouts/balance');
    return data;
  },

  // Get tenant payout requests
  getPayoutRequests: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get(`/tenant/payouts/requests?page=${page}&limit=${limit}`);
    return data;
  },

  // Request a payout
  requestPayout: async (payoutData: {
    amount: number;
    paymentMethod: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankSortCode?: string;
    notes?: string;
  }) => {
    const { data } = await apiClient.post('/tenant/payouts/request', payoutData);
    return data;
  },
};
