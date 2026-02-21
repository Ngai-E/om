import apiClient from './client';

export interface PhoneOrderData {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  fulfillmentType: 'DELIVERY' | 'COLLECTION';
  addressId?: string;
  deliverySlotId?: string;
  paymentMethod: 'CASH_ON_DELIVERY' | 'PAY_IN_STORE' | 'CARD';
}

export const staffApi = {
  searchCustomers: async (query: string) => {
    const { data } = await apiClient.get('/staff/customers/search', {
      params: { q: query },
    });
    return data;
  },

  getCustomerAddresses: async (customerId: string) => {
    const { data } = await apiClient.get(`/staff/customers/${customerId}/addresses`);
    return data;
  },

  getDashboardTasks: async () => {
    const { data } = await apiClient.get('/staff/dashboard/tasks');
    return data;
  },

  getOrders: async (status?: string) => {
    const { data } = await apiClient.get('/staff/orders', {
      params: status ? { status } : {},
    });
    return data;
  },

  getOrderDetails: async (orderId: string) => {
    const { data } = await apiClient.get(`/staff/orders/${orderId}`);
    return data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const { data } = await apiClient.patch(`/staff/orders/${orderId}/status`, { status });
    return data;
  },

  createPhoneOrder: async (orderData: PhoneOrderData) => {
    const { data } = await apiClient.post('/staff/orders/phone', orderData);
    return data;
  },

  generatePaymentLink: async (orderId: string) => {
    const { data } = await apiClient.post(`/staff/orders/${orderId}/payment-link`);
    return data;
  },
};
