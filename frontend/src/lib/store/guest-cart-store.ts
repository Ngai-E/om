import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: string;
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (productId: string, quantity: number, variantId?: string) => void;
  updateItem: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (productId: string, quantity: number, variantId?: string) => {
        set((state) => {
          const existingItem = state.items.find((item) => 
            item.productId === productId && item.variantId === variantId
          );
          
          if (existingItem) {
            // Update existing item
            return {
              items: state.items.map((item) =>
                item.productId === productId && item.variantId === variantId
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
                  variantId,
                  quantity,
                  addedAt: new Date().toISOString(),
                },
              ],
            };
          }
        });
      },
      
      updateItem: (productId: string, quantity: number, variantId?: string) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId 
              ? { ...item, quantity } 
              : item
          ),
        }));
      },
      
      removeItem: (productId: string, variantId?: string) => {
        set((state) => ({
          items: state.items.filter((item) => 
            !(item.productId === productId && item.variantId === variantId)
          ),
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
