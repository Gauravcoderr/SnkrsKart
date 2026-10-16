import { NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/catalog';
import { fullProductName } from '@/lib/productTitle';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';

function linkText(text: string): string {
  return text.replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim();
}

function link(text: string, url: string, note?: string): string {
  return `- [${linkText(text)}](${url})${note ? `: ${note}` : ''}`;
}

export async function GET() {
  const lines: string[] = [
    `# SNKRS CART`,
    ``,
    `> India-based marketplace for 100% authentic sneakers and streetwear from Nike, Jordan (Air Jordan), Adidas, New Balance and Crocs. Prices in INR, UK sizes, free shipping on every order across India.`,
    ``,
    `Preferred brand name: SNKRS CART. Audience: Indian sneakerheads, collectors and streetwear buyers. Headquarters: India. Generated ${new Date().toISOString()}.`,
    ``,
    `## Store policies`,
    `- Shipping: Free on every order across India. Dispatch within 3 business days (Pre-order sizes about 20 days), delivery in 3–7 business days after dispatch`,
    `- Returns: Only for damaged, wrong or authenticity issues reported within 48 hours of delivery (replacement or full refund). No returns for change of mind or size`,
    `- Payment: UPI, debit/credit cards, net banking (online at checkout). No cash on delivery.`,
    `- Authentication: Every pair verified authentic before dispatch`,
    `- Contact: [info@snkrscart.com](mailto:info@snkrscart.com), +91-94109-03791`,
    link('Shipping policy', `${SITE_URL}/shipping`),
    link('Returns policy', `${SITE_URL}/returns`),
    link('FAQs', `${SITE_URL}/faqs`),
    ``,
    `## For AI agents`,
    link('MCP server', `${SITE_URL}/mcp`, 'read-only tools to search products, get a product, build a cart link, list upcoming drops and read store policies'),
    link('Agent guide', `${SITE_URL}/agents.md`),
    link('OpenAPI schema', `${SITE_URL}/chatgpt-action-schema.yaml`),
    link('Full content for LLMs', `${SITE_URL}/llms-full.txt`),
    `- Cart link format: \`${SITE_URL}/cart/add?items=<product-slug>:<uk-size>[,<slug>:<size>]\` (buyer checks out and pays on snkrscart.com)`,
    ``,
    `## Key pages`,
    link('All products', `${SITE_URL}/products`),
    link('Nike', `${SITE_URL}/brands/nike`),
    link('Jordan', `${SITE_URL}/brands/jordan`),
    link('Adidas', `${SITE_URL}/brands/adidas`),
    link('New Balance', `${SITE_URL}/brands/new-balance`),
    link('Crocs', `${SITE_URL}/brands/crocs`),
    link('Blog', `${SITE_URL}/blogs`),
    link('Drop calendar', `${SITE_URL}/drops`),
    link('Sneaker guide', `${SITE_URL}/sneakers`),
    link('Size guide', `${SITE_URL}/size-guide`),
    link('Sell your sneakers', `${SITE_URL}/sell`),
    ``,
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
      lines.push(`## Products`);
      lines.push(`${products.length} products. Prices in INR, sizes in UK.`);
      lines.push(``);
      for (const p of products) {
        const sizeList: string[] = p.availableSizes ?? p.sizes ?? [];
        const inStock = !p.soldOut && sizeList.length > 0;
        const facts = [
          `₹${p.price.toLocaleString('en-IN')} INR${p.originalPrice && p.originalPrice > p.price ? ` (was ₹${p.originalPrice.toLocaleString('en-IN')})` : ''}`,
          inStock ? 'In stock' : 'Out of stock',
        ];
        if (sizeList.length) facts.push(`UK sizes ${sizeList.join(', ')}`);
        if (p.colorway) facts.push(`colorway ${p.colorway}`);
        if (p.gender) facts.push(p.gender);
        if (p.category) facts.push(p.category);
        if (p.rating) facts.push(`rated ${p.rating}/5 (${p.reviewCount ?? 0} reviews)`);
        lines.push(link(fullProductName(p.brand, p.name), `${SITE_URL}/products/${p.slug}`, facts.join('; ')));
      }
      lines.push(``);
    }

    if (blogsRes.status === 'fulfilled' && blogsRes.value.ok) {
      const data = await blogsRes.value.json();
      const blogs: any[] = data.blogs ?? data ?? [];
      if (blogs.length > 0) {
        lines.push(`## Blog posts`);
        for (const b of blogs) {
          lines.push(link(b.title, `${SITE_URL}/blogs/${b.slug}`, b.excerpt ? linkText(b.excerpt) : undefined));
        }
        lines.push(``);
      }
    }
  } catch {
    clearTimeout(timeout);
    lines.push(`Product data is temporarily unavailable. See [all products](${SITE_URL}/products) for live inventory.`);
    lines.push(``);
  }

  lines.push(`## FAQs`);
  lines.push(`- Are all sneakers 100% authentic? Yes. Every pair is verified authentic before dispatch. No fakes, ever.`);
  lines.push(`- Do you ship across India? Yes, free on every order. Dispatch within 3 business days, delivery in 3–7 business days after dispatch.`);
  lines.push(`- What is the return policy? Cancel free before dispatch. After delivery, returns only for damaged, wrong or authenticity issues reported within 48 hours (replacement or full refund).`);
  lines.push(`- What payment methods do you accept? UPI, debit/credit cards, net banking and other online methods, paid at checkout. No cash on delivery.`);
  lines.push(`- How do I track my order? Tracking number sent via WhatsApp and email after dispatch.`);
  lines.push(`- Do you sell refurbished or replica sneakers? No. Only 100% new, authentic sneakers from verified sources.`);
  lines.push(`- What sizes are available? UK sizes. Check individual product pages for exact sizes in stock.`);
  lines.push(``);

  lines.push(`## Optional`);
  lines.push(link('Sitemap', `${SITE_URL}/sitemap.xml`));
  lines.push(link('RSS feed', `${SITE_URL}/rss.xml`));
  lines.push(link('Google Shopping feed', `${SITE_URL}/google-merchant-feed.xml`));
  lines.push(link('Instagram', 'https://www.instagram.com/snkrs_cart'));
  lines.push(link('Twitter/X', 'https://twitter.com/snkrs_cart'));
  lines.push(``);

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
