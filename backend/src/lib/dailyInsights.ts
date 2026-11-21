import { ScrapedProduct, SCRAPED_SITES } from '../models/ScrapedProduct';
import { ScrapedPricePoint } from '../models/ScrapedPricePoint';
import { Drop } from '../models/Drop';
import { Product } from '../models/Product';
import { attachSellerOffers } from './sellerOffers';
import { styleCode } from './styleCode';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const QUERY_TIMEOUT_MS = 15000;
const SELLER_GROUP: Record<string, string> = { tatacliqluxury: 'tatacliq' };

export const STALE_HOURS = 48;
export const INSIGHT_WINDOW_DAYS = 30;
export const MOVE_WINDOW_DAYS = 7;
export const DROP_WINDOW_DAYS = 14;
export const NEW_LIMIT = 40;
export const MOVE_LIMIT = 30;
export const PAIR_LIMIT = 50;

export interface InsightListing {
  site: string;
  brand: string;
  name: string;
  url: string;
  price: number | null;
  previousPrice: number | null;
  priceChangedAt: Date | null;
  styleCode: string;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
}

export interface SourceTotal {
  site: string;
  stored: number;
  lastSeenAt: Date | null;
}

export interface InsightDrop {
  slug: string;
  name: string;
  brand: string;
  releaseDate: Date;
  styleCode: string;
}

export interface OwnPair {
  slug: string;
  name: string;
  styleCode: string;
  priceFrom: number;
}

export interface InsightInput {
  sites: readonly string[];
  listings: InsightListing[];
  totals: SourceTotal[];
  drops: InsightDrop[];
  ownPairs: OwnPair[];
  historyPoints: number;
  historySince: Date | null;
}

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

function within(date: Date | null, now: Date, ms: number): boolean {
  return date !== null && now.getTime() - date.getTime() < ms;
}

function pct(from: number, to: number): number {
  return Math.round(((to - from) / from) * 1000) / 10;
}

function sellerOf(site: string): string {
  return SELLER_GROUP[site] ?? site;
}

function sourceHealth(input: InsightInput, now: Date): SourceHealth[] {
  const totals = new Map(input.totals.map((total) => [total.site, total]));
  const sites = [...new Set([...input.sites, ...input.totals.map((total) => total.site)])];
  return sites
    .map((site) => {
      const live = input.listings.filter((listing) => listing.site === site);
      const lastSeenAt = totals.get(site)?.lastSeenAt ?? null;
      return {
        site,
        stored: totals.get(site)?.stored ?? 0,
        live: live.length,
        seenLastDay: live.filter((listing) => within(listing.lastSeenAt, now, DAY_MS)).length,
        newLastDay: live.filter((listing) => within(listing.firstSeenAt, now, DAY_MS)).length,
        withStyleCode: live.filter((listing) => listing.styleCode).length,
        lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
        stale: !within(lastSeenAt, now, STALE_HOURS * HOUR_MS),
      };
    })
    .sort((a, b) => b.live - a.live || a.site.localeCompare(b.site));
}

function newListings(listings: InsightListing[], now: Date): DailyInsights['newListings'] {
  const week = listings.filter((listing) => within(listing.firstSeenAt, now, 7 * DAY_MS)).sort((a, b) => (b.firstSeenAt as Date).getTime() - (a.firstSeenAt as Date).getTime());
  return {
    lastDay: week.filter((listing) => within(listing.firstSeenAt, now, DAY_MS)).length,
    lastWeek: week.length,
    items: week.slice(0, NEW_LIMIT).map((listing) => ({
      site: listing.site,
      brand: listing.brand,
      name: listing.name,
      url: listing.url,
      price: listing.price,
      firstSeenAt: (listing.firstSeenAt as Date).toISOString(),
    })),
  };
}

function priceMoves(listings: InsightListing[], now: Date): DailyInsights['priceMoves'] {
  const moves: PriceMove[] = [];
  for (const listing of listings) {
    if (!listing.price || !listing.previousPrice || listing.price === listing.previousPrice) continue;
    if (!within(listing.priceChangedAt, now, MOVE_WINDOW_DAYS * DAY_MS)) continue;
    moves.push({
      site: listing.site,
      brand: listing.brand,
      name: listing.name,
      url: listing.url,
      from: listing.previousPrice,
      to: listing.price,
      changePct: pct(listing.previousPrice, listing.price),
      changedAt: (listing.priceChangedAt as Date).toISOString(),
    });
  }
  const drops = moves.filter((move) => move.changePct < 0).sort((a, b) => a.changePct - b.changePct);
  const rises = moves.filter((move) => move.changePct > 0).sort((a, b) => b.changePct - a.changePct);
  return { dropCount: drops.length, riseCount: rises.length, drops: drops.slice(0, MOVE_LIMIT), rises: rises.slice(0, MOVE_LIMIT) };
}

function storesByCode(listings: InsightListing[]): Map<string, PairStore[]> {
  const cheapest = new Map<string, Map<string, InsightListing>>();
  for (const listing of listings) {
    if (!listing.styleCode || !listing.price) continue;
    if (!cheapest.has(listing.styleCode)) cheapest.set(listing.styleCode, new Map());
    const bySite = cheapest.get(listing.styleCode) as Map<string, InsightListing>;
    const current = bySite.get(listing.site);
    if (!current || (current.price as number) > listing.price) bySite.set(listing.site, listing);
  }
  const stores = new Map<string, PairStore[]>();
  for (const [code, bySite] of cheapest) {
    stores.set(
      code,
      [...bySite.values()]
        .map((listing) => ({
          site: listing.site,
          price: listing.price as number,
          url: listing.url,
        }))
        .sort((a, b) => a.price - b.price || a.site.localeCompare(b.site)),
    );
  }
  return stores;
}

function sellerCount(stores: PairStore[]): number {
  return new Set(stores.map((store) => sellerOf(store.site))).size;
}

function samePairs(input: InsightInput, stores: Map<string, PairStore[]>): DailyInsights['samePairs'] {
  const own = new Map(input.ownPairs.map((pair) => [pair.styleCode, pair]));
  const names = new Map<string, string>();
  for (const listing of input.listings) if (listing.styleCode && !names.has(listing.styleCode)) names.set(listing.styleCode, listing.name);
  const pairs: SamePair[] = [];
  for (const [code, list] of stores) {
    const sellers = sellerCount(list);
    const ours = own.get(code) ?? null;
    if (sellers < 2 && !ours) continue;
    const lowest = list[0].price;
    const highest = list[list.length - 1].price;
    pairs.push({
      styleCode: code,
      name: ours?.name ?? names.get(code) ?? code,
      sellers,
      stores: list,
      lowest,
      highest,
      spreadPct: pct(lowest, highest),
      own: ours
        ? {
            slug: ours.slug,
            name: ours.name,
            priceFrom: ours.priceFrom,
            gapPct: pct(lowest, ours.priceFrom),
          }
        : null,
    });
  }
  pairs.sort((a, b) => Number(Boolean(b.own)) - Number(Boolean(a.own)) || b.sellers - a.sellers || b.spreadPct - a.spreadPct || a.styleCode.localeCompare(b.styleCode));
  return { total: pairs.length, items: pairs.slice(0, PAIR_LIMIT) };
}

function upcomingDrops(input: InsightInput, stores: Map<string, PairStore[]>, now: Date): UpcomingDrop[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const until = today + DROP_WINDOW_DAYS * DAY_MS;
  return input.drops
    .filter((drop) => drop.releaseDate.getTime() >= today && drop.releaseDate.getTime() <= until)
    .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime() || a.slug.localeCompare(b.slug))
    .map((drop) => ({
      slug: drop.slug,
      name: drop.name,
      brand: drop.brand,
      releaseDate: drop.releaseDate.toISOString(),
      styleCode: drop.styleCode,
      sellers: drop.styleCode ? sellerCount(stores.get(drop.styleCode) ?? []) : 0,
    }));
}

export function buildDailyInsights(input: InsightInput, now: Date): DailyInsights {
  const stores = storesByCode(input.listings.filter((listing) => within(listing.lastSeenAt, now, STALE_HOURS * HOUR_MS)));
  return {
    generatedAt: now.toISOString(),
    sources: sourceHealth(input, now),
    newListings: newListings(input.listings, now),
    priceMoves: priceMoves(input.listings, now),
    samePairs: samePairs(input, stores),
    upcomingDrops: upcomingDrops(input, stores, now),
    history: {
      points: input.historyPoints,
      since: input.historySince ? input.historySince.toISOString() : null,
    },
  };
}

async function loadOwnPairs(codes: string[]): Promise<OwnPair[]> {
  if (codes.length === 0) return [];
  const wanted = new Set(codes);
  const products = await Product.find({ sku: { $nin: [null, ''] }, comingSoon: { $ne: true } })
    .select('slug name brand colorway sku price originalPrice productType sizes availableSizes stringSizes availableStringSizes variants soldOut comingSoon')
    .maxTimeMS(QUERY_TIMEOUT_MS)
    .lean();
  const matched = products.filter((product) => wanted.has(styleCode(String(product.sku))));
  return (await attachSellerOffers(matched))
    .filter((product) => product.offers.length > 0)
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      styleCode: styleCode(String(product.sku)),
      priceFrom: Math.min(...product.offers.map((offer) => offer.price)),
    }));
}

export async function loadDailyInsights(now: Date = new Date()): Promise<DailyInsights> {
  const since = new Date(now.getTime() - INSIGHT_WINDOW_DAYS * DAY_MS);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [rows, totals, drops, historyPoints, oldest] = await Promise.all([
    ScrapedProduct.find({
      status: { $ne: 'rejected' },
      scrapedAt: { $gte: since },
    })
      .select('sourceSite brand name sourceUrl price previousPrice priceChangedAt styleCode createdAt scrapedAt')
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean(),
    ScrapedProduct.aggregate<{
      _id: string;
      stored: number;
      lastSeenAt: Date | null;
    }>([
      {
        $group: {
          _id: '$sourceSite',
          stored: { $sum: 1 },
          lastSeenAt: { $max: '$scrapedAt' },
        },
      },
    ]).option({
      maxTimeMS: QUERY_TIMEOUT_MS,
    }),
    Drop.find({
      published: true,
      releaseDate: {
        $gte: today,
        $lte: new Date(today.getTime() + DROP_WINDOW_DAYS * DAY_MS),
      },
    })
      .select('slug name brand releaseDate styleCode')
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean(),
    ScrapedPricePoint.estimatedDocumentCount(),
    ScrapedPricePoint.findOne().sort({ at: 1 }).select('at').maxTimeMS(QUERY_TIMEOUT_MS).lean(),
  ]);
  const listings: InsightListing[] = rows.map((row) => {
    const stamped = row as typeof row & { createdAt?: Date };
    return {
      site: row.sourceSite,
      brand: row.brand,
      name: row.name,
      url: row.sourceUrl,
      price: row.price ?? null,
      previousPrice: row.previousPrice ?? null,
      priceChangedAt: row.priceChangedAt ?? null,
      styleCode: row.styleCode ?? '',
      firstSeenAt: stamped.createdAt ?? null,
      lastSeenAt: row.scrapedAt ?? null,
    };
  });
  const codes = [...new Set(listings.map((listing) => listing.styleCode).filter(Boolean))];
  return buildDailyInsights(
    {
      sites: SCRAPED_SITES,
      listings,
      totals: totals.map((total) => ({
        site: total._id,
        stored: total.stored,
        lastSeenAt: total.lastSeenAt,
      })),
      drops: drops.map((drop) => ({
        slug: drop.slug,
        name: drop.name,
        brand: drop.brand,
        releaseDate: drop.releaseDate,
        styleCode: drop.styleCode ?? '',
      })),
      ownPairs: await loadOwnPairs(codes),
      historyPoints,
      historySince: oldest?.at ?? null,
    },
    now,
  );
}
