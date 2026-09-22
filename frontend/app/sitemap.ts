import { MetadataRoute } from 'next';
import { BRANDS } from '@/lib/constants';
import { CATEGORY_FILTERS, categoryQuery } from '@/lib/categoryFilters';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API      = process.env.NEXT_PUBLIC_API_URL   || 'http://localhost:4000/api/v1';

const PAGE_SIZE  = 500;
const TIMEOUT_MS = 25_000; // Render free tier cold start is 20-40s; 8s produced near-empty sitemaps

// Route may wait on a cold origin. Vercel default is 10s.
export const maxDuration = 60;
// Not prerendered at build: a cold origin during `next build` must not fail the deploy or bake
// a truncated sitemap. Data fetches below still cache for 1h via `next.revalidate`.
export const dynamic = 'force-dynamic';

interface BlogEntry { slug: string; updatedAt?: string; createdAt: string; tags?: string[] }
interface SlugEntry { slug: string; createdAt?: string }

function opts(revalidate: number): RequestInit {
  return { next: { revalidate } as NextFetchRequestConfig, signal: AbortSignal.timeout(TIMEOUT_MS) };
}

function pageRange(total: number): number[] {
  return Array.from({ length: Math.max(1, Math.ceil(total / PAGE_SIZE)) }, (_, i) => i);
}

// ---------------------------------------------------------------------------
// Count helpers
// ---------------------------------------------------------------------------
/** -1 = fetch failed. Callers must not treat that as "zero items". */
async function fetchCount(endpoint: string, revalidate = 3600): Promise<number> {
  return fetch(`${API}/${endpoint}/count`, opts(revalidate))
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { count?: number } | null) => (d && typeof d.count === 'number' ? d.count : -1))
    .catch(() => -1);
}

// ---------------------------------------------------------------------------
// Page fetchers — each returns URLs for one 500-item page
// ---------------------------------------------------------------------------
async function fetchBlogPage(page: number): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API}/blogs?limit=${PAGE_SIZE}&page=${page + 1}`, opts(3600));
    if (!res.ok) return [];
    const data: { blogs?: BlogEntry[] } = await res.json();
    const blogs: BlogEntry[] = data.blogs ?? [];

    const entries: MetadataRoute.Sitemap = blogs.map((b) => ({
      url: `${SITE_URL}/blogs/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    if (page === 0) {
      const allTags = new Set<string>();
      blogs.forEach((b) => (b.tags ?? []).forEach((t) => allTags.add(t.toLowerCase())));
      allTags.forEach((tag) => entries.push({
        url: `${SITE_URL}/blogs/tag/${encodeURIComponent(tag)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }

    return entries;
  } catch { return []; }
}

async function fetchProductPage(page: number): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API}/products/slugs?limit=${PAGE_SIZE}&page=${page + 1}`, opts(3600));
    if (!res.ok) return [];
    const data: { slugs?: SlugEntry[] } = await res.json();
    return (data.slugs ?? []).map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch { return []; }
}

async function fetchSneakerPage(page: number): Promise<MetadataRoute.Sitemap> {
  const index: MetadataRoute.Sitemap = page === 0
    ? [{ url: `${SITE_URL}/sneakers`, changeFrequency: 'weekly' as const, priority: 0.8 }]
    : [];
  try {
    const res = await fetch(`${API}/sneaker-profiles/slugs?limit=${PAGE_SIZE}&page=${page + 1}`, opts(3600));
    if (!res.ok) return index;
    const data: { slugs?: string[] } = await res.json();
    return [
      ...index,
      ...(data.slugs ?? []).map((slug) => ({
        url: `${SITE_URL}/sneakers/${slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
    ];
  } catch { return index; }
}

async function fetchDropPage(page: number): Promise<MetadataRoute.Sitemap> {
  const index: MetadataRoute.Sitemap = page === 0
    ? [{ url: `${SITE_URL}/drops`, changeFrequency: 'daily' as const, priority: 0.8 }]
    : [];
  try {
    const res = await fetch(`${API}/drops/slugs?limit=${PAGE_SIZE}&page=${page + 1}`, opts(300));
    if (!res.ok) return index;
    const data: { slugs?: string[] } = await res.json();
    return [
      ...index,
      ...(data.slugs ?? []).map((slug) => ({
        url: `${SITE_URL}/drops/${slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ];
  } catch { return index; }
}

// ---------------------------------------------------------------------------
// Static segments
// ---------------------------------------------------------------------------
function staticPages(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${SITE_URL}/products`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/blogs`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/about`,                                 changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`,                               changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/sell`,                                  changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/size-guide`,                            changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/shipping`,                              changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/returns`,                               changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/faqs`,                                  changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/track-order`,                           changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`,                               changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/terms`,                                 changeFrequency: 'yearly',  priority: 0.2 },
  ];
}

function brandPages(): MetadataRoute.Sitemap {
  return BRANDS.map((b) => ({
    url: `${SITE_URL}/brands/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));
}

/** Only categories that currently have products; an empty category page is noindexed. */
async function categoryPages(): Promise<MetadataRoute.Sitemap> {
  const slugs = Object.keys(CATEGORY_FILTERS);
  const totals = await Promise.all(slugs.map((slug) =>
    fetch(`${API}/products?${categoryQuery(slug, 1)}`, opts(3600))
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { total?: number } | null) => d?.total ?? 0)
      .catch(() => 0),
  ));
  return slugs
    .filter((_, i) => totals[i] > 0)
    .map((slug) => ({
      url: `${SITE_URL}/category/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
}

// ---------------------------------------------------------------------------
// Main export — single /sitemap.xml, all pages fetched in parallel
// ---------------------------------------------------------------------------
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogTotal, productTotal, sneakerTotal, dropTotal] = await Promise.all([
    fetchCount('blogs'),
    fetchCount('products'),
    fetchCount('sneaker-profiles'),
    fetchCount('drops', 300),
  ]);

  // A cold or failing origin used to yield a sitemap of ~13 static URLs, cached for an hour,
  // while Google believed the other ~1,300 pages had vanished. Fail the request instead:
  // Google keeps the last good sitemap and retries.
  if ([blogTotal, productTotal, sneakerTotal, dropTotal].some((n) => n < 0)) {
    throw new Error('sitemap: backend unavailable, refusing to emit a truncated sitemap');
  }

  const [blogChunks, productChunks, sneakerChunks, dropChunks] = await Promise.all([
    Promise.all(pageRange(blogTotal).map(fetchBlogPage)),
    Promise.all(pageRange(productTotal).map(fetchProductPage)),
    Promise.all(pageRange(sneakerTotal).map(fetchSneakerPage)),
    Promise.all(pageRange(dropTotal).map(fetchDropPage)),
  ]);

  return [
    ...staticPages(),
    ...brandPages(),
    ...(await categoryPages()),
    ...blogChunks.flat(),
    ...productChunks.flat(),
    ...sneakerChunks.flat(),
    ...dropChunks.flat(),
  ];
}
