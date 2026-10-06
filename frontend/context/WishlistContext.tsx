'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface WishlistContextValue {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  rename: (from: string, to: string) => void;
  isWishlisted: (id: string) => boolean;
  count: number;
  hydrated: boolean;
}

const STORAGE_KEY = 'snkrs-wishlist';

const unique = (list: unknown[]): string[] =>
  Array.from(new Set(list.filter((x): x is string => typeof x === 'string' && x.length > 0)));

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setIds(unique(parsed));
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // storage unavailable
    }
  }, [ids, hydrated]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : unique([...prev, id])));
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev));
  }, []);

  const rename = useCallback((from: string, to: string) => {
    setIds((prev) => (prev.includes(from) ? unique(prev.map((x) => (x === from ? to : x))) : prev));
  }, []);

  const isWishlisted = useCallback((id: string) => ids.includes(id), [ids]);

  return (
    <WishlistContext.Provider value={{ ids, toggle, remove, rename, isWishlisted, count: ids.length, hydrated }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
