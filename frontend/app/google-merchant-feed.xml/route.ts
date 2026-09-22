import { NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

// Google product taxonomy paths (must be real taxonomy nodes)
const CATEGORY_MAP: Record<string, string> = {
  shoes: 'Apparel & Accessories > Shoes',
  clothing: 'Apparel & Accessories > Clothing',
  accessories: 'Apparel & Accessories',
};

const TYPE_LABEL: Record<string, string> = {
  shoes: 'Sneakers',
  clothing: 'Clothing',
  accessories: 'Accessories',
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
  sizes?: number[];
  availableSizes: number[];
  stringSizes?: string[];
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

/** Product descriptions are stored as HTML; the feed wants plain text (max 5000 chars). */
function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

/**
 * Google caps `g:id` and `g:item_group_id` at 50 chars. Slugs run to ~100. Keep as much of
 * the readable slug as fits, then a stable 6-char hash of the FULL slug so two long slugs
 * with the same prefix never collide. Short slugs pass through untouched.
 */
function slugHash(slug: string): string {
  let h = 2166136261; // FNV-1a 32-bit
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36).padStart(6, '0').slice(-6);
}

function fitId(slug: string, suffix = ''): string {
  const MAX = 50;
  if (slug.length + suffix.length <= MAX) return `${slug}${suffix}`;
  const hash = slugHash(slug);
  const keep = MAX - suffix.length - hash.length - 1;
  return `${slug.slice(0, keep).replace(/-+$/, '')}-${hash}${suffix}`;
}

function genderAttr(gender: string): string {
  if (gender === 'men') return 'male';
  if (gender === 'women') return 'female';
  return 'unisex';
}

function ageGroup(gender: string): string {
  return gender === 'kids' ? 'kids' : 'adult';
}

function googleCategory(p: Product): string {
  const type = p.productType ?? 'shoes';
  return CATEGORY_MAP[type] ?? CATEGORY_MAP.shoes;
}

function productTypeAttr(p: Product): string {
  const type = p.productType ?? 'shoes';
  return `${TYPE_LABEL[type] ?? TYPE_LABEL.shoes} > ${p.brand}`;
}

/** Fallback description when the product has none. Unique per product, not boilerplate. */
function fallbackDescription(p: Product): string {
  const isShoe = (p.productType ?? 'shoes') === 'shoes';
  const who = p.gender === 'men' ? "Men's" : p.gender === 'women' ? "Women's" : 'Unisex';
  const bits = [
    `${p.brand} ${p.name}${p.colorway ? ` in ${p.colorway}` : ''}.`,
    `100% authentic, verified before dispatch.`,
    isShoe ? `${who} sizing (UK).` : `${who} fit.`,
    `Free pan-India shipping from SNKRS CART.`,
  ];
  return bits.join(' ');
}

interface Variant {
  /** Size label as shown to the buyer; undefined → single un-sized item */
  size?: string;
  /** true when this exact size can be bought right now */
  inStock: boolean;
  /** shoes carry UK sizing; apparel uses free-form S/M/L */
  isShoe: boolean;
}

function variants(p: Product): Variant[] {
  const isShoe = (p.productType ?? 'shoes') === 'shoes';
  const all: string[] = isShoe
    ? (p.sizes?.length ? p.sizes : p.availableSizes).map(String)
    : (p.stringSizes?.length ? p.stringSizes : p.availableStringSizes ?? []);
  const avail = new Set(
    (isShoe ? p.availableSizes.map(String) : p.availableStringSizes ?? []),
  );
  if (all.length === 0) return [{ inStock: false, isShoe }];
  return all.map((size) => ({ size, inStock: avail.has(size), isShoe }));
}

function availability(p: Product, v: Variant): string {
  if (p.comingSoon) return 'preorder';
  if (p.soldOut || !v.inStock) return 'out of stock';
  return 'in stock';
}

function variantEntry(p: Product, v: Variant): string {
  const url = `${SITE_URL}/products/${p.slug}`;
  const image = p.images?.[0] || '';
  const extraImages = (p.images ?? []).slice(1, 11);

  // g:price = actual selling price. Permanent markdowns are NOT sale_price (Google rejects
  // sale prices that never end), so originalPrice is intentionally not emitted.
  const sellingPrice = `${p.price.toFixed(2)} INR`;

  const sizeSuffix = v.size ? (v.isShoe ? ` - UK ${v.size}` : ` - ${v.size}`) : '';
  const title = escapeXml(`${p.brand} ${p.name}${p.colorway ? ` - ${p.colorway}` : ''}${sizeSuffix}`);
  const desc = escapeXml(p.description ? plainText(p.description) || fallbackDescription(p) : fallbackDescription(p));

  const av = availability(p, v);
  const sizeKey = v.size ? `-${v.isShoe ? 'uk-' : ''}${v.size.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}` : '';
  const id = fitId(p.slug, sizeKey);
  const groupId = fitId(p.slug);

  const lines = [
    `<g:id>${escapeXml(id)}</g:id>`,
    `<title>${title}</title>`,
    `<description>${desc}</description>`,
    `<link>${escapeXml(url)}</link>`,
    `<g:image_link>${escapeXml(image)}</g:image_link>`,
    ...extraImages.map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`),
    `<g:availability>${av}</g:availability>`,
    av === 'preorder' && p.releaseDate ? `<g:availability_date>${escapeXml(p.releaseDate)}</g:availability_date>` : '',
    `<g:price>${sellingPrice}</g:price>`,
    `<g:brand>${escapeXml(p.brand)}</g:brand>`,
    `<g:condition>new</g:condition>`,
    `<g:google_product_category>${escapeXml(googleCategory(p))}</g:google_product_category>`,
    `<g:product_type>${escapeXml(productTypeAttr(p))}</g:product_type>`,
    `<g:gender>${escapeXml(genderAttr(p.gender))}</g:gender>`,
    `<g:age_group>${ageGroup(p.gender)}</g:age_group>`,
    `<g:item_group_id>${escapeXml(groupId)}</g:item_group_id>`,
    p.colorway ? `<g:color>${escapeXml(p.colorway)}</g:color>` : '',
    v.size ? `<g:size>${escapeXml(v.size)}</g:size>` : '',
    v.size && v.isShoe ? `<g:size_system>UK</g:size_system>` : '',
    // Style code (e.g. FD4810-010) is the manufacturer part number. No GTINs on file.
    p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : '',
    `<g:identifier_exists>${p.sku ? 'yes' : 'no'}</g:identifier_exists>`,
    `<g:shipping><g:country>IN</g:country><g:service>Standard</g:service><g:price>0 INR</g:price></g:shipping>`,
    `<g:shipping_label>Free Shipping</g:shipping_label>`,
  ].filter(Boolean);

  return `<item>\n      ${lines.join('\n      ')}\n    </item>`;
}

function productEntries(p: Product): string[] {
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
