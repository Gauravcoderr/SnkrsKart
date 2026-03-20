import { Suspense } from 'react';
import ProductsClient from './ProductsClient';

export const metadata = {
  title: 'All Sneakers — SNKRS CART',
  description: 'Browse premium sneakers from Nike, Adidas, New Balance, Asics, Puma & Vans.',
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoadingFallback />}>
      <ProductsClient />
    </Suspense>
  );
}

function ProductsLoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-40 bg-zinc-200 animate-pulse mb-8" />
      <div className="flex gap-8">
        <div className="hidden lg:block w-56 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-zinc-200 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-200 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
