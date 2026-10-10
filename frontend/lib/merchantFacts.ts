/**
 * Per-size facts shared by the Google Merchant feed, the product page JSON-LD and the MCP
 * endpoint. Google and AI shopping agents compare these surfaces; a size, price, id or
 * handling time that differs between them reads as misrepresentation, so all three build
 * from here.
 */

import { AVAILABILITY_META } from '@/lib/availability';
import type { Availability } from '@/types';

export interface VariantOffer {
  size: number | string;
  price: number;
  availability: Availability;
  listingId?: string;
}

export interface VariantSource {
  slug: string;
  productType?: string;
  sizes?: number[];
  availableSizes: number[];
  stringSizes?: string[];
  availableStringSizes?: string[];
  offers?: VariantOffer[];
}

export interface Variant<O extends VariantOffer = VariantOffer> {
  /** Size label as shown to the buyer; undefined → single un-sized item */
  size?: string;
  /** true when this exact size can be bought right now */
  inStock: boolean;
  /** shoes carry UK sizing; apparel uses free-form S/M/L */
  isShoe: boolean;
  offer?: O;
}

const STYLE_CODE = /^(?:[A-Z]{2}\d{4}-\d{3}|\d{6}-\d{2,3}|[A-Z]{2}\d{4}|\d{4}[A-Z]\d{3}-\d{3}|[MUW]\d{3,4}[A-Z]{2,4}\d?)$/i;

export const HANDLING_DAYS: Record<Availability, [number, number]> = {
  instant: [0, 1],
  inhand: [1, 3],
  eta: [15, AVAILABILITY_META.eta.shipDays],
};

/** Style code (e.g. FD4810-010) when `sku` holds one, else null. Never the slug. */
export function validMpn(sku?: string): string | null {
  const s = (sku ?? '').trim();
  return STYLE_CODE.test(s) ? s.toUpperCase() : null;
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

/** Feed `g:item_group_id` and JSON-LD `productGroupID`. */
export function groupId(slug: string): string {
  return fitId(slug);
}

/** Feed `g:id` and JSON-LD variant `sku`. */
export function variantId(slug: string, v: Pick<Variant, 'size' | 'isShoe'>): string {
  const sizeKey = v.size ? `-${v.isShoe ? 'uk-' : ''}${v.size.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}` : '';
  return fitId(slug, sizeKey);
}

export function variants<O extends VariantOffer = VariantOffer>(p: Omit<VariantSource, 'offers'> & { offers?: O[] }): Variant<O>[] {
  const isShoe = (p.productType ?? 'shoes') === 'shoes';
  const all: string[] = isShoe
    ? (p.sizes?.length ? p.sizes : p.availableSizes).map(String)
    : (p.stringSizes?.length ? p.stringSizes : p.availableStringSizes ?? []);
  const offers = new Map<string, O>((p.offers ?? []).map((o) => [String(o.size), o]));
  const avail = new Set(
    p.offers ? Array.from(offers.keys()) : (isShoe ? p.availableSizes.map(String) : p.availableStringSizes ?? []),
  );
  if (all.length === 0) return [{ inStock: false, isShoe }];
  return all.map((size) => ({ size, inStock: avail.has(size), isShoe, offer: offers.get(size) }));
}

/** Handling days for a buyable size, matching the feed's min/max_handling_time. */
export function handlingDays(v: Variant): [number, number] | null {
  return v.offer && v.inStock ? HANDLING_DAYS[v.offer.availability] : null;
}

export type StockState = 'preorder' | 'out of stock' | 'backorder' | 'in stock';

/** Feed `g:availability` value; JSON-LD maps it with SCHEMA_AVAILABILITY. */
export function stockState(p: { comingSoon: boolean; soldOut: boolean }, v: Variant): StockState {
  if (p.comingSoon) return 'preorder';
  if (p.soldOut || !v.inStock) return 'out of stock';
  if (v.offer?.availability === 'eta') return 'backorder';
  return 'in stock';
}

export const SCHEMA_AVAILABILITY: Record<StockState, string> = {
  preorder: 'https://schema.org/PreOrder',
  'out of stock': 'https://schema.org/OutOfStock',
  backorder: 'https://schema.org/BackOrder',
  'in stock': 'https://schema.org/InStock',
};
