'use client';

import { useEffect, useRef } from 'react';
import { Spinner } from '@/components/seller/SellerShell';

export default function LoadMoreSentinel({ hasMore, loading, onLoadMore, label = 'Load more' }: { hasMore: boolean; loading: boolean; onLoadMore: () => void; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onLoadMore();
    }, { rootMargin: '240px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore && !loading) return null;
  return (
    <div ref={ref} className="flex justify-center py-6">
      {loading ? (
        <Spinner className="w-5 h-5" />
      ) : (
        <button type="button" onClick={onLoadMore} className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 underline underline-offset-4">
          {label}
        </button>
      )}
    </div>
  );
}
