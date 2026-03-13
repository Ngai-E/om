import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useEffect } from 'react';

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
  const queryClient = useQueryClient();
  
  // Invalidate cart validation when cart changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === 'cart') {
        queryClient.invalidateQueries({ queryKey: ['cart-validation'] });
      }
    });
    
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery<CartValidation>({
    queryKey: ['cart-validation', addressId],
    queryFn: async () => {
      const params = addressId ? `?addressId=${addressId}` : '';
      const { data } = await api.get(`/delivery/validate-cart${params}`);
      return data;
    },
    enabled: true, // Always enabled to show validation
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider stale so it refetches
  });
}
