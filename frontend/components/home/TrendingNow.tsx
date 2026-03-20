import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';

interface TrendingNowProps {
  products: Product[];
}

export default function TrendingNow({ products }: TrendingNowProps) {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">
              What&apos;s Hot
            </p>
            <h2 className="text-2xl font-bold tracking-[0.15em] uppercase text-zinc-900">
              Trending Now
            </h2>
          </div>
          <Link
            href="/products?sort=popular"
            className="text-xs font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-500 transition-colors hidden sm:flex items-center gap-1"
          >
            View All
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* 4-col grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 border border-zinc-900 text-zinc-900 px-10 py-4 text-sm font-bold tracking-widest uppercase hover:bg-zinc-900 hover:text-white transition-colors"
          >
            Browse All Sneakers
          </Link>
        </div>
      </div>
    </section>
  );
}
