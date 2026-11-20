import ProductsClient from './ProductsClient';
import { fetchAllProducts } from '@/lib/catalog';
import { fetchProducts } from '@/lib/api';
import { BRANDS, GENDERS, PRODUCT_TYPES, SORT_OPTIONS } from '@/lib/constants';
import { fullProductName } from '@/lib/productTitle';
import { GRID_PAGE_SIZE, filterKey, filtersFromParams, prefetchable, toSearchParams } from '@/lib/productFilters';
import type { FilterState, ProductsResponse } from '@/types';

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

type SearchParams = Record<string, string | string[] | undefined>;

const KNOWN_FILTER_VALUES = {
  brands: BRANDS.map((b) => b.label),
  genders: GENDERS,
  productTypes: PRODUCT_TYPES,
  sorts: SORT_OPTIONS.map((o) => o.value),
};

const FIRST_PAGE_TIMEOUT_MS = 4000;

async function fetchFirstPage(filters: FilterState): Promise<ProductsResponse | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), FIRST_PAGE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      fetchProducts({ ...filters, page: 1, limit: GRID_PAGE_SIZE }).catch(() => null),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function generateMetadata(props: { searchParams: Promise<{ brand?: string }> }) {
  const searchParams = await props.searchParams;
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

export default async function ProductsPage(props: { searchParams: Promise<SearchParams> }) {
  const filters = filtersFromParams(toSearchParams(await props.searchParams));
  const firstPageRequest = prefetchable(filters, KNOWN_FILTER_VALUES) ? fetchFirstPage(filters) : null;
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
            name: fullProductName(p.brand, p.name),
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
  const firstPage = await firstPageRequest;

  return (
    <>
      {catalogSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }} />
      )}
      <ProductsClient initial={firstPage ? { key: filterKey(filters), page: firstPage } : undefined} />
    </>
  );
}
