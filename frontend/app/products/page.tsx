import { Suspense } from 'react';
import ProductsClient from './ProductsClient';
import { fetchAllProducts } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

const BRAND_LABELS: Record<string, string> = {
  nike: 'Nike',
  jordan: 'Jordan',
  adidas: 'Adidas',
  'new balance': 'New Balance',
  crocs: 'Crocs',
};

function brandLabel(raw: string) {
  return BRAND_LABELS[raw.toLowerCase()] ?? raw;
}

// Every spelling of a brand that appears in links / ad URLs → its /brands/{slug} page.
const BRAND_SLUGS: Record<string, string> = {
  nike: 'nike',
  jordan: 'jordan',
  'air jordan': 'jordan',
  'air-jordan': 'jordan',
  adidas: 'adidas',
  'new balance': 'new-balance',
  'new-balance': 'new-balance',
  crocs: 'crocs',
};

function brandSlug(raw: string): string | null {
  return BRAND_SLUGS[raw.toLowerCase().trim()] ?? null;
}

export async function generateMetadata({ searchParams }: { searchParams: { brand?: string } }) {
  const rawBrand = searchParams?.brand?.trim();
  if (!rawBrand) {
    return {
      title: { absolute: 'Buy Authentic Sneakers Online in India | Snkrs Cart' },
      description: 'Shop 100% authentic Nike, Jordan, Adidas, New Balance & Crocs sneakers online in India. Free pan-India shipping. Verified pairs, no fakes — browse the full collection.',
      alternates: { canonical: `${SITE_URL}/products` },
    };
  }

  const slug = brandSlug(rawBrand);
  if (!slug) {
    // Unknown brand filter → empty grid (soft 404 for Google). Don't index; point at /products.
    return {
      title: { absolute: 'Buy Authentic Sneakers Online in India | Snkrs Cart' },
      robots: { index: false, follow: true },
      alternates: { canonical: `${SITE_URL}/products` },
    };
  }

  const brand = brandLabel(rawBrand);
  const title = `Buy Authentic ${brand} Sneakers Online in India | Snkrs Cart`;
  const description = `Shop 100% authentic ${brand} sneakers online in India. Free pan-India shipping, verified pairs, no fakes — browse the full ${brand} collection at SNKRS CART.`;
  // /products?brand=Nike, ?brand=nike, ?brand=Nike&gender=men … all consolidate onto the
  // dedicated brand landing page, which is the URL in the sitemap and footer.
  const url = `${SITE_URL}/brands/${slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Snkrs Cart', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProductsPage() {
  let catalogSchema = null;
  try {
    const products = await fetchAllProducts();
    if (products.length > 0) {
      const prices = products.map((p: any) => p.price).filter(Boolean);
      const lowPrice = prices.length ? String(Math.min(...prices)) : undefined;
      const highPrice = prices.length ? String(Math.max(...prices)) : undefined;
      catalogSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'All Sneakers — SNKRS CART',
        description: '100% authentic Nike, Jordan, Adidas, New Balance & Crocs sneakers available in India with free pan-India shipping.',
        url: `${SITE_URL}/products`,
        ...(lowPrice && highPrice ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice,
            highPrice,
            offerCount: String(products.length),
            seller: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
          },
        } : {}),
        mainEntity: {
          '@type': 'ItemList',
          name: 'All Sneakers — SNKRS CART',
          numberOfItems: products.length,
          itemListElement: products.map((p: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: `${p.brand} ${p.name}`,
            brand: { '@type': 'Brand', name: p.brand },
            url: `${SITE_URL}/products/${p.slug}`,
            image: p.images?.[0] ?? '',
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: String(p.price),
              availability: p.soldOut || (p.availableSizes ?? []).length === 0
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
              seller: { '@type': 'Organization', name: 'SNKRS CART' },
            },
          },
        })),
        },
      };
    }
  } catch { /* non-critical — page still renders */ }

  return (
    <>
      {catalogSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }} />
      )}
      <Suspense fallback={<ProductsLoadingFallback />}>
        <ProductsClient />
      </Suspense>
    </>
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
