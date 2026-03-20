'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function WishlistPage() {
  const { ids, toggle } = useWishlist();
  const { addItem, openDrawer } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(
      ids.map((id) =>
        fetch(`${BASE_URL}/products/${id}`)
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then((results) => {
      setProducts(results.filter(Boolean) as Product[]);
    }).finally(() => setLoading(false));
  }, [ids]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Saved</p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          Wishlist{' '}
          {ids.length > 0 && <span className="text-zinc-400 font-normal text-xl">({ids.length})</span>}
        </h1>
      </div>

      {ids.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="font-bold text-zinc-900 tracking-wider uppercase mb-2">Your wishlist is empty</p>
          <p className="text-sm text-zinc-500 mb-8">Tap the heart icon on any product to save it here.</p>
          <Link
            href="/products"
            className="inline-block bg-zinc-900 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <div key={product.id} className="group relative flex flex-col">
              <Link href={`/products/${product.slug}`} className="block">
                <div className="relative aspect-square bg-zinc-100 overflow-hidden mb-3">
                  <Image
                    src={product.images[0]}
                    alt={`${product.brand} ${product.name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.soldOut && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Sold Out</span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Remove from wishlist */}
              <button
                onClick={() => toggle(product.slug)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:scale-110 transition-transform"
                aria-label="Remove from wishlist"
              >
                <svg className="w-4 h-4 fill-red-500 text-red-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <div className="flex-1">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400">{product.brand}</p>
                <p className="text-sm font-semibold text-zinc-900 leading-tight mt-0.5">{product.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{product.colorway}</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-sm font-bold text-zinc-900">{formatPrice(product.price)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-zinc-400 line-through">{formatPrice(product.originalPrice)}</span>
                  )}
                </div>
              </div>

              {!product.soldOut && product.availableSizes.length > 0 && (
                <button
                  onClick={() => {
                    addItem(product, product.availableSizes[0], 1);
                    openDrawer();
                  }}
                  className="mt-3 w-full py-2 border border-zinc-900 text-xs font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Add to Bag
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
