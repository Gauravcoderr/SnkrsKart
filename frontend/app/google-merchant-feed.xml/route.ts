import { NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/catalog';
import { AVAILABILITY_META } from '@/lib/availability';
import { groupId, handlingDays, stockState, validMpn, variantId, variants, type Variant } from '@/lib/merchantFacts';
import {
  ageGroup,
  canonicalBrand,
  colorParts,
  description,
  genderAttr,
  googleCategory,
  productTypeAttr,
  titleFor,
  type FeedProduct,
} from '@/lib/feedText';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function variantEntry(p: FeedProduct, v: Variant): string {
  const url = `${SITE_URL}/products/${p.slug}`;
  const image = p.images?.[0] || '';
  const extraImages = (p.images ?? []).slice(1, 11);

  // g:price = actual selling price. Permanent markdowns are NOT sale_price (Google rejects
  // sale prices that never end), so originalPrice is intentionally not emitted.
  const sellingPrice = `${(v.offer?.price ?? p.price).toFixed(2)} INR`;

  const sizeSuffix = v.size ? (v.isShoe ? ` - UK ${v.size}` : ` - ${v.size}`) : '';
  const title = escapeXml(titleFor(p, sizeSuffix));
  const desc = escapeXml(description(p));
  const brand = canonicalBrand(p.brand);
  const colors = colorParts(p.colorway).slice(0, 3).join('/').slice(0, 100);
  const mpn = validMpn(p.sku);
  const handling = handlingDays(v);

  const av = stockState(p, v);
  const id = variantId(p.slug, v);
  const group = groupId(p.slug);

  const lines = [
    `<g:id>${escapeXml(id)}</g:id>`,
    `<title>${title}</title>`,
    `<description>${desc}</description>`,
    `<link>${escapeXml(url)}</link>`,
    `<g:image_link>${escapeXml(image)}</g:image_link>`,
    ...extraImages.map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`),
    `<g:availability>${av}</g:availability>`,
    av === 'preorder' && p.releaseDate ? `<g:availability_date>${escapeXml(p.releaseDate)}</g:availability_date>` : '',
    av === 'backorder' ? `<g:availability_date>${isoDaysFromNow(AVAILABILITY_META.eta.shipDays)}</g:availability_date>` : '',
    `<g:price>${sellingPrice}</g:price>`,
    `<g:brand>${escapeXml(brand)}</g:brand>`,
    `<g:condition>new</g:condition>`,
    `<g:google_product_category>${escapeXml(googleCategory(p))}</g:google_product_category>`,
    `<g:product_type>${escapeXml(productTypeAttr(p))}</g:product_type>`,
    `<g:gender>${escapeXml(genderAttr(p.gender))}</g:gender>`,
    `<g:age_group>${ageGroup(p.gender)}</g:age_group>`,
    `<g:item_group_id>${escapeXml(group)}</g:item_group_id>`,
    colors ? `<g:color>${escapeXml(colors)}</g:color>` : '',
    v.size ? `<g:size>${escapeXml(v.size)}</g:size>` : '',
    v.size && v.isShoe ? `<g:size_system>UK</g:size_system>` : '',
    // Style code (e.g. FD4810-010) is the manufacturer part number. No GTINs on file.
    mpn ? `<g:mpn>${escapeXml(mpn)}</g:mpn>` : '',
    `<g:shipping><g:country>IN</g:country><g:service>Standard</g:service><g:price>0 INR</g:price></g:shipping>`,
    handling ? `<g:min_handling_time>${handling[0]}</g:min_handling_time>` : '',
    handling ? `<g:max_handling_time>${handling[1]}</g:max_handling_time>` : '',
  ].filter(Boolean);

  return `<item>\n      ${lines.join('\n      ')}\n    </item>`;
}

function productEntries(p: FeedProduct): string[] {
  return variants(p).map((v) => variantEntry(p, v));
}

// Not prerendered at build; fetches cache 1h via lib/catalog, response carries Cache-Control.
export const dynamic = 'force-dynamic';
// Render free tier sleeps; first fetch after idle can take 30-50s. Vercel default is 10s.
export const maxDuration = 60;

export async function GET() {
  const products = await fetchAllProducts();

  // An empty channel would make Merchant Center expire every item. Tell it to come back.
  if (products.length === 0) {
    return new NextResponse('Feed source unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' },
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SNKRS CART — Sneakers &amp; Streetwear India</title>
    <link>${SITE_URL}</link>
    <description>Premium authentic sneakers, clothing &amp; accessories — Nike, Jordan, Adidas, New Balance, Crocs — delivered across India.</description>
    ${products.flatMap(productEntries).join('\n    ')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
