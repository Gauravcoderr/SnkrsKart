import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
  const bits = [
    `${p.brand} ${p.name}${p.colorway ? ` in ${p.colorway}` : ''}.`,
    `100% authentic pair, verified before dispatch.`,
    p.gender === 'men' ? "Men's sizing (UK)." : p.gender === 'women' ? "Women's sizing (UK)." : 'Unisex sizing (UK).',
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
  const id = v.size
    ? `${p.slug}-${v.isShoe ? 'uk-' : ''}${v.size.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`
    : p.slug;

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
    `<g:item_group_id>${escapeXml(p.slug)}</g:item_group_id>`,
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

/**
 * Prefer the dedicated feed endpoint (all products, full fields). Fall back to walking the
 * paginated catalogue (48 per page, card fields only) if the backend predates it.
 */
async function loadProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products/feed`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) return data.products;
    }
  } catch { /* fall through */ }

  const out: Product[] = [];
  try {
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(`${API}/products?limit=48&page=${page}`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data = await res.json();
      out.push(...(data.products || []));
      if (page >= (data.totalPages ?? 1)) break;
    }
  } catch { /* serve what we have rather than 500 */ }
  return out;
}

export const revalidate = 3600;

export async function GET() {
  const products = await loadProducts();

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
