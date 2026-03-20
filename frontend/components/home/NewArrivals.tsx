import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';

interface NewArrivalsProps {
  products: Product[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">
              Just Dropped
            </p>
            <h2 className="text-2xl font-bold tracking-[0.15em] uppercase text-zinc-900">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-xs font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-500 transition-colors hidden sm:flex items-center gap-1"
          >
            View All
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {products.map((product, i) => (
            <div key={product.id} className="min-w-[220px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <ProductCard product={product} priority={i < 2} />
            </div>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-6 sm:hidden">
          <Link
            href="/products?sort=newest"
            className="flex items-center justify-center w-full py-3 border border-zinc-900 text-sm font-semibold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            View All New Arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
