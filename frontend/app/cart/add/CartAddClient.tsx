'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, type CartItemMeta } from '@/context/CartContext';
import type { Product } from '@/types';

export interface CartAddLine {
  product: Product;
  size: number | string;
  quantity: number;
  meta?: CartItemMeta;
}

export interface CartAddProblem {
  problem: string;
  href: string;
}

export default function CartAddClient({ lines, problems }: { lines: CartAddLine[]; problems: CartAddProblem[] }) {
  const { addItem, hydrated } = useCart();
  const router = useRouter();
  const done = useRef(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    lines.forEach((l) => addItem(l.product, l.size, l.quantity, l.meta));
    setAdded(true);
    if (problems.length === 0) router.replace('/cart');
  }, [hydrated, lines, problems, addItem, router]);

  if (problems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center min-h-[50vh]" role="status" aria-live="polite">
        <p className="text-sm font-semibold tracking-widest uppercase text-zinc-500">Adding to your bag…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16 min-h-[50vh]">
      <h1 className="text-2xl font-bold tracking-[0.1em] uppercase text-zinc-900 mb-6">Your bag link</h1>
      {added && lines.length > 0 && (
        <p className="text-sm text-emerald-700 mb-4" role="status">
          Added {lines.reduce((n, l) => n + l.quantity, 0)} item{lines.length === 1 && lines[0].quantity === 1 ? '' : 's'} to your bag.
        </p>
      )}
      <ul className="space-y-3 mb-8">
        {problems.map((p) => (
          <li key={p.problem} className="text-sm text-zinc-700">
            {p.problem}{' '}
            <Link href={p.href} className="underline hover:text-zinc-900">See options</Link>
          </li>
        ))}
      </ul>
      <Link
        href="/cart"
        className="inline-block bg-zinc-900 text-white text-xs font-semibold tracking-widest uppercase px-6 py-3 hover:bg-zinc-700 transition-colors"
      >
        Go to bag
      </Link>
    </div>
  );
}
