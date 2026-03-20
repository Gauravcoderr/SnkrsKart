'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

type ButtonState = 'idle' | 'adding' | 'added';

interface AddToCartButtonProps {
  product: Product;
  selectedSize: number | null;
  onRequireSize: () => void;
}

export default function AddToCartButton({
  product,
  selectedSize,
  onRequireSize,
}: AddToCartButtonProps) {
  const { addItem, openDrawer, items } = useCart();
  const [btnState, setBtnState] = useState<ButtonState>('idle');
  const [shake, setShake] = useState(false);

  const maxQty = selectedSize
    ? (product.variants?.find((v) => v.size === selectedSize)?.maxQty ?? 5)
    : 5;

  const currentQtyInCart = selectedSize
    ? (items.find((i) => i.product.id === product.id && i.size === selectedSize)?.quantity ?? 0)
    : 0;

  const isAtMax = selectedSize !== null && currentQtyInCart >= maxQty;

  const handleClick = async () => {
    if (product.soldOut) return;

    if (!selectedSize) {
      onRequireSize();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (isAtMax) return;

    setBtnState('adding');
    await new Promise((r) => setTimeout(r, 600));

    addItem(product, selectedSize, 1);
    setBtnState('added');

    await new Promise((r) => setTimeout(r, 800));
    openDrawer();

    await new Promise((r) => setTimeout(r, 700));
    setBtnState('idle');
  };

  if (product.soldOut) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-4 bg-zinc-200 text-zinc-400 text-sm font-bold tracking-widest uppercase cursor-not-allowed"
      >
        Sold Out
      </button>
    );
  }

  if (isAtMax) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-4 bg-zinc-100 text-zinc-400 text-sm font-bold tracking-widest uppercase cursor-not-allowed border border-zinc-200"
      >
        Max Qty Reached ({maxQty})
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={btnState !== 'idle'}
      className={`
        w-full py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300
        ${shake ? 'animate-shake' : ''}
        ${btnState === 'added'
          ? 'bg-emerald-600 text-white'
          : 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-900'
        }
      `}
    >
      {btnState === 'idle' && 'Add to Bag'}
      {btnState === 'adding' && (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Adding...
        </span>
      )}
      {btnState === 'added' && (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Added to Bag!
        </span>
      )}
    </button>
  );
}
