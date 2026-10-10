import type { Offer } from '@/types';

export interface MatchableProduct {
  id?: string;
  slug: string;
  name: string;
  brand: string;
  colorway?: string;
  colors?: string[];
  price: number;
  originalPrice?: number | null;
  images: string[];
  soldOut?: boolean;
  comingSoon?: boolean;
  offers?: Offer[];
}

const STOP = new Set([
  'the', 'a', 'an', 'of', 'in', 'for', 'and', 'x', 'with', 'edition', 'retro', 'shoes', 'shoe', 'sneaker', 'sneakers',
  'men', 'mens', 'women', 'womens', 'kids', 'unisex', 'gs', 'ps', 'td', 'india', 'indian', 'price', 'buy', 'online',
]);

const COLOUR = new Set([
  'black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'beige',
  'cream', 'tan', 'navy', 'silver', 'gold', 'bronze', 'ivory', 'sail', 'bone', 'muslin', 'crimson', 'scarlet', 'teal',
  'olive', 'khaki', 'maroon', 'lavender', 'lilac', 'rose', 'light', 'dark', 'pale', 'bright', 'metallic', 'university',
  'varsity', 'summit', 'midnight', 'neutral', 'off', 'smoke', 'anthracite', 'phantom', 'photon', 'dust', 'wolf',
  'chocolate', 'coconut', 'milk', 'mango', 'fire', 'arctic', 'hemp', 'natural', 'sesame', 'cement', 'volt', 'infrared',
  'sand', 'stone', 'cloud', 'storm', 'eclipse', 'alpine', 'ocean', 'graphite', 'magic', 'dream', 'state', 'triple',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’"“”`]/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 || /^\d$/.test(t));
}

const isNumber = (t: string) => /^\d+[a-z]?$/.test(t);

export function modelTokens(p: MatchableProduct): string[] {
  const colour = new Set<string>([...COLOUR, ...tokenize(p.colorway ?? ''), ...(p.colors ?? []).flatMap(tokenize)]);
  const out: string[] = [];
  for (const t of [...tokenize(p.brand), ...tokenize(p.name)]) {
    if (STOP.has(t) || colour.has(t) || out.includes(t)) continue;
    out.push(t);
  }
  return out;
}

export function isLive(p: MatchableProduct): boolean {
  if (p.comingSoon) return false;
  if ((p.offers ?? []).some((o) => o.price > 0 && o.maxQty > 0)) return true;
  return !p.soldOut && (p.offers === undefined);
}

export function matchProducts<T extends MatchableProduct>(text: string, products: T[], limit = 3): T[] {
  const words = new Set(tokenize(text));
  const scored: { p: T; score: number }[] = [];
  for (const p of products) {
    const model = modelTokens(p);
    if (model.length < 2) continue;
    if (!model.filter(isNumber).every((d) => words.has(d))) continue;
    const brand = new Set(tokenize(p.brand));
    const hits = model.filter((t) => words.has(t));
    const ratio = hits.length / model.length;
    if (hits.length < 2 || ratio < 0.6 || !hits.some((t) => !brand.has(t))) continue;
    scored.push({ p, score: hits.length + ratio + (isLive(p) ? 0.5 : 0) });
  }
  scored.sort((a, b) => b.score - a.score || a.p.price - b.p.price);
  const best = scored[0]?.score ?? 0;
  return scored.filter((s) => s.score >= best - 0.75).slice(0, limit).map((s) => s.p);
}

export interface ReleaseRef {
  brand: string;
  name: string;
  colorway?: string;
  styleCode?: string | null;
}

const normCode = (c?: string | null) => (c ?? '').toUpperCase().replace(/\s+/g, '');

function identityTokens(p: MatchableProduct): string[] {
  const out: string[] = [];
  for (const t of [...tokenize(p.brand), ...tokenize(p.name)]) {
    if (!STOP.has(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

function colourTokens(text: string): Set<string> {
  return new Set(tokenize(text).filter((t) => !STOP.has(t)));
}

const GENERIC = new Set([
  'air', 'nike', 'jordan', 'adidas', 'originals', 'puma', 'asics', 'crocs', 'new', 'balance', 'retro', 'og', 'low', 'high',
  'mid', 'sp', 'qs', 'se', 'prm', 'premium', 'protro', 'classic', 'clog', 'gs', 'ps', 'td', 'w', 'wmns', 'pack',
]);

function containment(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  a.forEach((t) => { if (b.has(t)) inter++; });
  return inter >= 2 ? inter / Math.min(a.size, b.size) : 0;
}

function distinctiveTokens(name: string): string[] {
  return tokenize(name).filter((t) => !STOP.has(t) && !GENERIC.has(t) && !/^\d+[a-z]?$/.test(t) && t.length > 2);
}

export function matchSameProduct<T extends MatchableProduct & { sku?: string }>(release: ReleaseRef, products: T[]): T | null {
  const code = normCode(release.styleCode);
  if (code) {
    const byCode = products.find((p) => normCode(p.sku) === code);
    if (byCode) return byCode;
  }
  const words = new Set(tokenize(`${release.brand} ${release.name} ${release.colorway ?? ''}`));
  const releaseColour = colourTokens(release.colorway ?? '');
  const distinct = distinctiveTokens(release.name);
  let best: { p: T; score: number } | null = null;
  for (const p of products) {
    const identity = identityTokens(p);
    if (identity.length < 3 || !identity.every((t) => words.has(t))) continue;
    const productColour = colourTokens([p.colorway ?? '', ...(p.colors ?? [])].join(' '));
    const own = new Set([...identity, ...productColour]);
    if (distinct.length && !distinct.some((t) => own.has(t))) continue;
    let score: number;
    if (releaseColour.size >= 2 && productColour.size >= 2) {
      score = containment(releaseColour, productColour);
      if (score < 0.8) continue;
    } else {
      if (!distinct.every((t) => own.has(t))) continue;
      score = 0.8;
    }
    score += identity.length / 100 + (isLive(p) ? 0.001 : 0);
    if (!best || score > best.score) best = { p, score };
  }
  return best?.p ?? null;
}

export function mentionsProduct(text: string, p: MatchableProduct): boolean {
  const words = new Set(tokenize(text));
  const identity = identityTokens(p);
  return identity.length >= 3 && identity.every((t) => words.has(t));
}

export function lowestLivePrice(p: MatchableProduct): number {
  const live = (p.offers ?? []).filter((o) => o.price > 0 && o.maxQty > 0).map((o) => o.price);
  return live.length ? Math.min(...live) : p.price;
}
