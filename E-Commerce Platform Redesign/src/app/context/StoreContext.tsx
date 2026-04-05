import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem, ProductVariant } from '../types';
import { products as initialProducts } from '../data/mockData';

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  wishlist: Product[];
  addToCart: (product: Product, quantity: number, variant?: ProductVariant) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  const addToCart = (product: Product, quantity: number, variant?: ProductVariant) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.product.id === product.id && 
        (!variant || item.selectedVariant?.id === variant.id)
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevCart,
        {
          id: `cart-${Date.now()}-${Math.random()}`,
          product,
          quantity,
          selectedVariant: variant,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prevWishlist => {
      const isInWishlist = prevWishlist.some(item => item.id === product.id);
      
      // Update product wishlist status
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, isWishlisted: !isInWishlist } : p
        )
      );

      if (isInWishlist) {
        return prevWishlist.filter(item => item.id !== product.id);
      }
      return [...prevWishlist, { ...product, isWishlisted: true }];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.selectedVariant?.price || item.product.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        toggleWishlist,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
