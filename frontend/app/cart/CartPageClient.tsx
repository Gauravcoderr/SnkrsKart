'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';

export default function CartPageClient() {
  const { items, subtotal, clearCart } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">Review</p>
          <h1 className="text-3xl font-bold tracking-[0.1em] uppercase text-zinc-900">
            Your Bag{' '}
            {items.length > 0 && (
              <span className="text-zinc-400 font-normal text-lg">({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold tracking-widest uppercase text-zinc-400 hover:text-red-500 transition-colors"
            >
              Clear Bag
            </button>
          )}
          <Link
            href="/products"
            className="text-xs font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-500 transition-colors flex items-center gap-1"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* Items */}
          <div>
            <div className="hidden sm:grid grid-cols-[1fr_auto] gap-4 pb-3 border-b border-zinc-200 mb-2">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Product</p>
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Total</p>
            </div>
            {items.map((item) => (
              <CartItem key={`${item.product.id}-${item.size}`} item={item} />
            ))}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 self-start">
            <CartSummary items={items} subtotal={subtotal} />
          </div>
        </div>
      )}
    </div>
  );
}
