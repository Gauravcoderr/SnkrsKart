import { MetadataRoute } from 'next';
import { BRANDS } from '@/lib/constants';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface BlogEntry { slug: string; updatedAt?: string; createdAt: string; tags?: string[] }
interface ProductEntry { slug: string; createdAt?: string }
interface SlugEntry { slug: string }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/sell`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/size-guide`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/shipping`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/returns`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/faqs`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/track-order`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Dynamic: Blog posts + tag pages
  let blogPages: MetadataRoute.Sitemap = [];
  let tagPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/blogs?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const blogs: BlogEntry[] = await res.json();
      blogPages = blogs.map((b) => ({
        url: `${SITE_URL}/blogs/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
      // Unique tags across all blogs
      const allTags = new Set<string>();
      blogs.forEach((b) => (b.tags ?? []).forEach((t) => allTags.add(t.toLowerCase())));
      tagPages = Array.from(allTags).map((tag) => ({
        url: `${SITE_URL}/blogs/tag/${encodeURIComponent(tag)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch { /* ignore */ }

  // Dynamic: Product pages
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/products?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const products: ProductEntry[] = data.products || [];
      productPages = products.map((p) => ({
        url: `${SITE_URL}/products/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch { /* ignore */ }

  // Brand pages
  const brandPages: MetadataRoute.Sitemap = BRANDS.map((b) => ({
    url: `${SITE_URL}/brands/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // Category pages (static)
  const categoryPages: MetadataRoute.Sitemap = [
    'running', 'basketball', 'lifestyle', 'training', 'men', 'women', 'kids', 'sale',
  ].map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // Sneaker profile pages
  let sneakerPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/sneaker-profiles`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const profiles: SlugEntry[] = await res.json();
      sneakerPages = profiles.map((p) => ({
        url: `${SITE_URL}/sneakers/${p.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }));
      if (sneakerPages.length > 0) {
        sneakerPages.unshift({ url: `${SITE_URL}/sneakers`, changeFrequency: 'weekly' as const, priority: 0.8 });
      }
    }
  } catch { /* ignore */ }

  // Drop calendar pages
  let dropPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/drops`, { next: { revalidate: 300 } });
    if (res.ok) {
      const drops: SlugEntry[] = await res.json();
      dropPages = drops.map((d) => ({
        url: `${SITE_URL}/drops/${d.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
      if (dropPages.length > 0) {
        dropPages.unshift({ url: `${SITE_URL}/drops`, changeFrequency: 'daily' as const, priority: 0.8 });
      }
    }
  } catch { /* ignore */ }

  return [...staticPages, ...brandPages, ...categoryPages, ...sneakerPages, ...dropPages, ...productPages, ...blogPages, ...tagPages];
}
