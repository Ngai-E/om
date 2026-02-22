import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export interface CartValidation {
  isValid: boolean;
  canProceed: boolean;
  subtotal: number;
  minOrderValue?: number;
  amountNeeded?: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  isFreeDelivery?: boolean;
  total?: number;
  zoneName?: string;
  message: string;
}

export function useCartValidation(addressId?: string) {
  return useQuery<CartValidation>({
    queryKey: ['cart-validation', addressId],
    queryFn: async () => {
      const params = addressId ? `?addressId=${addressId}` : '';
      const { data } = await api.get(`/delivery/validate-cart${params}`);
      return data;
    },
    enabled: true, // Always enabled to show validation
    refetchOnWindowFocus: false,
  });
}
