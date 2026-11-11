/**
 * OpenAI product feed (Businesses in ChatGPT / commerce feed spec,
 * https://developers.openai.com/commerce/specs/feed). One row per size, built from the same
 * `merchantFacts` data as the Google Merchant feed and the product page JSON-LD so the ids,
 * prices and stock states never disagree between surfaces.
 */

import {
  ageGroup,
  canonicalBrand,
  colorParts,
  description,
  genderAttr,
  googleCategory,
  titleFor,
  type FeedProduct,
} from '@/lib/feedText';
import { groupId, stockState, validMpn, variantId, variants, type StockState, type Variant } from '@/lib/merchantFacts';
import { SHIPPING_FEE_INR, SITE_URL, STORE_FACTS } from '@/lib/storeFacts';

export type OpenAIAvailability = 'in_stock' | 'out_of_stock' | 'pre_order' | 'backorder';

const AVAILABILITY: Record<StockState, OpenAIAvailability> = {
  preorder: 'pre_order',
  'out of stock': 'out_of_stock',
  backorder: 'backorder',
  'in stock': 'in_stock',
};

export interface OpenAIFeedRow {
  item_id: string;
  title: string;
  description: string;
  url: string;
  brand: string;
  seller_name: string;
  seller_url: string;
  image_url: string;
  additional_image_urls?: string[];
  availability: OpenAIAvailability;
  price: string;
  shipping_price: string;
  condition: 'new';
  product_category: string;
  gender: string;
  age_group: string;
  color?: string;
  size?: string;
  size_system?: 'UK';
  mpn?: string;
  group_id?: string;
  listing_has_variations?: boolean;
  variant_dict?: Record<string, string>;
  return_policy: string;
  is_eligible_search: boolean;
  is_eligible_checkout: boolean;
}

export const OPENAI_FEED_COLUMNS = [
  'item_id',
  'title',
  'description',
  'url',
  'brand',
  'seller_name',
  'seller_url',
  'image_url',
  'additional_image_urls',
  'availability',
  'price',
  'shipping_price',
  'condition',
  'product_category',
  'gender',
  'age_group',
  'color',
  'size',
  'size_system',
  'mpn',
  'group_id',
  'listing_has_variations',
  'variant_dict',
  'return_policy',
  'is_eligible_search',
  'is_eligible_checkout',
] as const satisfies readonly (keyof OpenAIFeedRow)[];

function money(amount: number): string {
  return `${amount.toFixed(2)} INR`;
}

export function openaiFeedRow(p: FeedProduct, v: Variant): OpenAIFeedRow {
  const sizeSuffix = v.size ? (v.isShoe ? ` - UK ${v.size}` : ` - ${v.size}`) : '';
  const extraImages = (p.images ?? []).slice(1, 11);
  const colors = colorParts(p.colorway).slice(0, 3).join('/').slice(0, 100);
  const mpn = validMpn(p.sku);
  const row: OpenAIFeedRow = {
    item_id: variantId(p.slug, v),
    title: titleFor(p, sizeSuffix),
    description: description(p),
    url: `${SITE_URL}/products/${p.slug}${v.size ? `?size=${encodeURIComponent(v.size)}` : ''}`,
    brand: canonicalBrand(p.brand),
    seller_name: STORE_FACTS.name,
    seller_url: SITE_URL,
    image_url: p.images?.[0] || '',
    availability: AVAILABILITY[stockState(p, v)],
    price: money(v.offer?.price ?? p.price),
    shipping_price: money(SHIPPING_FEE_INR),
    condition: 'new',
    product_category: googleCategory(p),
    gender: genderAttr(p.gender),
    age_group: ageGroup(p.gender),
    return_policy: STORE_FACTS.pages.returns,
    is_eligible_search: true,
    is_eligible_checkout: false,
  };
  if (extraImages.length) row.additional_image_urls = extraImages;
  if (colors) row.color = colors;
  if (mpn) row.mpn = mpn;
  if (v.size) {
    row.size = v.isShoe ? `UK ${v.size}` : v.size;
    if (v.isShoe) row.size_system = 'UK';
    row.group_id = groupId(p.slug);
    row.listing_has_variations = true;
    row.variant_dict = { size: row.size };
  }
  return row;
}

export function openaiFeedRows(products: FeedProduct[]): OpenAIFeedRow[] {
  return products.flatMap((p) => variants(p).map((v) => openaiFeedRow(p, v)));
}

export function toJsonl(rows: OpenAIFeedRow[]): string {
  return rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
}

function csvCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  let text: string;
  if (Array.isArray(value)) text = value.map((u) => String(u).replace(/,/g, '%2C')).join(',');
  else if (typeof value === 'object') text = JSON.stringify(value);
  else text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: OpenAIFeedRow[]): string {
  const lines = [OPENAI_FEED_COLUMNS.join(',')];
  for (const row of rows) lines.push(OPENAI_FEED_COLUMNS.map((c) => csvCell(row[c])).join(','));
  return lines.join('\n') + '\n';
}
