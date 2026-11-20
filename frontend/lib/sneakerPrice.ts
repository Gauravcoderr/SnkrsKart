import type { SneakerPriceRow, SneakerProfile } from '@/types';

type PriceFormatter = (amount: number) => string;
type Market = NonNullable<SneakerProfile['market']>;
type PriceFields = Pick<SneakerProfile, 'name' | 'indiaRetailPrice' | 'market'>;
type OfferFields = Pick<SneakerProfile, 'name' | 'brand' | 'image' | 'tagline' | 'market'>;

const MEDIAN_MIN_LISTINGS = 3;
const OWN_OFFER_MIN_PAIRS = 2;

export function indiaRetailPrice(profile: Pick<SneakerProfile, 'indiaRetailPrice'>): number | null {
  return profile.indiaRetailPrice && profile.indiaRetailPrice > 0 ? profile.indiaRetailPrice : null;
}

export function hasIndiaPrice(profile: Pick<SneakerProfile, 'indiaRetailPrice' | 'market'>): boolean {
  return Boolean(profile.market) || indiaRetailPrice(profile) !== null;
}

export function marketRange(market: { inrMin: number; inrMax: number }, formatPrice: PriceFormatter): string {
  if (market.inrMin === market.inrMax) return formatPrice(market.inrMin);
  return `${formatPrice(market.inrMin)} to ${formatPrice(market.inrMax)}`;
}

export function listingCount(listings: number): string {
  return listings === 1 ? '1 listing' : `${listings} listings`;
}

export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(date);
}

export function priceDate(market: { pricedAt?: string | null } | null | undefined, now: Date): Date {
  if (!market || !market.pricedAt) return now;
  const priced = new Date(market.pricedAt);
  return Number.isNaN(priced.getTime()) ? now : priced;
}

export function ownPairCount(market: Pick<Market, 'ownCount' | 'pairs'> | null | undefined): number {
  if (!market) return 0;
  if (typeof market.ownCount === 'number') return market.ownCount;
  return market.pairs?.length ?? 0;
}

function listedPrice(market: { inrMin: number; inrMax: number }, formatPrice: PriceFormatter): string {
  if (market.inrMin === market.inrMax) return `at ${formatPrice(market.inrMin)}`;
  return `from ${formatPrice(market.inrMin)} to ${formatPrice(market.inrMax)}`;
}

export function priceAnswer(profile: PriceFields, now: Date, formatPrice: PriceFormatter): string | null {
  const market = profile.market ?? null;
  const retail = indiaRetailPrice(profile);
  if (!market) {
    if (retail === null) return null;
    return `The official India retail price (MRP) of the ${profile.name} is ${formatPrice(retail)}.`;
  }
  const asOf = monthLabel(priceDate(market, now));
  const sentences = [`As of ${asOf}, the ${profile.name} is listed ${listedPrice(market, formatPrice)} in India across ${listingCount(market.listings)}.`];
  if (market.listings >= MEDIAN_MIN_LISTINGS && typeof market.inrMedian === 'number') {
    sentences.push(`The middle listing is ${formatPrice(market.inrMedian)}.`);
  }
  if (retail !== null) sentences.push(`The official India retail price (MRP) is ${formatPrice(retail)}.`);
  return sentences.join(' ');
}

export function modelOfferJsonLd(profile: OfferFields, url: string): Record<string, unknown> | null {
  const market = profile.market ?? null;
  if (!market) return null;
  const ownCount = ownPairCount(market);
  if (ownCount < OWN_OFFER_MIN_PAIRS) return null;
  if (typeof market.ownMin !== 'number' || typeof market.ownMax !== 'number') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: profile.name,
    brand: { '@type': 'Brand', name: profile.brand },
    ...(profile.image ? { image: profile.image } : {}),
    ...(profile.tagline ? { description: profile.tagline } : {}),
    url,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: market.ownMin,
      highPrice: market.ownMax,
      offerCount: ownCount,
      availability: 'https://schema.org/InStock',
    },
  };
}

export function sortPriceRows(rows: SneakerPriceRow[]): SneakerPriceRow[] {
  return [...rows].sort((a, b) => {
    const listingGap = (b.market?.listings ?? 0) - (a.market?.listings ?? 0);
    if (listingGap !== 0) return listingGap;
    return a.name.localeCompare(b.name);
  });
}

export function trackedCount(rows: SneakerPriceRow[]): number {
  return rows.filter((row) => row.market !== null).length;
}

export function latestPriceDate(rows: SneakerPriceRow[], now: Date): Date {
  let latest: Date | null = null;
  for (const row of rows) {
    if (!row.market || !row.market.pricedAt) continue;
    const priced = new Date(row.market.pricedAt);
    if (Number.isNaN(priced.getTime())) continue;
    if (!latest || priced > latest) latest = priced;
  }
  return latest ?? now;
}
