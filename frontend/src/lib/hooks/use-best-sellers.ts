import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';

export function useBestSellers(limit = 8) {
  return useQuery({
    queryKey: ['best-sellers', limit],
    queryFn: () => productsApi.getBestSellers(limit),
  });
}
