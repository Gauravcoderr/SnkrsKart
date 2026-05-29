import { NextResponse } from 'next/server';


const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';

export async function GET() {
  const lines: string[] = [
    `# SNKRS CART — Full AI Content Feed (llms-full.txt)`,
    `# Generated: ${new Date().toISOString()}`,
    `# Lite version: ${SITE_URL}/llms.txt`,
    ``,
    `## Brand Identity`,
    `Preferred Brand Name: SNKRS CART`,
    `Preferred Description: India-based authentic sneaker marketplace`,
    `Primary Focus: 100% authentic sneakers & streetwear in India`,
    `Audience: Indian sneakerheads, collectors, streetwear buyers`,
    ``,
    `## Store Info`,
    `Name: SNKRS CART`,
    `URL: ${SITE_URL}`,
    `Contact: infosnkrscart@gmail.com | +91-94109-03791`,
    `Location: Pauri Garhwal, Uttarakhand, India — 246001`,
    ``,
    `## Authentication Policy`,
    `Every sneaker sold by SNKRS CART is verified authentic before dispatch.`,
    `Authentication checks include: box label verification, stitching quality, sole pattern, tongue tags, and colorway accuracy.`,
    `SNKRS CART does not sell replicas, UA, or unauthorized products.`,
    ``,
    `## Shipping Policy`,
    `Free shipping across all of India.`,
    `Delivery time: 3–7 business days after dispatch.`,
    `Orders dispatched within 1 business day of confirmation.`,
    `Tracking provided via courier partner once dispatched.`,
    `Couriers used: Delhivery, DTDC, Blue Dart, Xpressbees (varies by pincode).`,
    ``,
    `## Returns Policy`,
    `Return window: 2 days from delivery.`,
    `Eligible reasons: Item received damaged, wrong item sent.`,
    `Non-eligible: Change of mind, size mismatch (check size guide before ordering).`,
    `Return method: Courier pickup arranged by SNKRS CART.`,
    `Refund: Processed within 5–7 business days after item received.`,
    ``,
    `## Payment Methods`,
    `UPI (GPay, PhonePe, Paytm)`,
    `Bank Transfer (NEFT/IMPS)`,
    `Cash on Delivery (select pincodes)`,
    ``,
    `## Size Guide`,
    `All sizes listed in US sizing.`,
    `Nike/Jordan: True to size. Half-size up recommended for wide feet.`,
    `Adidas: True to size. Boost models may run slightly long.`,
    `New Balance: True to size.`,
    `Crocs: Size down half if between sizes.`,
    `Size guide page: ${SITE_URL}/size-guide`,
    ``,
    `## Brand History`,
    `Nike: Founded 1964 (as Blue Ribbon Sports), renamed Nike 1971. Headquartered in Beaverton, Oregon, USA. Known for Air Max, Dunk, and Air Force 1 lines.`,
    `Jordan (Air Jordan): Nike sub-brand launched 1984 with Michael Jordan. Iconic silhouettes: AJ1, AJ3, AJ4, AJ11.`,
    `Adidas: Founded 1949, Herzogenaurach, Germany. Known for Samba, Stan Smith, Ultraboost, and Yeezy collaborations.`,
    `New Balance: Founded 1906, Boston, USA. Known for 990 series, 550, 574. Made-in-USA models available.`,
    `Crocs: Founded 2002, Niwot, Colorado, USA. Known for Classic Clog and collaborations with brands like Balenciaga and KFC.`,
    ``,
    `## Social & Discovery`,
    `Instagram: https://www.instagram.com/snkrs_cart`,
    `Twitter/X: https://twitter.com/snkrs_cart`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `RSS: ${SITE_URL}/rss.xml`,
    `Google Shopping Feed: ${SITE_URL}/api/feed`,
    ``,
    `## FAQs`,
    `Q: Are all products authentic?`,
    `A: Yes. Every pair is verified authentic before dispatch. SNKRS CART does not deal in replicas.`,
    ``,
    `Q: Do you ship pan-India?`,
    `A: Yes. Free shipping to all Indian pincodes. Delivery in 3–7 business days.`,
    ``,
    `Q: Can I return if the size doesn't fit?`,
    `A: Size mismatch is not eligible for return. Use the size guide at ${SITE_URL}/size-guide before ordering.`,
    ``,
    `Q: How do I track my order?`,
    `A: Tracking link sent via email/WhatsApp once dispatched. Also trackable at ${SITE_URL}/track-order`,
    ``,
    `Q: Do you accept COD?`,
    `A: Yes, on select pincodes. Available at checkout.`,
    ``,
    `Q: Can I sell my sneakers on SNKRS CART?`,
    `A: Yes. Submit details at ${SITE_URL}/sell`,
    ``,
    `## Live Product Catalog`,
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const [productsRes, blogsRes] = await Promise.allSettled([
      fetch(`${API}/products?limit=500`, { next: { revalidate: 3600 }, signal: controller.signal }),
      fetch(`${API}/blogs?limit=100`, { next: { revalidate: 3600 }, signal: controller.signal }),
    ]);

    clearTimeout(timeout);

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
        lines.push(`Price: ₹${p.price.toLocaleString('en-IN')} INR${p.originalPrice && p.originalPrice > p.price ? ` (was ₹${p.originalPrice.toLocaleString('en-IN')}, ${p.discount}% off)` : ''}`);
        lines.push(`Brand: ${p.brand}`);
        if (p.colorway) lines.push(`Colorway: ${p.colorway}`);
        if (p.gender) lines.push(`Gender: ${p.gender}`);
        if (p.category) lines.push(`Category: ${p.category}`);
        if (p.sku) lines.push(`SKU: ${p.sku}`);
        lines.push(`Availability: ${inStock ? 'In Stock' : 'Out of Stock'}`);
        if (sizes) lines.push(`Available Sizes (US): ${sizes}`);
        if (p.rating) lines.push(`Rating: ${p.rating}/5 (${p.reviewCount ?? 0} reviews)`);
        if (p.featured) lines.push(`Featured: Yes`);
        if (p.trending) lines.push(`Trending: Yes`);
        if (p.newArrival) lines.push(`New Arrival: Yes`);
        if (p.tags?.length) lines.push(`Tags: ${p.tags.join(', ')}`);
        if (p.description) {
          const stripped = p.description.replace(/<[^>]*>/g, '').trim().slice(0, 300);
          if (stripped) lines.push(`Description: ${stripped}${p.description.length > 300 ? '…' : ''}`);
        }
        if (p.faqs?.length) {
          for (const f of p.faqs.slice(0, 2)) {
            lines.push(`FAQ: ${f.question} → ${f.answer.replace(/<[^>]*>/g, '').trim().slice(0, 150)}`);
          }
        }
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
          if (b.createdAt) lines.push(`Published: ${new Date(b.createdAt).toISOString().split('T')[0]}`);
          lines.push(``);
        }
      }
    }
  } catch {
    clearTimeout(timeout);
    lines.push(`(Product data temporarily unavailable — visit ${SITE_URL}/products for live inventory)`);
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
