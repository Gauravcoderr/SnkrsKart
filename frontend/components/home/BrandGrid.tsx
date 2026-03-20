import Link from 'next/link';
import { Brand } from '@/types';

interface BrandGridProps {
  brands: Brand[];
}

const brandStyles: Record<string, string> = {
  nike: 'bg-zinc-950',
  adidas: 'bg-zinc-900',
  'new-balance': 'bg-zinc-800',
  jordan: 'bg-zinc-950',
  crocs: 'bg-zinc-900',
};

export default function BrandGrid({ brands }: BrandGridProps) {
  return (
    <section className="bg-zinc-50 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">
            Premium Partners
          </p>
          <h2 className="text-2xl font-bold tracking-[0.15em] uppercase text-zinc-900">
            Shop by Brand
          </h2>
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className={`group relative flex flex-col items-center justify-center aspect-square ${brandStyles[brand.id] ?? 'bg-zinc-900'} p-6 hover:scale-[1.02] transition-transform duration-300 overflow-hidden`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />

              {/* Brand name as logo text */}
              <span className="relative font-display text-xl tracking-[0.15em] text-white text-center leading-tight">
                {brand.logoText}
              </span>

              {/* Product count */}
              <span className="relative mt-2 text-[10px] text-zinc-400 tracking-widest uppercase font-medium">
                {brand.productCount} styles
              </span>

              {/* Hover underline */}
              <span className="relative mt-2 text-[10px] text-white/0 group-hover:text-white/80 tracking-widest uppercase font-medium transition-colors duration-200">
                Shop →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
