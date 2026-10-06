import type { Offer } from './sellerOffers';

export type GridSort = Record<string, 1 | -1>;

export interface GridSortable {
  _id: unknown;
  soldOut?: boolean;
  comingSoon?: boolean;
  offers?: Offer[];
  price?: number;
  createdAt?: Date | string;
  reviewCount?: number;
}

export function stockRank(p: GridSortable): number {
  if (p.comingSoon) return 0;
  if (!p.soldOut && (p.offers?.length ?? 0) > 0) return 1;
  return 2;
}

function asNumber(value: unknown, missing: number): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : missing;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isNaN(t) ? missing : t;
  }
  return missing;
}

export function compareForGrid(userSort: GridSort): (a: GridSortable, b: GridSortable) => number {
  const [key, dir] = Object.entries(userSort)[0] ?? ['reviewCount', -1];
  const missing = dir === -1 ? -Infinity : Infinity;
  return (a, b) => {
    const rank = stockRank(a) - stockRank(b);
    if (rank !== 0) return rank;
    const av = asNumber((a as unknown as Record<string, unknown>)[key], missing);
    const bv = asNumber((b as unknown as Record<string, unknown>)[key], missing);
    if (av !== bv) return av < bv ? -dir : dir;
    return String(a._id) < String(b._id) ? -1 : String(a._id) > String(b._id) ? 1 : 0;
  };
}
