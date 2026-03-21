'use client';

import { useState, useEffect, RefObject } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface StickyCartBarProps {
  product: Product;
  selectedSize: number | null;
  onSizeSelect: (size: number) => void;
  onRequireSize: () => void;
  /** Ref to the main Add to Bag button — bar appears when it scrolls out of view */
  triggerRef: RefObject<HTMLElement>;
}

export default function StickyCartBar({
  product,
  selectedSize,
  onSizeSelect,
  onRequireSize,
  triggerRef,
}: StickyCartBarProps) {
  const { addItem, openDrawer } = useCart();
  const [visible, setVisible] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerRef]);

  if (!visible || product.soldOut || product.comingSoon) return null;

  const quickSizes = product.availableSizes.slice(0, 6);

  const handleAdd = async () => {
    if (!selectedSize) {
      onRequireSize();
      return;
    }
    setAdding(true);
    const variant = product.variants?.find((v) => v.size === selectedSize);
    const effectiveProduct = variant ? { ...product, price: variant.price, originalPrice: variant.originalPrice } : product;
    await new Promise((r) => setTimeout(r, 400));
    addItem(effectiveProduct, selectedSize, 1);
    setAdding(false);
    openDrawer();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 bg-zinc-100 shrink-0 overflow-hidden hidden sm:block">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>

        {/* Name + price */}
        <div className="shrink-0 min-w-0 hidden md:block">
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 leading-none">{product.brand}</p>
          <p className="text-sm font-semibold text-zinc-900 truncate max-w-[180px]">{product.name}</p>
          <p className="text-sm font-bold text-zinc-900">{formatPrice(product.price)}</p>
        </div>

        {/* Size pills */}
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 shrink-0 hidden sm:block">Size (UK)</span>
          {quickSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onSizeSelect(size)}
              className={`shrink-0 h-9 w-10 text-xs font-semibold border transition-all duration-150 ${
                selectedSize === size
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-900'
              }`}
            >
              {size}
            </button>
          ))}
          {product.availableSizes.length > 6 && (
            <span className="text-xs text-zinc-400 shrink-0 pl-1">+{product.availableSizes.length - 6} more</span>
          )}
        </div>

        {/* Add to Bag */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="shrink-0 px-6 py-3 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-900 transition-colors"
        >
          {adding ? (
            <svg className="w-4 h-4 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>Add to Bag{selectedSize ? ` — UK ${selectedSize}` : ''}</>
          )}
        </button>
      </div>
    </div>
  );
}
