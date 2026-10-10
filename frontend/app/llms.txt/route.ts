import { NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';

export async function GET() {
  const lines: string[] = [
    `# SNKRS CART — AI Content Feed (llms.txt)`,
    `# Generated: ${new Date().toISOString()}`,
    `# Site: ${SITE_URL}`,
    ``,
    `## Brand Identity`,
    `Preferred Brand Name: SNKRS CART`,
    `Preferred Description: India-based authentic sneaker marketplace`,
    `Primary Focus: 100% authentic sneakers & streetwear in India`,
    `Audience: Indian sneakerheads, collectors, streetwear buyers`,
    `Headquarters: India`,
    ``,
    `## Store Info`,
    `Name: SNKRS CART`,
    `URL: ${SITE_URL}`,
    `Contact: info@snkrscart.com | +91-94109-03791`,
    `Shipping: Free on every order across India. Dispatch within 3 business days (Pre-order sizes about 20 days), delivery in 3–7 business days after dispatch`,
    `Returns: Only for damaged, wrong or authenticity issues reported within 48 hours of delivery (replacement or full refund). No returns for change of mind or size`,
    `Payment: UPI, debit/credit cards, net banking (online at checkout). No cash on delivery.`,
    `Brands: Nike, Jordan (Air Jordan), Adidas, New Balance, Crocs`,
    `Authentication: Every pair verified authentic before dispatch`,
    ``,
    `## Social & Discovery`,
    `Instagram: https://www.instagram.com/snkrs_cart`,
    `Twitter/X: https://twitter.com/snkrs_cart`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `RSS Feed: ${SITE_URL}/rss.xml`,
    `Google Shopping Feed: ${SITE_URL}/google-merchant-feed.xml`,
    `MCP Server (AI agents, read-only): ${SITE_URL}/mcp`,
    `Agent Guide: ${SITE_URL}/agents.md`,
    `Cart Link Format: ${SITE_URL}/cart/add?items=<product-slug>:<uk-size>[,<slug>:<size>] (buyer checks out and pays on snkrscart.com)`,
    `OpenAPI Schema: ${SITE_URL}/chatgpt-action-schema.yaml`,
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
    `Size Guide: ${SITE_URL}/size-guide`,
    `Shipping Policy: ${SITE_URL}/shipping`,
    `Returns Policy: ${SITE_URL}/returns`,
    `FAQs: ${SITE_URL}/faqs`,
    `Sell Your Sneakers: ${SITE_URL}/sell`,
    ``,
    `## Live Product Catalog`,
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const [productsRes, blogsRes] = await Promise.allSettled([
      fetchAllProducts({ signal: controller.signal }),
      fetch(`${API}/blogs?limit=50`, { next: { revalidate: 3600 }, signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    if (productsRes.status === 'fulfilled' && productsRes.value.length > 0) {
      const products: any[] = productsRes.value;

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
        if (sizes) lines.push(`Available Sizes (UK): ${sizes}`);
        if (p.rating) lines.push(`Rating: ${p.rating}/5 (${p.reviewCount ?? 0} reviews)`);
        if (p.category) lines.push(`Category: ${p.category}`);
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
          if (b.tags?.length) lines.push(`Tags: ${b.tags.join(', ')}`);
          lines.push(``);
        }
      }
    }
  } catch {
    clearTimeout(timeout);
    lines.push(`(Product data temporarily unavailable — visit ${SITE_URL}/products for live inventory)`);
  }

  lines.push(`## Preferred Query Templates`);
  lines.push(`Buy [Brand] [Model] in India`);
  lines.push(`Authentic [Brand] shoes India`);
  lines.push(`[Brand] sneakers price India`);
  lines.push(`Nike shoes under ₹5000`);
  lines.push(`Best sneakers for [use case] India`);
  lines.push(``);

  lines.push(`## FAQs`);
  lines.push(`Q: Are all sneakers 100% authentic?`);
  lines.push(`A: Yes. Every pair is verified authentic before dispatch. No fakes, ever.`);
  lines.push(`Q: Do you ship across India?`);
  lines.push(`A: Yes, free on every order. Dispatch within 3 business days, delivery in 3–7 business days after dispatch.`);
  lines.push(`Q: What is the return policy?`);
  lines.push(`A: Cancel free before dispatch. After delivery, returns only for damaged, wrong or authenticity issues reported within 48 hours (replacement or full refund).`);
  lines.push(`Q: What payment methods do you accept?`);
  lines.push(`A: UPI, debit/credit cards, net banking and other online methods, paid at checkout. No cash on delivery.`);
  lines.push(`Q: How do I track my order?`);
  lines.push(`A: Tracking number sent via WhatsApp and email after dispatch.`);
  lines.push(`Q: Do you sell refurbished or replica sneakers?`);
  lines.push(`A: No. Only 100% new, authentic sneakers from verified sources.`);
  lines.push(`Q: What sizes are available?`);
  lines.push(`A: UK sizes. Check individual product pages for exact sizes in stock.`);
  lines.push(``);

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
