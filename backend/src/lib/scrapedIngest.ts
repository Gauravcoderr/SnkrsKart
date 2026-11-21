import type { Types } from 'mongoose';
import { ScrapedProduct } from '../models/ScrapedProduct';
import { ScrapedPricePoint } from '../models/ScrapedPricePoint';
import type { ScrapedItem } from '../services/scraper/utils';
import { findStyleCode } from './styleCode';

const INGEST_FIELDS: Array<keyof ScrapedItem> = [
  'sourceUrl',
  'sourceSite',
  'name',
  'brand',
  'price',
  'originalPrice',
  'images',
  'sizes',
  'colorway',
  'sku',
  'variantSku',
  'description',
  'gender',
  'tags',
  'flags',
  'sourceListedAt',
  'sourceUpdatedAt',
];
const WEB_URL = /^https?:\/\//i;

export interface KnownListing {
  price?: number | null;
  scrapedAt?: Date | null;
  hasHistory: boolean;
}

export interface PricePointDraft {
  price: number;
  at: Date;
}

export interface IngestSummary {
  inserted: number;
  updated: number;
  pricePoints: number;
  errors: string[];
}

function realPrice(price?: unknown): number | null {
  const value = typeof price === 'string' && price.trim() !== '' ? Number(price) : price;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export function isWebUrl(url: unknown): boolean {
  return typeof url === 'string' && WEB_URL.test(url);
}

export function priceChange(known: KnownListing | null, price?: number | null): { previousPrice: number } | null {
  const last = realPrice(known?.price);
  const next = realPrice(price);
  return last !== null && next !== null && last !== next ? { previousPrice: last } : null;
}

export function pricePointsFor(known: KnownListing | null, price: number | null | undefined, now: Date): PricePointDraft[] {
  const last = realPrice(known?.price);
  const next = realPrice(price);
  const points: PricePointDraft[] = [];
  if (known && !known.hasHistory && last !== null && last !== next) points.push({ price: last, at: known.scrapedAt ?? now });
  if (next !== null && (!known || !known.hasHistory || last !== next)) points.push({ price: next, at: now });
  return points;
}

export function knownListing(prior: { price?: number | null; scrapedAt?: Date | null } | null, lastPointPrice: number | null): KnownListing | null {
  if (!prior) return null;
  if (lastPointPrice !== null)
    return {
      price: lastPointPrice,
      scrapedAt: prior.scrapedAt,
      hasHistory: true,
    };
  return { price: prior.price, scrapedAt: prior.scrapedAt, hasHistory: false };
}

export function listingFields(item: ScrapedItem, now: Date): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const key of INGEST_FIELDS) if (key in item) fields[key] = item[key];
  const code = findStyleCode(item.brand, [item.sku, item.variantSku, item.name, item.sourceUrl]);
  if (code) fields.styleCode = code;
  fields.scrapedAt = now;
  return fields;
}

export interface StoredListing {
  _id: Types.ObjectId;
  sourceSite: ScrapedItem['sourceSite'];
  price?: number | null;
  scrapedAt?: Date | null;
}

export interface BaselinePoint extends PricePointDraft {
  listing: Types.ObjectId;
  sourceSite: ScrapedItem['sourceSite'];
}

export function baselinePoints(stored: StoredListing[], withPoints: Set<string>, now: Date): BaselinePoint[] {
  const points: BaselinePoint[] = [];
  for (const doc of stored) {
    const price = realPrice(doc.price);
    if (price === null || withPoints.has(String(doc._id))) continue;
    points.push({ listing: doc._id, sourceSite: doc.sourceSite, price, at: doc.scrapedAt ?? now });
  }
  return points;
}

async function lastKnownPrices(items: ScrapedItem[], now: Date): Promise<{ prices: Map<string, number>; baselines: number }> {
  const stored = await ScrapedProduct.find({ sourceUrl: { $in: items.map((item) => item.sourceUrl) } })
    .select('_id sourceSite price scrapedAt')
    .lean();
  const latest = await ScrapedPricePoint.aggregate<{ _id: Types.ObjectId; price: number }>([
    { $match: { listing: { $in: stored.map((doc) => doc._id) } } },
    { $sort: { listing: 1, at: -1 } },
    { $group: { _id: '$listing', price: { $first: '$price' } } },
  ]);
  const prices = new Map(latest.map((row) => [String(row._id), row.price]));
  const baselines = baselinePoints(stored, new Set(prices.keys()), now);
  if (baselines.length > 0) {
    await ScrapedPricePoint.bulkWrite(
      baselines.map((point) => ({
        updateOne: {
          filter: { listing: point.listing, at: point.at, price: point.price },
          update: { $setOnInsert: { sourceSite: point.sourceSite } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    for (const point of baselines) prices.set(String(point.listing), point.price);
  }
  return { prices, baselines: baselines.length };
}

async function latestPointPrice(listing: Types.ObjectId): Promise<number | null> {
  const point = await ScrapedPricePoint.findOne({ listing }).sort({ at: -1 }).select('price').lean();
  return point ? point.price : null;
}

async function saveOne(item: ScrapedItem, lastPoints: Map<string, number>): Promise<{ inserted: boolean; pricePoints: number }> {
  const now = new Date();
  const fields = listingFields(item, now);
  const result = await ScrapedProduct.findOneAndUpdate({ sourceUrl: item.sourceUrl }, 'styleCode' in fields ? { $set: fields } : { $set: fields, $unset: { styleCode: 1 } }, {
    upsert: true,
    returnDocument: 'before',
    includeResultMetadata: true,
    projection: { price: 1, scrapedAt: 1 },
    lean: true,
  });
  const prior = result.value;
  const id = prior?._id ?? result.lastErrorObject?.upserted;
  if (!id) throw new Error('listing was not saved');

  let lastPointPrice: number | null = null;
  if (prior) lastPointPrice = lastPoints.get(String(prior._id)) ?? null;
  if (prior && lastPointPrice !== realPrice(prior.price)) lastPointPrice = await latestPointPrice(prior._id);
  const known = knownListing(prior, lastPointPrice);

  const change = priceChange(known, item.price);
  if (change) await ScrapedProduct.updateOne({ _id: id, price: realPrice(item.price) }, { $set: { previousPrice: change.previousPrice, priceChangedAt: now } });
  const points = pricePointsFor(known, item.price, now);
  if (points.length > 0)
    await ScrapedPricePoint.insertMany(
      points.map((point) => ({
        listing: id,
        sourceSite: item.sourceSite,
        ...point,
      })),
    );
  return { inserted: !prior, pricePoints: points.length };
}

export async function saveScrapedItems(items: ScrapedItem[]): Promise<IngestSummary> {
  const summary: IngestSummary = {
    inserted: 0,
    updated: 0,
    pricePoints: 0,
    errors: [],
  };
  const usable = items.filter((item) => isWebUrl(item.sourceUrl));
  for (const item of items) if (!isWebUrl(item.sourceUrl)) summary.errors.push(`Skipped item with a URL that is not http or https: ${String(item.name ?? 'unnamed')}`);
  if (usable.length === 0) return summary;

  const { prices: lastPoints, baselines } = await lastKnownPrices(usable, new Date());
  summary.pricePoints += baselines;
  for (const item of usable) {
    try {
      const saved = await saveOne(item, lastPoints);
      if (saved.inserted) summary.inserted++;
      else summary.updated++;
      summary.pricePoints += saved.pricePoints;
    } catch (err) {
      summary.errors.push(`${item.sourceUrl}: ${(err as Error).message}`);
    }
  }
  return summary;
}
