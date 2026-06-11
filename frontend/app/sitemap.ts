import { MetadataRoute } from 'next';
import { BRANDS } from '@/lib/constants';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API      = process.env.NEXT_PUBLIC_API_URL   || 'http://localhost:4000/api/v1';

const PAGE_SIZE    = 500;
const TIMEOUT_MS   = 8000;

interface BlogEntry    { slug: string; updatedAt?: string; createdAt: string; tags?: string[] }
interface SlugEntry    { slug: string; createdAt?: string }

function opts(revalidate: number): RequestInit {
  return { next: { revalidate } as NextFetchRequestConfig, signal: AbortSignal.timeout(TIMEOUT_MS) };
}

// ---------------------------------------------------------------------------
// generateSitemaps — called once to discover all segments
// ---------------------------------------------------------------------------
async function fetchCount(endpoint: string): Promise<number> {
  return fetch(`${API}/${endpoint}/count`, opts(3600))
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { count?: number } | null) => d?.count ?? 0)
    .catch(() => 0);
}

export async function generateSitemaps(): Promise<Array<{ id: string }>> {
  const [blogTotal, productTotal, sneakerTotal, dropTotal] = await Promise.all([
    fetchCount('blogs'),
    fetchCount('products'),
    fetchCount('sneaker-profiles'),
    fetchCount('drops'),
  ]);

  const pages = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));

  return [
    { id: 'static'     },
    { id: 'brands'     },
    { id: 'categories' },
    ...Array.from({ length: pages(blogTotal)    }, (_, i) => ({ id: `blog_${i}`    })),
    ...Array.from({ length: pages(productTotal) }, (_, i) => ({ id: `product_${i}` })),
    ...Array.from({ length: pages(sneakerTotal) }, (_, i) => ({ id: `sneaker_${i}` })),
    ...Array.from({ length: pages(dropTotal)    }, (_, i) => ({ id: `drop_${i}`    })),
  ];
}

// ---------------------------------------------------------------------------
// sitemap — called per segment, returns its URL entries
// ---------------------------------------------------------------------------
export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  if (id === 'static')     return staticPages();
  if (id === 'brands')     return brandPages();
  if (id === 'categories') return categoryPages();

  if (id.startsWith('blog_'))     return fetchBlogPage(parseInt(id.slice(5), 10));
  if (id.startsWith('product_'))  return fetchProductPage(parseInt(id.slice(8), 10));
  if (id.startsWith('sneaker_'))  return fetchSneakerPage(parseInt(id.slice(8), 10));
  if (id.startsWith('drop_'))     return fetchDropPage(parseInt(id.slice(5), 10));

  return [];
}

// ---------------------------------------------------------------------------
// Static segments
// ---------------------------------------------------------------------------
function staticPages(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 1    },
    { url: `${SITE_URL}/products`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9  },
    { url: `${SITE_URL}/blogs`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8  },
    { url: `${SITE_URL}/about`,                                   changeFrequency: 'monthly', priority: 0.5  },
    { url: `${SITE_URL}/contact`,                                 changeFrequency: 'monthly', priority: 0.5  },
    { url: `${SITE_URL}/sell`,                                    changeFrequency: 'monthly', priority: 0.5  },
    { url: `${SITE_URL}/size-guide`,                              changeFrequency: 'monthly', priority: 0.4  },
    { url: `${SITE_URL}/shipping`,                                changeFrequency: 'monthly', priority: 0.3  },
    { url: `${SITE_URL}/returns`,                                 changeFrequency: 'monthly', priority: 0.3  },
    { url: `${SITE_URL}/faqs`,                                    changeFrequency: 'monthly', priority: 0.3  },
    { url: `${SITE_URL}/track-order`,                             changeFrequency: 'monthly', priority: 0.3  },
    { url: `${SITE_URL}/privacy`,                                 changeFrequency: 'yearly',  priority: 0.2  },
    { url: `${SITE_URL}/terms`,                                   changeFrequency: 'yearly',  priority: 0.2  },
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

function categoryPages(): MetadataRoute.Sitemap {
  return ['running', 'basketball', 'lifestyle', 'training', 'men', 'women', 'kids', 'sale'].map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));
}

// ---------------------------------------------------------------------------
// Dynamic segments
// ---------------------------------------------------------------------------
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

    // Tag pages only from first blog segment to avoid duplicates
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
