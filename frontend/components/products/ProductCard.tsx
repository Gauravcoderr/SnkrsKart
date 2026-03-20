'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import Badge from '@/components/ui/Badge';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem, openDrawer } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [hoveredSize, setHoveredSize] = useState<number | null>(null);
  const wishlisted = isWishlisted(product.slug);

  const hasVariants = (product.variants?.length ?? 0) > 0;

  const activeVariant = hoveredSize && hasVariants
    ? product.variants!.find((v) => v.size === hoveredSize)
    : null;

  const displayPrice = activeVariant ? activeVariant.price : product.price;
  const displayOriginalPrice = activeVariant ? activeVariant.originalPrice : product.originalPrice;

  // Pick 4 most popular available sizes for quick-add
  const quickSizes = product.availableSizes.slice(0, 4);

  const handleQuickAdd = (e: React.MouseEvent, size: number) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = hasVariants ? product.variants!.find((v) => v.size === size) : null;
    const effectiveProduct = variant ? { ...product, price: variant.price, originalPrice: variant.originalPrice } : product;
    addItem(effectiveProduct, size, 1);
    openDrawer();
  };

  const getBadge = () => {
    if (product.soldOut) return <Badge variant="soldout" />;
    if (product.newArrival) return <Badge variant="new" />;
    if (product.discount) return <Badge variant="sale" />;
    return null;
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <article className="relative flex flex-col">
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-zinc-100 img-hover-swap">
          {/* Default image */}
          <Image
            src={product.images[0]}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover img-default group-hover:scale-105 transition-transform duration-500"
            priority={priority}
          />
          {/* Hover image */}
          <Image
            src={product.hoverImage}
            alt={`${product.brand} ${product.name} alternate`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover img-hover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {getBadge()}
          </div>

          {/* Wishlist + Discount badges — top right */}
          <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
            {product.discount && <Badge variant="discount" label={`${product.discount}% OFF`} />}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.slug); }}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="w-7 h-7 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:scale-110 transition-transform"
            >
              <svg className={`w-4 h-4 transition-colors ${wishlisted ? 'fill-red-500 text-red-500' : 'fill-none text-zinc-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Quick size panel — slides up on hover */}
          {!product.soldOut && quickSizes.length > 0 && (
            <div className="quick-size-panel absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 z-10">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-medium">
                Quick Add
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => handleQuickAdd(e, size)}
                    onMouseEnter={() => setHoveredSize(size)}
                    onMouseLeave={() => setHoveredSize(null)}
                    className="h-7 px-2 text-xs font-semibold border border-zinc-200 bg-white hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all duration-150"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sold out overlay */}
          {product.soldOut && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="pt-3 pb-1 px-0.5">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400">
              {product.brand}
            </p>
            {product.gender && (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 border border-zinc-200 px-1.5 py-0.5">
                {product.gender === 'men' ? "Men's" : product.gender === 'women' ? "Women's" : 'Unisex'}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-900 leading-tight">
            {product.name}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{product.colorway}</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm font-bold text-zinc-900 transition-all duration-150">{formatPrice(displayPrice)}</span>
            {displayOriginalPrice && displayOriginalPrice > displayPrice && (
              <span className="text-xs text-zinc-400 line-through">
                {formatPrice(displayOriginalPrice)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
