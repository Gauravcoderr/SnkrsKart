import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/types';
import { BRANDS } from '@/lib/constants';

interface BrandGridProps {
  brands: Brand[];
}

export default function BrandGrid({ brands }: BrandGridProps) {
  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">
              Premium Partners
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-zinc-900">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:block text-[11px] font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors border-b border-zinc-200 hover:border-zinc-900 pb-0.5"
          >
            All Brands &rarr;
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {brands.map((brand) => {
            const meta = BRANDS.find((b) => b.slug === brand.slug);
            if (!meta) return null;

            return (
              <Link
                key={brand.slug}
                href={`/products?brand=${brand.slug}`}
                className="group block"
              >
                <div
                  className="relative overflow-hidden rounded-xl aspect-[3/4] flex flex-col"
                  style={{ backgroundColor: meta.cardBg }}
                >
                  {/* Coloured top bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] z-10 transition-all duration-300 group-hover:h-[5px]"
                    style={{ backgroundColor: meta.accent }}
                  />

                  {/* Shoe image */}
                  <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6">
                    <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
                      <Image
                        src={meta.cardImage}
                        alt={`${meta.label} sneakers`}
                        fill
                        className="object-contain drop-shadow-2xl"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 shrink-0">
                    <p className="text-white font-black text-sm sm:text-base uppercase tracking-wider leading-none">
                      {meta.label}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-zinc-500 text-[10px] tracking-widest uppercase">
                        {brand.productCount} styles
                      </p>
                      <p
                        className="text-[10px] font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
                        style={{ color: meta.accent }}
                      >
                        Shop &rarr;
                      </p>
                    </div>
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
