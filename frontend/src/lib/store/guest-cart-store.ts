import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (productId: string, quantity: number) => void;
  updateItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (productId: string, quantity: number) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.productId === productId);
          
          if (existingItem) {
            // Update existing item
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          } else {
            // Add new item
            return {
              items: [
                ...state.items,
                {
                  productId,
                  quantity,
                  addedAt: new Date().toISOString(),
                },
              ],
            };
          }
        });
      },
      
      updateItem: (productId: string, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));
      },
      
      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'guest-cart-storage',
    }
  )
);
