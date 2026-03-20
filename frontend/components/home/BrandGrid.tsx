import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/types';

interface BrandGridProps {
  brands: Brand[];
  brandImages: Record<string, string>;
}

const brandStyle: Record<string, { bg: string; accent: string }> = {
  jordan: { bg: 'from-red-50 via-rose-50 to-rose-100', accent: 'text-rose-600' },
  nike: { bg: 'from-orange-50 via-amber-50 to-orange-100', accent: 'text-orange-600' },
  adidas: { bg: 'from-blue-50 via-sky-50 to-blue-100', accent: 'text-blue-600' },
  'new-balance': { bg: 'from-emerald-50 via-teal-50 to-emerald-100', accent: 'text-emerald-600' },
  crocs: { bg: 'from-yellow-50 via-amber-50 to-yellow-100', accent: 'text-amber-600' },
};

export default function BrandGrid({ brands, brandImages }: BrandGridProps) {
  return (
    <section className="bg-zinc-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.35em] uppercase text-zinc-400 mb-1">
              Premium Partners
            </p>
            <h2 className="text-3xl font-black tracking-tight uppercase text-zinc-900">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:block text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            View All &rarr;
          </Link>
        </div>

        {/* Brand cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {brands.map((brand) => {
            const style = brandStyle[brand.slug] ?? {
              bg: 'from-zinc-50 to-zinc-100',
              accent: 'text-zinc-600',
            };
            const image = brandImages[brand.slug];

            return (
              <Link
                key={brand.slug}
                href={`/products?brand=${brand.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${style.bg} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                {/* Shoe image */}
                <div className="relative w-full aspect-square flex items-center justify-center p-5 sm:p-6">
                  {image ? (
                    <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-110">
                      <Image
                        src={image}
                        alt={`${brand.name} shoes`}
                        fill
                        className="object-contain drop-shadow-lg"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    </div>
                  ) : (
                    <span className="text-4xl font-black text-zinc-200 uppercase tracking-wider">
                      {brand.logoText}
                    </span>
                  )}
                </div>

                {/* Brand info */}
                <div className="px-4 pb-4 -mt-2">
                  <p className="text-sm sm:text-base font-black uppercase tracking-wider text-zinc-900 leading-none">
                    {brand.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-zinc-400 tracking-widest uppercase font-medium">
                      {brand.productCount} styles
                    </p>
                    <p
                      className={`text-[10px] font-bold tracking-widest uppercase ${style.accent} opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0`}
                    >
                      Shop &rarr;
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
