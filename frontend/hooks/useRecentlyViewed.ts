'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';

const KEY = 'snkrs-recently-viewed';
const MAX = 6;

export function useRecentlyViewed(currentProduct?: Product) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored: Product[] = JSON.parse(localStorage.getItem(KEY) || '[]');

    if (currentProduct) {
      const filtered = stored.filter((p) => p.slug !== currentProduct.slug);
      const updated = [currentProduct, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
      setItems(updated.filter((p) => p.slug !== currentProduct.slug));
    } else {
      setItems(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct?.slug]);

  return items;
}
