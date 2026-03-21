'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

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
          <Link key={item.slug} href={`/products/${item.slug}`} className="group block">
            <div className="relative aspect-square bg-zinc-100 overflow-hidden mb-2">
              <Image
                src={item.images[0]}
                alt={`${item.brand} ${item.name}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 leading-none mb-0.5">
              {item.brand}
            </p>
            <p className="text-xs font-semibold text-zinc-900 leading-tight truncate">{item.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.colorway}</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xs font-bold text-zinc-900">{formatPrice(item.price)}</span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-[10px] text-zinc-400 line-through">{formatPrice(item.originalPrice)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
