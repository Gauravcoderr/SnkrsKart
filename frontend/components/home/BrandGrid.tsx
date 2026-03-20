import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/types';

interface BrandGridProps {
  brands: Brand[];
}

const brandMeta: Record<string, { image: string; accentBar: string; accentText: string }> = {
  jordan: {
    image: 'https://sneakerpolitics.com/cdn/shop/files/AURORA_IM6568-010_PHSLH000-2000.jpg?v=1763417797',
    accentBar: 'bg-rose-600',
    accentText: 'text-rose-400',
  },
  nike: {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    accentBar: 'bg-orange-500',
    accentText: 'text-orange-400',
  },
  adidas: {
    image: 'https://captaincreps.com/wp-content/uploads/2023/11/IE0169-1-1.jpg',
    accentBar: 'bg-blue-500',
    accentText: 'text-blue-400',
  },
  'new-balance': {
    image: 'https://images.vegnonveg.com/resized/1360X1600/14402/new-balance-x-salehe-bembury-m1000-bluepink-multicolor-6925337cc46ec.jpg?format=webp',
    accentBar: 'bg-emerald-500',
    accentText: 'text-emerald-400',
  },
  crocs: {
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    accentBar: 'bg-amber-400',
    accentText: 'text-amber-400',
  },
};

export default function BrandGrid({ brands }: BrandGridProps) {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.35em] uppercase text-zinc-400 mb-1">
            Premium Partners
          </p>
          <h2 className="text-3xl font-black tracking-tight uppercase text-zinc-900">
            Shop by Brand
          </h2>
        </div>

        {/* Brand grid — 2 large + 3 smaller */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {brands.map((brand, i) => {
            const meta = brandMeta[brand.id] ?? { image: '', accent: '#18181b' };
            const isLarge = i < 2;

            return (
              <Link
                key={brand.id}
                href={`/products?brand=${brand.slug}`}
                className={`group relative overflow-hidden ${isLarge ? 'aspect-[3/4]' : 'aspect-[4/5]'}`}
              >
                {/* Background image */}
                {meta.image && (
                  <Image
                    src={meta.image}
                    alt={brand.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/70 transition-all duration-300" />

                {/* Accent bar at top */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${meta.accentBar}`} />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <p className="text-white font-black text-lg uppercase tracking-wider leading-none mb-1">
                    {brand.name}
                  </p>
                  <p className="text-zinc-300 text-[11px] tracking-widest uppercase font-medium">
                    {brand.productCount} styles
                  </p>
                  <p className={`text-[11px] font-bold tracking-widest uppercase mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 ${meta.accentText}`}>
                    Shop Now →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
