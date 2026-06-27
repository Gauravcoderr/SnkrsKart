'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface BuyNowButtonProps {
  product: Product;
  selectedSize: number | string | null;
  onRequireSize: () => void;
}

export default function BuyNowButton({ product, selectedSize, onRequireSize }: BuyNowButtonProps) {
  const { setBuyNowItem } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (product.soldOut) return null;

  const handleClick = () => {
    if (!selectedSize) {
      onRequireSize();
      return;
    }
    setLoading(true);
    setBuyNowItem({ product, size: selectedSize, quantity: 1 });
    router.push('/checkout');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full py-4 border-2 border-zinc-900 bg-white text-zinc-900 text-sm font-bold tracking-widest uppercase hover:bg-zinc-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Buy Now
    </button>
  );
}
