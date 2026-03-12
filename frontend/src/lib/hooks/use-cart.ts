import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';

export function useCart() {
  const setItemCount = useCartStore((state) => state.setItemCount);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const query = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cart = await cartApi.getCart();
      setItemCount(cart.itemCount);
      return cart;
    },
    enabled: isAuthenticated, // Only fetch cart when authenticated
  });

  return query;
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((state) => state.setItemCount);
  
  return useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: (data) => {
      // Update the cart count immediately
      setItemCount(data.itemCount);
      // Invalidate to refetch full cart data
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((state) => state.setItemCount);
  
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, { quantity }),
    onSuccess: (data) => {
      setItemCount(data.itemCount);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((state) => state.setItemCount);
  
  return useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: (data) => {
      setItemCount(data.itemCount);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
