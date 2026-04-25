import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Google product category IDs
const BRAND_CATEGORY: Record<string, string> = {
  nike:          'Apparel & Accessories > Shoes',
  jordan:        'Apparel & Accessories > Shoes',
  adidas:        'Apparel & Accessories > Shoes',
  'new balance': 'Apparel & Accessories > Shoes',
  crocs:         'Apparel & Accessories > Shoes',
};

export const maxDuration = 60; // allow up to 60s for Render cold starts

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    let res: Response;
    try {
      res = await fetch(`${API}/products?limit=500`, { cache: 'no-store', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) return new NextResponse('Failed to fetch products', { status: 502 });

    const data = await res.json();
    const products: any[] = data.products ?? data;

    if (!Array.isArray(products) || products.length === 0) {
      return new NextResponse('No products available', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    const items = products
      .filter((p) => !p.comingSoon)
      .map((p) => {
        const inStock = !p.soldOut && (p.availableSizes ?? p.sizes ?? []).length > 0;
        const brand = (p.brand ?? '').toLowerCase();
        const googleCategory = BRAND_CATEGORY[brand] || 'Apparel & Accessories > Shoes';
        const productUrl = `${SITE_URL}/products/${p.slug}`;
        const image = (p.images ?? [])[0] ?? '';
        const title = escapeXml(`${p.brand} ${p.name}`);
        const description = escapeXml(
          p.description || `100% authentic ${p.brand} ${p.name}. Shop on SNKRS CART — pan India shipping.`
        );

        const color = escapeXml(
          (p.colorway ?? '') || (p.colors ?? []).slice(0, 3).join('/') || ''
        );
        const ageGroup = p.gender === 'kids' ? 'kids' : 'adult';
        const genderVal = p.gender === 'men' ? 'male' : p.gender === 'women' ? 'female' : 'unisex';

        return `
    <item>
      <g:id>${escapeXml(p.slug.slice(0, 50))}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      ${image ? `<g:image_link>${escapeXml(image)}</g:image_link>` : ''}
      ${(p.images ?? []).slice(1, 10).map((img: string) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${p.price}.00 INR</g:price>
      ${p.originalPrice && p.originalPrice > p.price ? `<g:sale_price>${p.price}.00 INR</g:sale_price>` : ''}
      <g:brand>${escapeXml(p.brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ''}
      <g:gender>${genderVal}</g:gender>
      <g:age_group>${ageGroup}</g:age_group>
      ${color ? `<g:color>${color}</g:color>` : ''}
      <g:size_system>US</g:size_system>
      ${(p.availableSizes ?? p.sizes ?? []).length > 0
        ? (p.availableSizes ?? p.sizes).map((s: number) => `<g:size>${s}</g:size>`).join('\n      ')
        : ''}
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>0 INR</g:price>
      </g:shipping>
    </item>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SNKRS CART</title>
    <link>${SITE_URL}</link>
    <description>100% authentic sneakers — Nike, Jordan, Adidas, New Balance &amp; Crocs. Pan India shipping.</description>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Feed error:', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
