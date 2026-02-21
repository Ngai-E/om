import apiClient from './client';
import type { Address } from '@/types';

export interface CreateAddressData {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
  postcode: string;
  country?: string;
  isDefault?: boolean;
}

export const accountApi = {
  getAddresses: async (): Promise<Address[]> => {
    const { data } = await apiClient.get<Address[]>('/account/addresses');
    return data;
  },

  createAddress: async (addressData: CreateAddressData): Promise<Address> => {
    const { data } = await apiClient.post<Address>('/account/addresses', addressData);
    return data;
  },

  updateAddress: async (addressId: string, addressData: Partial<CreateAddressData>): Promise<Address> => {
    const { data } = await apiClient.put<Address>(`/account/addresses/${addressId}`, addressData);
    return data;
  },

  deleteAddress: async (addressId: string): Promise<void> => {
    await apiClient.delete(`/account/addresses/${addressId}`);
  },

  setDefaultAddress: async (addressId: string): Promise<Address> => {
    const { data } = await apiClient.patch<Address>(`/account/addresses/${addressId}/default`);
    return data;
  },
};
