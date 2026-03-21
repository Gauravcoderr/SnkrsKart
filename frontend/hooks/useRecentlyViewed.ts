'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';

const KEY = 'snkrs-recently-viewed';
const MAX = 6;

export interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  images: string[];
  colorway: string;
}

export function useRecentlyViewed(currentProduct?: Product) {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) || '[]');

    if (currentProduct) {
      const filtered = stored.filter((p) => p.slug !== currentProduct.slug);
      const updated: RecentProduct[] = [
        {
          id: currentProduct.id,
          slug: currentProduct.slug,
          name: currentProduct.name,
          brand: currentProduct.brand,
          price: currentProduct.price,
          originalPrice: currentProduct.originalPrice,
          images: currentProduct.images,
          colorway: currentProduct.colorway,
        },
        ...filtered,
      ].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
      // Show all except the current product
      setItems(updated.filter((p) => p.slug !== currentProduct.slug));
    } else {
      setItems(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct?.slug]);

  return items;
}
