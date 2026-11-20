import { SneakerProfile } from '../models/SneakerProfile';
import { Product } from '../models/Product';
import { ScrapedProduct } from '../models/ScrapedProduct';
import { attachSellerOffers } from './sellerOffers';

const LEADING_NOISE = new Set(['men', 'mens', 'man', 'women', 'womens', 'woman', 'wmns', 'unisex', 'originals']);
const KIDS_TOKENS = new Set(['gs', 'ps', 'td', 'kid', 'kids', 'infant', 'infants', 'toddler', 'toddlers', 'preschool', 'junior', 'youth', 'child', 'children']);
const DAY_MS = 24 * 60 * 60 * 1000;
const MARKET_QUERY_TIMEOUT_MS = 15000;
export const MARKET_CACHE_MS = 5 * 60 * 1000;
export const MARKET_RETRY_MS = 30 * 1000;
export const MARKET_SCRAPE_DAYS = 30;
export const MARKET_PAIR_LIMIT = 12;

export interface MarketPair {
  slug: string;
  name: string;
  colorway: string;
  sku: string;
  priceFrom: number;
  sizes: Array<number | string>;
}

export interface SneakerMarket {
  inrMin: number;
  inrMax: number;
  inrMedian: number;
  listings: number;
  ownCount: number;
  ownMin: number | null;
  ownMax: number | null;
  pricedAt: string | null;
  productSlugs: string[];
  pairs: MarketPair[];
}

export interface MarketProfile {
  slug: string;
  name: string;
  brand: string;
}

export interface OwnListing extends MarketPair {
  brand: string;
}

export interface ScrapedListing {
  name: string;
  brand: string;
  price: number;
  scrapedAt?: Date | string | null;
}

export interface PricedProfile {
  slug: string;
  name: string;
  brand: string;
  image: string;
  category: string;
  indiaRetailPrice: number | null;
  market: {
    inrMin: number;
    inrMax: number;
    inrMedian: number;
    listings: number;
    ownPairs: number;
    pricedAt: string | null;
  } | null;
}

type ProfileSummary = MarketProfile & {
  image?: string;
  category?: string;
  indiaRetailPrice?: number | null;
};
type MarketMap = Map<string, SneakerMarket>;

export function brandKey(brand: string): string {
  const key = brand
    .trim()
    .toLowerCase()
    .replace(/\s+brand$/, '');
  return key === 'air jordan' ? 'jordan' : key;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/(\d)\.(\d)/g, '$1p$2')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function modelTokens(name: string, brand: string): string[] {
  const key = brandKey(brand);
  const strip = new Set([...tokenize(key), ...LEADING_NOISE]);
  if (key === 'jordan') ['nike', 'air'].forEach((token) => strip.add(token));
  const tokens = tokenize(name);
  let start = 0;
  while (start < tokens.length && strip.has(tokens[start])) start++;
  return tokens.slice(start);
}

function startsWith(tokens: string[], prefix: string[]): boolean {
  return prefix.length > 0 && prefix.length <= tokens.length && prefix.every((token, index) => tokens[index] === token);
}

function median(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function adultTokensByBrand<T extends { name: string; brand: string }>(listings: T[]): Map<string, Array<{ item: T; tokens: string[] }>> {
  const byBrand = new Map<string, Array<{ item: T; tokens: string[] }>>();
  for (const item of listings) {
    const tokens = modelTokens(item.name, item.brand);
    if (tokens.some((token) => KIDS_TOKENS.has(token))) continue;
    const key = brandKey(item.brand);
    if (!byBrand.has(key)) byBrand.set(key, []);
    byBrand.get(key)!.push({ item, tokens });
  }
  return byBrand;
}

function toPair(listing: OwnListing): MarketPair {
  return {
    slug: listing.slug,
    name: listing.name,
    colorway: listing.colorway,
    sku: listing.sku,
    priceFrom: listing.priceFrom,
    sizes: listing.sizes,
  };
}

function newestScrape(scraped: ScrapedListing[]): Date | null {
  let newest: Date | null = null;
  for (const listing of scraped) {
    if (!listing.scrapedAt) continue;
    const seen = new Date(listing.scrapedAt);
    if (Number.isNaN(seen.getTime())) continue;
    if (!newest || seen > newest) newest = seen;
  }
  return newest;
}

function pricedAt(ownCount: number, scraped: ScrapedListing[], now: Date): string | null {
  if (ownCount > 0) return now.toISOString();
  const newest = newestScrape(scraped);
  return newest ? newest.toISOString() : null;
}

function marketFromListings(own: OwnListing[], scraped: ScrapedListing[], now: Date): SneakerMarket | null {
  const buyable = own.filter((listing) => listing.priceFrom > 0).sort((a, b) => a.priceFrom - b.priceFrom);
  const prices = [...buyable.map((listing) => listing.priceFrom), ...scraped.map((listing) => listing.price)].sort((a, b) => a - b);
  if (prices.length === 0) return null;
  const shown = buyable.slice(0, MARKET_PAIR_LIMIT);
  return {
    inrMin: Math.round(prices[0]),
    inrMax: Math.round(prices[prices.length - 1]),
    inrMedian: Math.round(median(prices)),
    listings: prices.length,
    ownCount: buyable.length,
    ownMin: buyable.length > 0 ? buyable[0].priceFrom : null,
    ownMax: buyable.length > 0 ? buyable[buyable.length - 1].priceFrom : null,
    pricedAt: pricedAt(buyable.length, scraped, now),
    productSlugs: shown.map((listing) => listing.slug),
    pairs: shown.map(toPair),
  };
}

export function buildMarkets(profiles: MarketProfile[], own: OwnListing[], scraped: ScrapedListing[], now: Date = new Date()): MarketMap {
  const ownByBrand = adultTokensByBrand(own);
  const scrapedByBrand = adultTokensByBrand(scraped);
  const targets = profiles.map((profile) => ({
    slug: profile.slug,
    brand: brandKey(profile.brand),
    tokens: modelTokens(profile.name, profile.brand),
  }));
  const markets: MarketMap = new Map();
  for (const target of targets) {
    if (target.tokens.length === 0 || target.tokens[0] === 'x') continue;
    const longerModels = targets
      .filter((other) => other.brand === target.brand && other.slug !== target.slug)
      .filter((other) => other.tokens.length > target.tokens.length && startsWith(other.tokens, target.tokens))
      .map((other) => other.tokens);
    const isThisModel = (tokens: string[]): boolean => startsWith(tokens, target.tokens) && !longerModels.some((longer) => startsWith(tokens, longer));
    const ownMatches = (ownByBrand.get(target.brand) ?? []).filter((entry) => isThisModel(entry.tokens)).map((entry) => entry.item);
    const scrapedMatches = (scrapedByBrand.get(target.brand) ?? []).filter((entry) => isThisModel(entry.tokens)).map((entry) => entry.item);
    const market = marketFromListings(ownMatches, scrapedMatches, now);
    if (market) markets.set(target.slug, market);
  }
  return markets;
}

export function pricedProfiles(profiles: ProfileSummary[], markets: MarketMap): PricedProfile[] {
  const rows: PricedProfile[] = [];
  for (const profile of profiles) {
    const market = markets.get(profile.slug) ?? null;
    const indiaRetailPrice = profile.indiaRetailPrice && profile.indiaRetailPrice > 0 ? profile.indiaRetailPrice : null;
    if (!market && !indiaRetailPrice) continue;
    rows.push({
      slug: profile.slug,
      name: profile.name,
      brand: profile.brand,
      image: profile.image ?? '',
      category: profile.category ?? '',
      indiaRetailPrice,
      market: market
        ? {
            inrMin: market.inrMin,
            inrMax: market.inrMax,
            inrMedian: market.inrMedian,
            listings: market.listings,
            ownPairs: market.ownCount,
            pricedAt: market.pricedAt,
          }
        : null,
    });
  }
  return rows;
}

async function loadMarkets(): Promise<MarketMap> {
  const since = new Date(Date.now() - MARKET_SCRAPE_DAYS * DAY_MS);
  const [profiles, products, scraped] = await Promise.all([
    SneakerProfile.find({ published: true }).select('slug name brand').maxTimeMS(MARKET_QUERY_TIMEOUT_MS).lean(),
    Product.find({
      comingSoon: { $ne: true },
      gender: { $ne: 'kids' },
      productType: { $nin: ['clothing', 'accessories'] },
    })
      .select('slug name brand colorway sku price originalPrice productType sizes availableSizes stringSizes availableStringSizes variants soldOut comingSoon')
      .maxTimeMS(MARKET_QUERY_TIMEOUT_MS)
      .lean(),
    ScrapedProduct.find({
      status: { $ne: 'rejected' },
      gender: { $ne: 'kids' },
      price: { $gt: 0 },
      scrapedAt: { $gte: since },
    })
      .select('name brand price scrapedAt')
      .maxTimeMS(MARKET_QUERY_TIMEOUT_MS)
      .lean(),
  ]);
  if (scraped.length === 0) console.warn(`[sneaker market] no scraped listings in the last ${MARKET_SCRAPE_DAYS} days; prices come from our own stock only`);
  const own = (await attachSellerOffers(products)).map((product) => ({
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    colorway: product.colorway ?? '',
    sku: product.sku ?? '',
    priceFrom: product.offers.length > 0 ? Math.min(...product.offers.map((offer) => offer.price)) : 0,
    sizes: product.offers.map((offer) => offer.size),
  }));
  const scrapedListings = scraped.map((listing) => ({
    name: listing.name,
    brand: listing.brand,
    price: listing.price as number,
    scrapedAt: listing.scrapedAt,
  }));
  return buildMarkets(profiles, own, scrapedListings);
}

export function createMarketCache(load: () => Promise<MarketMap>, clock: () => number = Date.now): () => Promise<MarketMap> {
  let lastGood: { at: number; markets: MarketMap } | null = null;
  let lastFailureAt: number | null = null;
  let inflight: Promise<MarketMap> | null = null;

  async function reload(): Promise<MarketMap> {
    try {
      const markets = await load();
      lastGood = { at: clock(), markets };
      lastFailureAt = null;
      return markets;
    } catch (err) {
      lastFailureAt = clock();
      console.error('[sneaker market] load failed', err);
      if (lastGood) return lastGood.markets;
      throw err;
    } finally {
      inflight = null;
    }
  }

  return function getCachedMarkets(): Promise<MarketMap> {
    const now = clock();
    if (lastGood && now - lastGood.at < MARKET_CACHE_MS) return Promise.resolve(lastGood.markets);
    const failedRecently = lastFailureAt !== null && now - lastFailureAt < MARKET_RETRY_MS;
    if (failedRecently && lastGood) return Promise.resolve(lastGood.markets);
    if (failedRecently) return Promise.reject(new Error('Sneaker market data is unavailable'));
    if (!inflight) inflight = reload();
    return inflight;
  };
}

export const getMarkets = createMarketCache(loadMarkets);
