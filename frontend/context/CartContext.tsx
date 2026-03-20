'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; size: number; quantity?: number }
  | { type: 'REMOVE_ITEM'; productId: string; size: number }
  | { type: 'UPDATE_QUANTITY'; productId: string; size: number; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'TOGGLE_DRAWER' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.items };

    case 'ADD_ITEM': {
      const qty = action.quantity ?? 1;
      const maxQty = action.product.variants?.find((v) => v.size === action.size)?.maxQty ?? 5;
      const existing = state.items.find(
        (item) => item.product.id === action.product.id && item.size === action.size
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.product.id && item.size === action.size
              ? { ...item, quantity: Math.min(maxQty, item.quantity + qty) }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, size: action.size, quantity: Math.min(maxQty, qty) }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) => !(item.product.id === action.productId && item.size === action.size)
        ),
      };

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => !(item.product.id === action.productId && item.size === action.size)
          ),
        };
      }
      const targetItem = state.items.find(
        (item) => item.product.id === action.productId && item.size === action.size
      );
      const maxQty = targetItem?.product.variants?.find((v) => v.size === action.size)?.maxQty ?? 5;
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.productId && item.size === action.size
            ? { ...item, quantity: Math.min(maxQty, action.quantity) }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'OPEN_DRAWER':
      return { ...state, isDrawerOpen: true };

    case 'CLOSE_DRAWER':
      return { ...state, isDrawerOpen: false };

    case 'TOGGLE_DRAWER':
      return { ...state, isDrawerOpen: !state.isDrawerOpen };

    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  isDrawerOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, size: number, quantity?: number) => void;
  removeItem: (productId: string, size: number) => void;
  updateQuantity: (productId: string, size: number, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isDrawerOpen: false });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('snkrs-cart');
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        dispatch({ type: 'HYDRATE', items: parsed });
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist items to localStorage
  useEffect(() => {
    localStorage.setItem('snkrs-cart', JSON.stringify(state.items));
  }, [state.items]);

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isDrawerOpen) dispatch({ type: 'CLOSE_DRAWER' });
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state.isDrawerOpen]);

  const itemCount = useMemo(
    () => state.items.reduce((acc, item) => acc + item.quantity, 0),
    [state.items]
  );

  const subtotal = useMemo(
    () => state.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [state.items]
  );

  const value: CartContextValue = {
    items: state.items,
    isDrawerOpen: state.isDrawerOpen,
    itemCount,
    subtotal,
    addItem: (product, size, quantity) => dispatch({ type: 'ADD_ITEM', product, size, quantity }),
    removeItem: (productId, size) => dispatch({ type: 'REMOVE_ITEM', productId, size }),
    updateQuantity: (productId, size, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', productId, size, quantity }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    openDrawer: () => dispatch({ type: 'OPEN_DRAWER' }),
    closeDrawer: () => dispatch({ type: 'CLOSE_DRAWER' }),
    toggleDrawer: () => dispatch({ type: 'TOGGLE_DRAWER' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
