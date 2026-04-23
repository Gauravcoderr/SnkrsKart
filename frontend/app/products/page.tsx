import { Suspense } from 'react';
import ProductsClient from './ProductsClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

export const metadata = {
  title: 'Buy Authentic Sneakers Online in India | SNKRS CART',
  description: 'Shop 100% authentic Nike, Jordan, Adidas, New Balance & Crocs sneakers online in India. Free pan-India shipping. Verified pairs, no fakes — browse the full collection.',
  alternates: { canonical: `${SITE_URL}/products` },
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
