'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';
import { useCountdown } from '@/hooks/useCountdown';

interface ComingSoonModalProps {
  product: Product;
  onClose: () => void;
}

export default function ComingSoonModal({ product, onClose }: ComingSoonModalProps) {
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.slug);
  const { days, hours, minutes, seconds, expired, hasDate } = useCountdown(product.releaseDate);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const CountdownBox = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded flex flex-col items-center justify-center py-3 px-1">
      <span className="text-2xl font-black text-white tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-semibold tracking-widest uppercase text-zinc-600 mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm animate-backdrop-in" />

        {/* Content — centered via margin:auto to avoid transform conflicts with animation */}
        <Dialog.Content
          className="
            fixed z-50 focus:outline-none
            bottom-0 left-0 right-0
            sm:inset-0 sm:m-auto sm:h-fit
            sm:max-w-3xl sm:w-full
            bg-zinc-950 text-white
            rounded-t-2xl sm:rounded-none
            max-h-[92vh] overflow-y-auto sm:overflow-hidden
            animate-modal-up sm:animate-modal-in
          "
          style={{ willChange: 'transform, opacity' }}
          aria-describedby={undefined}
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-zinc-800/90 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>

          <div className="flex flex-col sm:flex-row sm:min-h-[480px]">
            {/* Left — Product Image */}
            <div className="relative w-full sm:w-[45%] aspect-square sm:aspect-auto shrink-0 bg-zinc-900">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={`${product.brand} ${product.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 45vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">👟</span>
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-zinc-950/20 pointer-events-none" />
              {/* Coming Soon badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-indigo-500 text-white">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Right — Details */}
            <div className="flex-1 flex flex-col px-6 py-7 sm:px-8 sm:py-8 sm:overflow-y-auto">
              {/* Eyebrow */}
              <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-indigo-400 mb-3">
                Dropping Soon
              </p>

              {/* Brand */}
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-1">
                {product.brand}
              </p>

              {/* Name */}
              <Dialog.Title className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight mb-1">
                {product.name}
              </Dialog.Title>

              {/* Colorway */}
              {product.colorway && (
                <p className="text-xs text-zinc-500 mb-4">{product.colorway}</p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-xl font-bold text-white">{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-zinc-600 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Countdown */}
              <div className="mb-6">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 mb-3">
                  Drop Date
                </p>

                {hasDate && !expired && (
                  <div className="grid grid-cols-4 gap-2">
                    <CountdownBox value={days} label="Days" />
                    <CountdownBox value={hours} label="Hrs" />
                    <CountdownBox value={minutes} label="Min" />
                    <CountdownBox value={seconds} label="Sec" />
                  </div>
                )}

                {hasDate && expired && (
                  <p className="text-sm font-semibold text-indigo-400">
                    Drop is live — check back soon!
                  </p>
                )}

                {!hasDate && (
                  <p className="text-sm text-zinc-500">
                    Date to be announced. Wishlist to get notified.
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-800 mb-6" />

              {/* CTAs */}
              <div className="flex flex-col gap-3 mt-auto">
                {/* Wishlist / Notify Me */}
                <button
                  type="button"
                  onClick={() => toggle(product.slug)}
                  className={`
                    w-full py-3.5 flex items-center justify-center gap-2
                    text-sm font-bold tracking-widest uppercase
                    transition-all duration-200
                    ${wishlisted
                      ? 'bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-500'
                      : 'border border-indigo-500 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    }
                  `}
                >
                  <svg
                    className={`w-4 h-4 transition-colors ${wishlisted ? 'fill-white text-white' : 'fill-none text-indigo-400'}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlisted ? 'Wishlisted' : 'Notify Me'}
                </button>

                {/* View Details */}
                <Link
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="w-full py-3 text-center text-xs font-semibold tracking-widest uppercase text-zinc-500 hover:text-white transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
