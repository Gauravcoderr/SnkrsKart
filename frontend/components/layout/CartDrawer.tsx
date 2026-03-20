'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, itemCount, subtotal, removeItem, updateQuantity } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white/95 backdrop-blur-md shadow-2xl flex flex-col transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-900">
            Your Bag{' '}
            {itemCount > 0 && (
              <span className="text-zinc-400 font-normal">({itemCount})</span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free shipping bar */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100">
            {subtotal >= 3000 ? (
              <p className="text-xs font-semibold text-emerald-600 tracking-wide">
                🎉 You qualify for free shipping!
              </p>
            ) : (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">
                  Add{' '}
                  <span className="font-bold text-zinc-900">{formatPrice(3000 - subtotal)}</span>{' '}
                  for free shipping
                </p>
                <div className="w-full bg-zinc-200 h-1">
                  <div
                    className="bg-zinc-900 h-1 transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / 3000) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
              </div>
              <div>
                <p className="font-bold tracking-wider uppercase text-zinc-900">Your bag is empty</p>
                <p className="text-sm text-zinc-500 mt-1">Add some heat to get started</p>
              </div>
              <Link
                href="/products"
                onClick={closeDrawer}
                className="mt-2 bg-zinc-900 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={`${item.product.id}-${item.size}`} className="flex gap-4 py-4 border-b border-zinc-100 last:border-0">
                  <Link href={`/products/${item.product.slug}`} onClick={closeDrawer} className="shrink-0">
                    <div className="relative w-20 h-20 bg-zinc-100 overflow-hidden">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover hover:scale-105 transition-transform" sizes="80px" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{item.product.brand}</p>
                        <p className="text-sm font-semibold text-zinc-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">UK {item.size} · {item.product.colorway}</p>
                      </div>
                      <p className="text-sm font-bold text-zinc-900 shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-zinc-200">
                        <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-lg">−</button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)} disabled={item.quantity >= 5} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-30 text-lg">+</button>
                      </div>
                      <button onClick={() => removeItem(item.product.id, item.size)} className="text-xs text-zinc-400 hover:text-red-500 transition-colors underline">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-100 px-6 py-5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700">Subtotal</span>
              <span className="text-lg font-bold text-zinc-900">{formatPrice(subtotal)}</span>
            </div>
            <Link href="/cart" onClick={closeDrawer} className="flex items-center justify-center w-full py-3.5 border border-zinc-900 text-sm font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-50 transition-colors">
              View Full Bag →
            </Link>
            <button disabled title="Payment coming soon" className="w-full py-3.5 bg-zinc-200 text-zinc-400 text-sm font-bold tracking-widest uppercase cursor-not-allowed">
              Checkout — Coming Soon
            </button>
          </div>
        )}
      </div>
    </>
  );
}
