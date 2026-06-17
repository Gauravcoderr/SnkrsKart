import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Google product taxonomy IDs
const CATEGORY_MAP: Record<string, string> = {
  shoes: 'Apparel & Accessories > Shoes > Athletic Shoes',
  clothing: 'Apparel & Accessories > Clothing',
  accessories: 'Apparel & Accessories',
};

interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  colorway?: string;
  gender: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  availableSizes: number[];
  availableStringSizes?: string[];
  soldOut: boolean;
  comingSoon: boolean;
  releaseDate?: string;
  description?: string;
  category?: string;
  sku?: string;
  productType?: string;
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function genderAttr(gender: string): string {
  if (gender === 'men') return 'male';
  if (gender === 'women') return 'female';
  return 'unisex';
}

function availability(p: Product): string {
  if (p.comingSoon) return 'preorder';
  const hasStock = p.productType !== 'shoes'
    ? (p.availableStringSizes?.length ?? 0) > 0
    : p.availableSizes.length > 0;
  if (p.soldOut || !hasStock) return 'out of stock';
  return 'in stock';
}

function googleCategory(p: Product): string {
  const type = p.productType ?? 'shoes';
  return CATEGORY_MAP[type] ?? CATEGORY_MAP.shoes;
}

function productEntry(p: Product): string {
  const url = `${SITE_URL}/products/${p.slug}`;
  const image = p.images?.[0] || '';

  // g:price = actual selling price (what customer pays)
  // g:sale_price only for time-limited promos — not used for permanent markdowns
  const sellingPrice = `${p.price.toFixed(2)} INR`;

  const title = escapeXml(`${p.brand} ${p.name}${p.colorway ? ` - ${p.colorway}` : ''}`);
  const desc = escapeXml(
    p.description ||
    `${p.brand} ${p.name} — 100% authentic, available in India. Shop now at SNKRS CART.`
  );

  const av = availability(p);

  return `
  <item>
    <g:id>${escapeXml(p.slug)}</g:id>
    <title>${title}</title>
    <description>${desc}</description>
    <link>${escapeXml(url)}</link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>${av}</g:availability>
    ${av === 'preorder' && p.releaseDate ? `<g:availability_date>${escapeXml(p.releaseDate)}</g:availability_date>` : ''}
    <g:price>${sellingPrice}</g:price>
    <g:brand>${escapeXml(p.brand)}</g:brand>
    <g:condition>new</g:condition>
    <g:google_product_category>${escapeXml(googleCategory(p))}</g:google_product_category>
    <g:gender>${escapeXml(genderAttr(p.gender))}</g:gender>
    <g:item_group_id>${escapeXml(p.slug)}</g:item_group_id>
    ${p.colorway ? `<g:color>${escapeXml(p.colorway)}</g:color>` : ''}
    ${p.productType === 'shoes' && p.availableSizes.length > 0
      ? p.availableSizes.map((s) => `<g:size>${s}</g:size>`).join('\n    ')
      : p.productType !== 'shoes' && (p.availableStringSizes?.length ?? 0) > 0
        ? p.availableStringSizes!.map((s) => `<g:size>${escapeXml(s)}</g:size>`).join('\n    ')
        : ''}
    ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ''}
    <g:identifier_exists>${p.sku ? 'yes' : 'no'}</g:identifier_exists>
    <g:shipping>
      <g:country>IN</g:country>
      <g:service>Standard</g:service>
      <g:price>0 INR</g:price>
    </g:shipping>
    <g:shipping_label>Free Shipping</g:shipping_label>
  </item>`.trim();
}

export const revalidate = 3600;

export async function GET() {
  let products: Product[] = [];

  try {
    const res = await fetch(`${API}/products?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      products = data.products || [];
    }
  } catch {
    // serve empty feed on error rather than 500
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SNKRS CART — Sneakers &amp; Streetwear India</title>
    <link>${SITE_URL}</link>
    <description>Premium authentic sneakers, clothing &amp; accessories — Nike, Jordan, Adidas, New Balance, Crocs — delivered across India.</description>
    ${products.map(productEntry).join('\n    ')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
