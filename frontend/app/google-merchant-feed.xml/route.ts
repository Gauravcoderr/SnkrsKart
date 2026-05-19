import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Google product taxonomy ID for Athletic Shoes
const GOOGLE_CATEGORY = 'Apparel & Accessories > Shoes > Athletic Shoes';

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
  soldOut: boolean;
  comingSoon: boolean;
  releaseDate?: string;
  description?: string;
  category?: string;
  sku?: string;
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
  if (p.soldOut || p.availableSizes.length === 0) return 'out of stock';
  return 'in stock';
}

function productEntry(p: Product): string {
  const url = `${SITE_URL}/products/${p.slug}`;
  const image = p.images?.[0] || '';
  const price = `${p.price.toFixed(2)} INR`;
  const salePrice = p.originalPrice && p.originalPrice > p.price
    ? `${p.price.toFixed(2)} INR`
    : null;
  const listPrice = p.originalPrice && p.originalPrice > p.price
    ? `${p.originalPrice.toFixed(2)} INR`
    : null;
  const title = escapeXml(`${p.brand} ${p.name}${p.colorway ? ` - ${p.colorway}` : ''}`);
  const desc = escapeXml(p.description || `${p.brand} ${p.name} sneakers available in India. Shop now at SNKRS CART.`);

  return `
  <item>
    <g:id>${escapeXml(p.slug)}</g:id>
    <title>${title}</title>
    <description>${desc}</description>
    <link>${escapeXml(url)}</link>
    <g:image_link>${escapeXml(image)}</g:image_link>
    <g:availability>${availability(p)}</g:availability>
    <g:price>${listPrice || price}</g:price>
    ${salePrice ? `<g:sale_price>${salePrice}</g:sale_price>` : ''}
    <g:brand>${escapeXml(p.brand)}</g:brand>
    <g:condition>new</g:condition>
    <g:google_product_category>${escapeXml(GOOGLE_CATEGORY)}</g:google_product_category>
    <g:gender>${escapeXml(genderAttr(p.gender))}</g:gender>
    <g:item_group_id>${escapeXml(p.slug)}</g:item_group_id>
    ${p.colorway ? `<g:color>${escapeXml(p.colorway)}</g:color>` : ''}
    ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ''}
    ${p.sku ? `<g:identifier_exists>yes</g:identifier_exists>` : `<g:identifier_exists>no</g:identifier_exists>`}
    <g:shipping>
      <g:country>IN</g:country>
      <g:price>0 INR</g:price>
    </g:shipping>
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
    <title>SNKRS CART — Sneakers India</title>
    <link>${SITE_URL}</link>
    <description>Premium sneakers — Nike, Jordan, Adidas, New Balance, Crocs — delivered across India.</description>
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
