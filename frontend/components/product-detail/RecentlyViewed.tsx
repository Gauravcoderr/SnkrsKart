'use client';

import { Product } from '@/types';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import ProductCard from '@/components/products/ProductCard';

interface RecentlyViewedProps {
  currentProduct: Product;
}

export default function RecentlyViewed({ currentProduct }: RecentlyViewedProps) {
  const items = useRecentlyViewed(currentProduct);

  if (items.length === 0) return null;

  return (
    <section className="mt-20 pt-10 border-t border-zinc-100">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">Continue Browsing</p>
          <h2 className="text-xl font-bold tracking-[0.15em] uppercase text-zinc-900">Recently Viewed</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <ProductCard key={item.slug} product={item} />
        ))}
      </div>
    </section>
  );
}
