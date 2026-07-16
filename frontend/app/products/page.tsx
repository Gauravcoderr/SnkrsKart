import Link from 'next/link';
import { fetchProducts } from '@/lib/api';
import { parseProductParams, toURLSearchParams, buildProductQueryString } from '@/lib/productFilters';
import ProductsFilterPanel from '@/components/products/ProductsFilterPanel';
import ProductGrid from '@/components/products/ProductGrid';
import ProductPagination from '@/components/products/ProductPagination';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';
const LIMIT = 12;

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

export async function generateMetadata({ searchParams }: { searchParams: { brand?: string } }) {
  const rawBrand = searchParams?.brand?.trim();
  if (!rawBrand) {
    return {
      title: { absolute: 'Buy Authentic Sneakers Online in India | Snkrs Cart' },
      description: 'Shop 100% authentic Nike, Jordan, Adidas, New Balance & Crocs sneakers online in India. Free pan-India shipping. Verified pairs, no fakes — browse the full collection.',
      alternates: { canonical: `${SITE_URL}/products` },
    };
  }

  const brand = brandLabel(rawBrand);
  const title = `Buy Authentic ${brand} Sneakers Online in India | Snkrs Cart`;
  const description = `Shop 100% authentic ${brand} sneakers online in India. Free pan-India shipping, verified pairs, no fakes — browse the full ${brand} collection at SNKRS CART.`;
  const url = `${SITE_URL}/products?brand=${encodeURIComponent(rawBrand)}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Snkrs Cart', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { filters, page } = parseProductParams(toURLSearchParams(searchParams));

  const [productsRes, catalogProducts] = await Promise.all([
    fetchProducts({ ...filters, page, limit: LIMIT }).catch(() => ({ products: [], total: 0, page: 1, limit: LIMIT, totalPages: 1 })),
    fetch(`${API}/products?limit=200`, { next: { revalidate: 3600 } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data ? (data.products ?? data ?? []) : []))
      .catch(() => [] as any[]),
  ]);

  const { products, total, totalPages } = productsRes;

  let catalogSchema = null;
  if (catalogProducts.length > 0) {
    const prices = catalogProducts.map((p: any) => p.price).filter(Boolean);
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
          offerCount: String(catalogProducts.length),
          seller: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
        },
      } : {}),
      mainEntity: {
        '@type': 'ItemList',
        name: 'All Sneakers — SNKRS CART',
        numberOfItems: catalogProducts.length,
        itemListElement: catalogProducts.map((p: any, i: number) => ({
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

  const clearSearchHref = filters.search
    ? (() => { const qs = buildProductQueryString({ ...filters, search: '' }, 1); return qs ? `/products?${qs}` : '/products'; })()
    : null;

  return (
    <>
      {catalogSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }} />
      )}

      {/* Top Banner */}
      <div className="bg-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 text-center">
          <p className="text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-white">
            NEW DROPS EVERY WEEK
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 tracking-wide">
            Fresh kicks, straight to your door
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">
            Sneakers
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-[0.1em] uppercase text-zinc-900">
              {filters.search ? `Search: "${filters.search}"` : 'All Products'}
            </h1>
            {clearSearchHref && (
              <Link
                href={clearSearchHref}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-widest uppercase border border-zinc-300 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </Link>
            )}
          </div>
        </div>

        <ProductsFilterPanel filters={filters} total={total}>
          <ProductGrid products={products} />
          <ProductPagination filters={filters} page={page} totalPages={totalPages} />
        </ProductsFilterPanel>
      </div>
    </>
  );
}
