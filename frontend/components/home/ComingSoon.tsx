import { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';

interface ComingSoonProps {
  products: Product[];
}

export default function ComingSoon({ products }: ComingSoonProps) {
  if (!products.length) return null;

  return (
    <section className="py-8 lg:py-12 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-indigo-400 mb-1">
            Mark Your Calendar
          </p>
          <h2 className="text-2xl font-bold tracking-[0.15em] uppercase text-white">
            Dropping Soon
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Wishlist now. Be first when they drop.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 8).map((product) => (
            <div key={product.id} className="bg-zinc-900 rounded-sm">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
