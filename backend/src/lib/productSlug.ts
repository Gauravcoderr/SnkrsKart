import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { Restock } from '../models/Restock';
import { DealVerification } from '../models/DealVerification';
import { Inquiry } from '../models/Inquiry';
import { Drop } from '../models/Drop';
import { Order } from '../models/Order';

export function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const URL_RE = /^(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s?#]*)?(?:[?#]\S*)?$/i;
const TLD_TOKENS = new Set(['com', 'in', 'net', 'org', 'co', 'io', 'shop', 'store']);
const PATH_TOKENS = new Set(['products', 'product', 'p', 'collections', 'collection', 'item', 'items', 'shop']);

function lastPathSegment(text: string): string {
  const trimmed = text.trim();
  if (!/^\S+$/.test(trimmed) || !URL_RE.test(trimmed)) return text;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const segments = url.pathname.split('/').map((s) => decodeURIComponent(s)).filter(Boolean);
    return segments.length ? segments[segments.length - 1] : '';
  } catch {
    return text;
  }
}

function stripUrlTokens(parts: string[]): string[] {
  let out = parts;
  if (out[0] === 'www') out = out.slice(1);
  const tld = out.slice(0, 3).findIndex((p, i) => TLD_TOKENS.has(p) && PATH_TOKENS.has(out[i + 1] ?? ''));
  if (tld !== -1) out = out.slice(tld + 2);
  return out;
}

function isStyleCode(tok: string): boolean {
  return /^[a-z]{2}[0-9]{4}$/.test(tok) || /^[0-9]{6}$/.test(tok) || /^[0-9]{4}[a-z][0-9]{3}$/.test(tok);
}

function stripStyleCode(parts: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (isStyleCode(parts[i])) {
      if (/^[0-9]{3}$/.test(parts[i + 1] ?? '')) i++;
      continue;
    }
    out.push(parts[i]);
  }
  return out.length >= 2 ? out : parts;
}

function stripSku(parts: string[], sku?: string): string[] {
  if (!sku || !/\d/.test(sku)) return parts;
  const s = toSlug(sku).split('-').filter(Boolean);
  if (!s.length || parts.length - s.length < 2) return parts;
  const tail = parts.slice(parts.length - s.length);
  return s.every((w, k) => tail[k] === w) ? parts.slice(0, parts.length - s.length) : parts;
}

function sameRun(parts: string[], a: number, b: number, n: number): boolean {
  for (let k = 0; k < n; k++) if (parts[a + k] !== parts[b + k]) return false;
  return true;
}

function collapseRepeats(parts: string[]): string[] {
  const out = [...parts];
  let changed = true;
  while (changed) {
    changed = false;
    for (let n = Math.floor(out.length / 2); n >= 1; n--) {
      for (let i = 0; i + 2 * n <= out.length; i++) {
        if (sameRun(out, i, i + n, n)) {
          out.splice(i + n, n);
          changed = true;
        }
      }
    }
  }
  return out;
}

function containsRun(parts: string[], run: string[], from: number, window: number): boolean {
  for (let i = from; i <= from + window && i + run.length <= parts.length; i++) {
    if (run.every((w, k) => parts[i + k] === w)) return true;
  }
  return false;
}

function stripBrandPrefix(parts: string[], brand?: string): string[] {
  if (!brand) return parts;
  const b = toSlug(brand).split('-').filter(Boolean);
  if (!b.length || parts.length <= b.length) return parts;
  if (!b.every((w, k) => parts[k] === w)) return parts;
  return containsRun(parts, b, b.length, 4) ? parts.slice(b.length) : parts;
}

export function buildProductSlug(text: string, brand?: string, sku?: string): string {
  const parts = stripUrlTokens(toSlug(lastPathSegment(text)).split('-').filter(Boolean));
  const cleaned = stripStyleCode(stripSku(parts, sku));
  return collapseRepeats(stripBrandPrefix(collapseRepeats(cleaned), brand)).join('-');
}

export async function cascadeProductSlug(oldSlug: string, newSlug: string): Promise<void> {
  if (!oldSlug || oldSlug === newSlug) return;
  await Promise.all([
    Review.updateMany({ productSlug: oldSlug }, { $set: { productSlug: newSlug } }),
    Restock.updateMany({ productSlug: oldSlug }, { $set: { productSlug: newSlug } }).catch(() => undefined),
    DealVerification.updateMany({ productSlug: oldSlug }, { $set: { productSlug: newSlug } }),
    Inquiry.updateMany({ productSlug: oldSlug }, { $set: { productSlug: newSlug } }),
    Drop.updateMany({ productSlug: oldSlug }, { $set: { productSlug: newSlug } }),
    Order.updateMany(
      { 'items.slug': oldSlug },
      { $set: { 'items.$[it].slug': newSlug } },
      { arrayFilters: [{ 'it.slug': oldSlug }] },
    ),
    Product.updateOne(
      { slug: newSlug },
      { $addToSet: { previousSlugs: oldSlug } },
    ),
  ]);
  await Product.updateOne({ slug: newSlug }, { $pull: { previousSlugs: newSlug } });
}
