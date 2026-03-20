'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import Badge from '@/components/ui/Badge';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem, openDrawer } = useCart();
  const [hoveredSize, setHoveredSize] = useState<number | null>(null);

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

          {/* Discount badge */}
          {product.discount && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="discount" label={`${product.discount}% OFF`} />
            </div>
          )}

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
          <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400 mb-0.5">
            {product.brand}
          </p>
          <p className="text-sm font-semibold text-zinc-900 leading-tight">
            {product.name}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{product.colorway}</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm font-bold text-zinc-900 transition-all duration-150">{formatPrice(displayPrice)}</span>
            {displayOriginalPrice && (
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
