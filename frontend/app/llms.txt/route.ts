import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';

export async function GET() {
  const lines: string[] = [
    `# SNKRS CART — AI Content Feed (llms.txt)`,
    `# Generated: ${new Date().toISOString()}`,
    `# Site: ${SITE_URL}`,
    `# Description: India's authentic sneaker store — Nike, Jordan, Adidas, New Balance & Crocs. Pan-India shipping.`,
    ``,
    `## Store Info`,
    `Name: SNKRS CART`,
    `URL: ${SITE_URL}`,
    `Contact: infosnkrscart@gmail.com | +91-94109-03791`,
    `Shipping: Free pan-India shipping, 3–7 business days`,
    `Returns: 2-day return window on damaged items`,
    `Payment: UPI, Bank Transfer, Cash on Delivery`,
    `Brands: Nike, Jordan (Air Jordan), Adidas, New Balance, Crocs`,
    ``,
    `## Key Pages`,
    `All Products: ${SITE_URL}/products`,
    `Nike: ${SITE_URL}/brands/nike`,
    `Jordan: ${SITE_URL}/brands/jordan`,
    `Adidas: ${SITE_URL}/brands/adidas`,
    `New Balance: ${SITE_URL}/brands/new-balance`,
    `Crocs: ${SITE_URL}/brands/crocs`,
    `Blog: ${SITE_URL}/blogs`,
    `Drop Calendar: ${SITE_URL}/drops`,
    `Sneaker Guide: ${SITE_URL}/sneakers`,
    ``,
    `## Live Product Catalog`,
  ];

  try {
    const [productsRes, blogsRes] = await Promise.allSettled([
      fetch(`${API}/products?limit=500`, { cache: 'no-store' }),
      fetch(`${API}/blogs?limit=50`, { cache: 'no-store' }),
    ]);

    if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
      const data = await productsRes.value.json();
      const products: any[] = data.products ?? data ?? [];

      lines.push(`Total Products: ${products.length}`);
      lines.push(``);

      for (const p of products) {
        const inStock = !p.soldOut && (p.availableSizes ?? p.sizes ?? []).length > 0;
        const sizes = (p.availableSizes ?? p.sizes ?? []).join(', ');
        lines.push(`### ${p.brand} ${p.name}`);
        lines.push(`URL: ${SITE_URL}/products/${p.slug}`);
        lines.push(`Price: ₹${p.price.toLocaleString('en-IN')} INR${p.originalPrice && p.originalPrice > p.price ? ` (was ₹${p.originalPrice.toLocaleString('en-IN')})` : ''}`);
        lines.push(`Brand: ${p.brand}`);
        if (p.colorway) lines.push(`Colorway: ${p.colorway}`);
        if (p.gender) lines.push(`Gender: ${p.gender}`);
        lines.push(`Availability: ${inStock ? 'In Stock' : 'Out of Stock'}`);
        if (sizes) lines.push(`Available Sizes (US): ${sizes}`);
        if (p.rating) lines.push(`Rating: ${p.rating}/5 (${p.reviewCount ?? 0} reviews)`);
        lines.push(``);
      }
    }

    if (blogsRes.status === 'fulfilled' && blogsRes.value.ok) {
      const data = await blogsRes.value.json();
      const blogs: any[] = data.blogs ?? data ?? [];
      if (blogs.length > 0) {
        lines.push(`## Blog Posts`);
        for (const b of blogs) {
          lines.push(`### ${b.title}`);
          lines.push(`URL: ${SITE_URL}/blogs/${b.slug}`);
          if (b.excerpt) lines.push(`Summary: ${b.excerpt}`);
          lines.push(``);
        }
      }
    }
  } catch { /* non-critical */ }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
