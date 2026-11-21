export interface SourceHealth {
  site: string;
  stored: number;
  live: number;
  seenLastDay: number;
  newLastDay: number;
  withStyleCode: number;
  lastSeenAt: string | null;
  stale: boolean;
}

export interface NewListing {
  site: string;
  brand: string;
  name: string;
  url: string;
  price: number | null;
  firstSeenAt: string;
}

export interface PriceMove {
  site: string;
  brand: string;
  name: string;
  url: string;
  from: number;
  to: number;
  changePct: number;
  changedAt: string;
}

export interface PairStore {
  site: string;
  price: number;
  url: string;
}

export interface SamePair {
  styleCode: string;
  name: string;
  sellers: number;
  stores: PairStore[];
  lowest: number;
  highest: number;
  spreadPct: number;
  own: { slug: string; name: string; priceFrom: number; gapPct: number } | null;
}

export interface UpcomingDrop {
  slug: string;
  name: string;
  brand: string;
  releaseDate: string;
  styleCode: string;
  sellers: number;
}

export interface DailyInsights {
  generatedAt: string;
  sources: SourceHealth[];
  newListings: { lastDay: number; lastWeek: number; items: NewListing[] };
  priceMoves: { dropCount: number; riseCount: number; drops: PriceMove[]; rises: PriceMove[] };
  samePairs: { total: number; items: SamePair[] };
  upcomingDrops: UpcomingDrop[];
  history: { points: number; since: string | null };
}

const STORE_LABELS: Record<string, string> = {
  ajio: 'Ajio',
  footlocker: 'Foot Locker',
  limitededt: 'Limited Edt',
  myntra: 'Myntra',
  nike: 'Nike India',
  superkicks: 'Superkicks',
  tatacliq: 'Tata CLiQ',
  tatacliqluxury: 'Tata CLiQ Luxury',
  vegnonveg: 'VegNonVeg',
};

export const CELL = 'px-4 py-3';
export const HEAD = 'px-4 py-3 font-medium';
export const STORE_LINK = 'inline-block py-0.5 text-zinc-300 underline decoration-zinc-700 underline-offset-2 hover:text-white';
export const NAME_LINK = 'inline-block py-0.5 font-medium text-white hover:underline';
export const ACTION_BUTTON = 'text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function storeLabel(site: string): string {
  return STORE_LABELS[site] ?? site;
}

export function ageLabel(iso: string | null, now: Date): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'never';
  const gap = now.getTime() - then;
  if (gap < MINUTE_MS) return 'just now';
  if (gap < HOUR_MS) return `${Math.floor(gap / MINUTE_MS)}m ago`;
  if (gap < DAY_MS) return `${Math.floor(gap / HOUR_MS)}h ago`;
  return `${Math.floor(gap / DAY_MS)}d ago`;
}

export function signedPct(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`;
}

export function ownPriceNote(gapPct: number): string {
  if (gapPct > 0) return `${gapPct}% above the lowest store`;
  if (gapPct < 0) return `${Math.abs(gapPct)}% below the lowest store`;
  return 'same as the lowest store';
}

export function safeHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : '#';
}

export function dayText(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function dropStoresLabel(drop: Pick<UpcomingDrop, 'styleCode' | 'sellers'>, noLivePrices: boolean): string {
  if (!drop.styleCode) return 'needs a style code';
  if (noLivePrices) return 'no store seen in 48 hours';
  return String(drop.sellers);
}
