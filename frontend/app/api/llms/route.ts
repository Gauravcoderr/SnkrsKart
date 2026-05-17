import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:4000/api/v1';

interface Blog    { title: string; slug: string; excerpt: string }
interface Product { name: string; brand: string; slug: string; price: number; category?: string }
interface Drop    { name: string; brand: string; slug: string; releaseDate: string; retailPrice: number | null; where?: string; colorway?: string }
interface Profile { name: string; brand: string; slug: string; releaseYear?: number | null; designer?: string; tagline?: string }

export async function GET() {
  const [blogsRes, productsRes, dropsRes, profilesRes] = await Promise.allSettled([
    fetch(`${API}/blogs?limit=200`,           { next: { revalidate: 3600 } }),
    fetch(`${API}/products?limit=500`,        { next: { revalidate: 3600 } }),
    fetch(`${API}/drops`,                     { next: { revalidate: 300  } }),
    fetch(`${API}/sneaker-profiles`,          { next: { revalidate: 3600 } }),
  ]);

  const rawBlogs    = blogsRes.status    === 'fulfilled' && blogsRes.value.ok    ? await blogsRes.value.json()    : [];
  const rawProducts = productsRes.status === 'fulfilled' && productsRes.value.ok ? await productsRes.value.json() : {};
  const rawDrops    = dropsRes.status    === 'fulfilled' && dropsRes.value.ok    ? await dropsRes.value.json()    : [];
  const rawProfiles = profilesRes.status === 'fulfilled' && profilesRes.value.ok ? await profilesRes.value.json() : [];

  const blogs:    Blog[]    = Array.isArray(rawBlogs)    ? rawBlogs    : (rawBlogs.blogs    ?? []);
  const products: Product[] = rawProducts.products       ?? [];
  const drops:    Drop[]    = Array.isArray(rawDrops)    ? rawDrops    : [];
  const profiles: Profile[] = Array.isArray(rawProfiles) ? rawProfiles : [];

  // Group products by brand
  const byBrand: Record<string, Product[]> = {};
  for (const p of products) {
    (byBrand[p.brand] = byBrand[p.brand] ?? []).push(p);
  }

  const brandSection = Object.entries(byBrand)
    .map(([brand, items]) => {
      const lines = items
        .map((p) => `- [${p.brand} ${p.name}](${SITE}/products/${p.slug}): ₹${p.price.toLocaleString('en-IN')}${p.category ? ` — ${p.category}` : ''}`)
        .join('\n');
      return `### ${brand}  (${items.length} product${items.length !== 1 ? 's' : ''})\n${lines}`;
    })
    .join('\n\n');

  // Upcoming drops (next 90 days)
  const now = Date.now();
  const upcomingDrops = drops
    .filter((d) => new Date(d.releaseDate).getTime() >= now)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
    .slice(0, 20);

  const dropLines = upcomingDrops
    .map((d) => {
      const date = new Date(d.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const price = d.retailPrice ? ` · ₹${d.retailPrice.toLocaleString('en-IN')}` : '';
      const where = d.where ? ` · ${d.where}` : '';
      return `- [${d.name}](${SITE}/drops/${d.slug}): ${d.brand} · ${date}${price}${where}`;
    })
    .join('\n');

  // Sneaker guide
  const profileLines = profiles
    .map((p) => {
      const meta = [p.releaseYear, p.designer].filter(Boolean).join(' · ');
      return `- [${p.name}](${SITE}/sneakers/${p.slug}): ${p.brand}${meta ? ` · ${meta}` : ''}${p.tagline ? ` — ${p.tagline}` : ''}`;
    })
    .join('\n');

  // Recent blogs
  const blogLines = blogs.slice(0, 50)
    .map((b) => `- [${b.title}](${SITE}/blogs/${b.slug}): ${(b.excerpt || '').replace(/\n/g, ' ').trim()}`)
    .join('\n');

  const body = `# SNKRS CART — India's Authentic Sneaker Store

> 100% authentic Nike, Jordan, Adidas, New Balance & Crocs. Free pan-India shipping. No fakes, no replicas.
> Contact: infosnkrscart@gmail.com | Returns accepted within 7 days of delivery
> Website: ${SITE}

## Full Content Feeds (for AI indexing)

- [All Products + Sneaker Profiles](${SITE}/llms-full.txt)
- [All Blog Articles](${SITE}/llms-blogs.txt)
- [Full Drop Calendar / Release Dates](${SITE}/llms-drops.txt)

## Shop by Brand

${brandSection || '- Products loading.'}

## Upcoming Sneaker Drops

${dropLines || '- No upcoming drops listed.'}

## Sneaker Guide

${profileLines || '- Profiles loading.'}

## Recent Blog Posts

${blogLines || '- No posts yet.'}

## Key Pages

- [Shop All Sneakers](${SITE}/products)
- [Sneaker Blog](${SITE}/blogs)
- [Drop Calendar](${SITE}/drops)
- [Sneaker Guide](${SITE}/sneakers)
- [Size Guide](${SITE}/size-guide)
- [FAQs](${SITE}/faqs)
- [About SNKRS CART](${SITE}/about)
- [Shipping Info](${SITE}/shipping)
- [Returns Policy](${SITE}/returns)
- [Track Order](${SITE}/track-order)
- [RSS Feed](${SITE}/rss.xml)
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
