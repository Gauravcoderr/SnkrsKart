'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface CartItemProps {
  item: CartItemType;
  compact?: boolean;
}

export default function CartItem({ item, compact = false }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const { product, size, quantity } = item;
  const maxQty = product.variants?.find((v) => v.size === size)?.maxQty ?? 5;

  return (
    <div className="flex gap-4 py-4 border-b border-zinc-100 last:border-0">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className={`relative bg-zinc-100 overflow-hidden ${compact ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'}`}>
          <Image
            src={product.images[0]}
            alt={`${product.brand} ${product.name}`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="96px"
          />
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400">
              {product.brand}
            </p>
            <Link href={`/products/${product.slug}`}>
              <p className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors truncate">
                {product.name}
              </p>
            </Link>
            <p className="text-xs text-zinc-400 mt-0.5">{product.colorway}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Size: UK {size}</p>
          </div>
          <p className="text-sm font-bold text-zinc-900 shrink-0">
            {formatPrice(product.price * quantity)}
          </p>
        </div>

        {/* Qty controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-zinc-200">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, size, quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-lg leading-none"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold text-zinc-900">{quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, size, quantity + 1)}
              disabled={quantity >= maxQty}
              className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-30 text-lg leading-none"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(product.id, size)}
            className="text-xs font-medium text-zinc-400 hover:text-red-500 transition-colors underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
