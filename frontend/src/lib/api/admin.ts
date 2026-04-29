import apiClient from './client';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: string;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: any[];
  topProducts: any[];
  // New dashboard metrics
  newOrdersToday?: number;
  pendingPayment?: number;
  lowStockItems?: number;
  todayRevenue?: string;
  ordersByStatus?: Array<{
    status: string;
    count: number;
  }>;
  deliverySlots?: Array<{
    time: string;
    used: number;
    capacity: number;
  }>;
}

export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
    return data;
  },

  getInventoryStats: async () => {
    const { data } = await apiClient.get('/admin/inventory/stats');
    return data;
  },

  getAllOrders: async (page = 1, limit = 20, filters?: { status?: string; isPhoneOrder?: boolean }) => {
    const { data } = await apiClient.get('/admin/orders', {
      params: {
        page,
        limit,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.isPhoneOrder !== undefined && { isPhoneOrder: filters.isPhoneOrder }),
      },
    });
    return data;
  },

  getOrderDetails: async (orderId: string) => {
    const { data } = await apiClient.get(`/admin/orders/${orderId}`);
    return data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const { data } = await apiClient.patch(`/admin/orders/${orderId}/status`, { status });
    return data;
  },

  verifyPaymentStatus: async (orderId: string) => {
    const { data } = await apiClient.get(`/payments/verify/${orderId}`);
    return data;
  },

  getAllUsers: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get('/admin/users', {
      params: { page, limit },
    });
    return data;
  },

  // Delivery Zones
  getDeliveryZones: async () => {
    const { data } = await apiClient.get('/admin/delivery-zones');
    return data;
  },

  createDeliveryZone: async (zoneData: any) => {
    const { data } = await apiClient.post('/admin/delivery-zones', zoneData);
    return data;
  },

  updateDeliveryZone: async (id: string, zoneData: any) => {
    const { data } = await apiClient.patch(`/admin/delivery-zones/${id}`, zoneData);
    return data;
  },

  deleteDeliveryZone: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/delivery-zones/${id}`);
    return data;
  },

  // Delivery Slots
  getDeliverySlots: async (date?: string) => {
    const { data } = await apiClient.get('/admin/delivery-slots', {
      params: date ? { date } : {},
    });
    return data;
  },

  createDeliverySlot: async (slotData: any) => {
    const { data } = await apiClient.post('/admin/delivery-slots', slotData);
    return data;
  },

  updateDeliverySlot: async (id: string, slotData: any) => {
    const { data } = await apiClient.patch(`/admin/delivery-slots/${id}`, slotData);
    return data;
  },

  deleteDeliverySlot: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/delivery-slots/${id}`);
    return data;
  },

  // Staff Management
  getAllStaff: async (page = 1, limit = 50) => {
    const { data } = await apiClient.get('/admin/staff', {
      params: { page, limit },
    });
    return data.staff || data;
  },

  updateStaffPermissions: async (staffId: string, permissions: string[]) => {
    const { data } = await apiClient.patch(`/admin/staff/${staffId}/permissions`, { permissions });
    return data;
  },
};
