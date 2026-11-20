import { MetadataRoute } from 'next';
import { BRANDS } from '@/lib/constants';
import { CATEGORY_FILTERS, categoryQuery } from '@/lib/categoryFilters';
import { indexableTags } from '@/app/blogs/blogUtils';
import { RELEASE_CALENDARS, calendarDrops } from '@/lib/releaseCalendars';
import { todayKey } from '@/lib/calendar';
import type { Drop } from '@/types';

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
interface SlugEntry { slug: string; createdAt?: string; updatedAt?: string }

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
// Throws instead of returning a partial page: tag pages are listed by post count, so a
// missing blog page would silently drop tags (and posts) from the sitemap.
async function fetchBlogPage(page: number): Promise<BlogEntry[]> {
  const res = await fetch(`${API}/blogs?limit=${PAGE_SIZE}&page=${page + 1}`, opts(3600));
  if (!res.ok) throw new Error(`sitemap: blogs page ${page + 1} returned ${res.status}, refusing to emit a truncated sitemap`);
  const data: { blogs?: BlogEntry[] } = await res.json();
  return data.blogs ?? [];
}

function blogPages(blogs: BlogEntry[]): MetadataRoute.Sitemap {
  const posts = blogs.map((b) => ({
    url: `${SITE_URL}/blogs/${b.slug}`,
    lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  const tags = indexableTags(blogs).map((tag) => ({
    url: `${SITE_URL}/blogs/tag/${encodeURIComponent(tag)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  return [...posts, ...tags];
}

async function fetchProductPage(page: number): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API}/products/slugs?limit=${PAGE_SIZE}&page=${page + 1}`, opts(3600));
    if (!res.ok) return [];
    const data: { slugs?: SlugEntry[] } = await res.json();
    return (data.slugs ?? []).map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.createdAt ?? Date.now()),
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
    { url: `${SITE_URL}/data-deletion`,                         changeFrequency: 'yearly',  priority: 0.1 },
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

async function releaseCalendarPages(): Promise<MetadataRoute.Sitemap> {
  const today = todayKey();
  const res = await fetch(`${API}/drops?from=${today.slice(0, 4)}-01-01`, opts(300));
  if (!res.ok) throw new Error('sitemap: drops unavailable, refusing to emit a truncated sitemap');
  const drops: Drop[] = await res.json();
  return RELEASE_CALENDARS
    .filter((cal) => {
      const { upcoming, released } = calendarDrops(cal, drops, today);
      return upcoming.length + released.length > 0;
    })
    .map((cal) => ({
      url: `${SITE_URL}/release-dates/${cal.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
}

async function sneakerPricePage(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(`${API}/sneaker-profiles/prices`, opts(3600));
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`sitemap: sneaker prices answered ${res.status}, refusing to emit a truncated sitemap`);
  const rows: unknown[] = await res.json();
  if (rows.length === 0) return [];
  return [{ url: `${SITE_URL}/sneakers/price-in-india`, changeFrequency: 'daily' as const, priority: 0.8 }];
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
    ...(await releaseCalendarPages()),
    ...(await sneakerPricePage()),
    ...blogPages(blogChunks.flat()),
    ...productChunks.flat(),
    ...sneakerChunks.flat(),
    ...dropChunks.flat(),
  ];
}
