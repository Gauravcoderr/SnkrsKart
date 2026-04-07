import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface BlogEntry { title: string; slug: string; excerpt: string }
interface ProductEntry { name: string; brand: string; slug: string; price: number }

export async function GET() {
  const [blogsRes, productsRes] = await Promise.allSettled([
    fetch(`${API}/blogs?limit=100`, { next: { revalidate: 3600 } }),
    fetch(`${API}/products?limit=200`, { next: { revalidate: 3600 } }),
  ]);

  const blogs: BlogEntry[] = blogsRes.status === 'fulfilled' && blogsRes.value.ok
    ? await blogsRes.value.json()
    : [];

  const productsData = productsRes.status === 'fulfilled' && productsRes.value.ok
    ? await productsRes.value.json()
    : {};
  const products: ProductEntry[] = productsData.products ?? [];

  const blogLines = blogs
    .map((b) => {
      const excerpt = (b.excerpt || '').replace(/\n/g, ' ').trim();
      return `- [${b.title}](${SITE_URL}/blogs/${b.slug})${excerpt ? `: ${excerpt}` : ''}`;
    })
    .join('\n');

  const productLines = products
    .map((p) => `- [${p.brand} ${p.name}](${SITE_URL}/products/${p.slug}): ₹${p.price.toLocaleString('en-IN')}`)
    .join('\n');

  const body = `# SNKRS CART

> India's trusted sneaker store — 100% authentic Nike, Jordan, Adidas, New Balance & Crocs. Pan-India shipping, no fakes, no compromise. Contact: infosnkrscart@gmail.com

## Key Pages

- [Shop All Sneakers](${SITE_URL}/products)
- [Blog](${SITE_URL}/blogs)
- [Size Guide](${SITE_URL}/size-guide)
- [FAQs](${SITE_URL}/faqs)
- [About](${SITE_URL}/about)
- [Track Order](${SITE_URL}/track-order)
- [Shipping Info](${SITE_URL}/shipping)
- [Returns Policy](${SITE_URL}/returns)
- [RSS Feed](${SITE_URL}/rss.xml)

## Blog Posts
${blogLines || '- No posts yet.'}

## Products
${productLines || '- No products yet.'}
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
