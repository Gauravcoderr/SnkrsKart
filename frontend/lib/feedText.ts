/**
 * Text and attribute helpers shared by the product feeds (Google Merchant XML, OpenAI
 * JSONL/CSV). Titles, descriptions, categories and gender/age values must read the same on
 * every feed, so both routes build them here.
 */

import type { CatalogProduct } from '@/lib/catalog';
import { fullProductName } from '@/lib/productTitle';

export type FeedProduct = Pick<
  CatalogProduct,
  | 'slug'
  | 'name'
  | 'brand'
  | 'colorway'
  | 'gender'
  | 'price'
  | 'images'
  | 'sizes'
  | 'availableSizes'
  | 'stringSizes'
  | 'availableStringSizes'
  | 'soldOut'
  | 'comingSoon'
  | 'releaseDate'
  | 'description'
  | 'sku'
  | 'productType'
  | 'offers'
>;

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

const KNOWN_BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Crocs', 'Puma', 'Asics', 'On', 'Coach', 'Converse', 'Vans', 'Reebok'];

export function canonicalBrand(raw: string): string {
  const t = (raw || '').trim();
  const lower = t.toLowerCase();
  return KNOWN_BRANDS.find((b) => lower === b.toLowerCase() || lower.startsWith(`${b.toLowerCase()} `)) ?? t;
}

export function colorParts(colorway?: string): string[] {
  return (colorway ?? '')
    .replace(/^\s*(?:and|&)\s+/i, '')
    .split(/\s*[|/]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Product descriptions are stored as HTML; the feeds want plain text (max 5000 chars). */
export function plainText(html: string): string {
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

export function genderAttr(gender: string): string {
  if (gender === 'men') return 'male';
  if (gender === 'women') return 'female';
  return 'unisex';
}

export function ageGroup(gender: string): string {
  return gender === 'kids' ? 'kids' : 'adult';
}

export function googleCategory(p: Pick<FeedProduct, 'productType'>): string {
  const type = p.productType ?? 'shoes';
  return CATEGORY_MAP[type] ?? CATEGORY_MAP.shoes;
}

export function productTypeAttr(p: Pick<FeedProduct, 'productType' | 'brand'>): string {
  const type = p.productType ?? 'shoes';
  return `${TYPE_LABEL[type] ?? TYPE_LABEL.shoes} > ${canonicalBrand(p.brand)}`;
}

/** Fallback description when the product has none. Unique per product, not boilerplate. */
function fallbackDescription(p: FeedProduct): string {
  const isShoe = (p.productType ?? 'shoes') === 'shoes';
  const who = p.gender === 'men' ? "Men's" : p.gender === 'women' ? "Women's" : 'Unisex';
  const colors = colorParts(p.colorway).join(' / ');
  const bits = [
    `${fullProductName(canonicalBrand(p.brand), p.name)}${colors ? ` in ${colors}` : ''}.`,
    `Brand new and checked for authenticity before dispatch.`,
    isShoe ? `${who} sizing (UK).` : `${who} fit.`,
    `Free shipping across India from SNKRS CART.`,
  ];
  return bits.join(' ');
}

export function description(p: FeedProduct): string {
  const plain = p.description ? plainText(p.description) : '';
  return plain.length >= 60 ? plain : fallbackDescription(p);
}

export function titleFor(p: FeedProduct, sizeSuffix: string): string {
  const base = fullProductName(canonicalBrand(p.brand), p.name);
  const colors = colorParts(p.colorway).join(' / ');
  const withColor = colors && !base.toLowerCase().includes(colors.toLowerCase()) ? `${base} - ${colors}` : base;
  return `${withColor.slice(0, 150 - sizeSuffix.length)}${sizeSuffix}`;
}
