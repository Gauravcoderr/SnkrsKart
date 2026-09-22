/**
 * Full-catalogue product loader for feeds, llms.txt and schema generators.
 *
 * `GET /products` is the storefront grid endpoint: it caps `limit` at 48 and returns card
 * fields only (no sku / description). Anything that needs *every* product must go through
 * here. Prefers `GET /products/feed` (all products, feed fields, no cap) and falls back to
 * walking the paginated grid if the backend predates that endpoint.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/** Grid endpoint's hard `limit` cap (backend getAllProducts). */
const GRID_PAGE_SIZE = 48;

/**
 * Safety ceiling for the paginated fallback. The loop normally stops at `totalPages`
 * (3 pages for ~110 products); this only guards against a missing or bogus `totalPages`
 * turning the feed route into an infinite fetch loop. 20 × 48 = 960 products, ~9× today's
 * catalogue. Not a business limit: the primary path (/products/feed) has no cap.
 */
const MAX_FALLBACK_PAGES = 20;

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  colorway?: string;
  colors?: string[];
  gender: string;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  images: string[];
  hoverImage?: string;
  sizes?: number[];
  availableSizes: number[];
  stringSizes?: string[];
  availableStringSizes?: string[];
  soldOut: boolean;
  comingSoon: boolean;
  releaseDate?: string;
  description?: string;
  category?: string;
  sku?: string;
  productType?: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  faqs?: { q: string; a: string }[];
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  createdAt?: string;
}

interface Options {
  /** ISR revalidate window in seconds (default 1h). Ignored when `noStore` is set. */
  revalidate?: number;
  noStore?: boolean;
  signal?: AbortSignal;
}

function init(o: Options): RequestInit {
  const base: RequestInit = o.noStore ? { cache: 'no-store' } : { next: { revalidate: o.revalidate ?? 3600 } };
  return o.signal ? { ...base, signal: o.signal } : base;
}

export async function fetchAllProducts(o: Options = {}): Promise<CatalogProduct[]> {
  try {
    const res = await fetch(`${API}/products/feed`, init(o));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) return data.products;
    }
  } catch { /* fall through to paginated walk */ }

  const out: CatalogProduct[] = [];
  try {
    for (let page = 1; page <= MAX_FALLBACK_PAGES; page++) {
      const res = await fetch(`${API}/products?limit=${GRID_PAGE_SIZE}&page=${page}`, init(o));
      if (!res.ok) break;
      const data = await res.json();
      out.push(...(data.products || []));
      if (page >= (data.totalPages ?? 1)) break;
    }
  } catch { /* return what we have; callers treat [] as "unavailable" */ }
  return out;
}
