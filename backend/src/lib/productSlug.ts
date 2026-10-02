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

export function buildProductSlug(text: string, brand?: string): string {
  const parts = toSlug(text).split('-').filter(Boolean);
  return collapseRepeats(stripBrandPrefix(collapseRepeats(parts), brand)).join('-');
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
