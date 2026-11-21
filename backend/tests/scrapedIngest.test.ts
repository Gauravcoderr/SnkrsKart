import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { Types } from 'mongoose';
import { baselinePoints, isWebUrl, KnownListing, knownListing, listingFields, priceChange, pricePointsFor } from '../src/lib/scrapedIngest';
import type { ScrapedItem } from '../src/services/scraper/utils';
import { ScrapedProduct } from '../src/models/ScrapedProduct';
import { RejectedUrl } from '../src/models/RejectedUrl';
import ingestRoutes from '../src/routes/scraperIngest';

const NOW = new Date('2026-11-21T06:00:00.000Z');
const LAST_SEEN = new Date('2026-11-20T04:00:00.000Z');

function known(price: number | null, hasHistory: boolean): KnownListing {
  return { price, scrapedAt: LAST_SEEN, hasHistory };
}

function item(overrides: Partial<ScrapedItem> = {}): ScrapedItem {
  return {
    sourceUrl: 'https://www.superkicks.in/products/jordan-air-jordan-1-low-palomino',
    sourceSite: 'superkicks',
    name: 'JORDAN | AIR JORDAN 1 LOW { PALOMINO',
    brand: 'Jordan',
    price: 8995,
    images: ['https://cdn.example/a.jpg'],
    sizes: ['UK 8'],
    ...overrides,
  };
}

test('a listing seen for the first time gets one price point', () => {
  assert.deepEqual(pricePointsFor(null, 8995, NOW), [{ price: 8995, at: NOW }]);
  assert.equal(priceChange(null, 8995), null);
});

test('an unchanged price adds no point and stamps no change', () => {
  assert.deepEqual(pricePointsFor(known(8995, true), 8995, NOW), []);
  assert.equal(priceChange(known(8995, true), 8995), null);
});

test('a changed price adds one point and remembers the old price', () => {
  assert.deepEqual(pricePointsFor(known(8995, true), 7495, NOW), [{ price: 7495, at: NOW }]);
  assert.deepEqual(priceChange(known(8995, true), 7495), {
    previousPrice: 8995,
  });
});

test('an old-shape row with no history gets a baseline point', () => {
  assert.deepEqual(pricePointsFor(known(8995, false), 8995, NOW), [{ price: 8995, at: NOW }]);
  assert.equal(priceChange(known(8995, false), 8995), null);
});

test('an old-shape row whose price moved keeps the old price as its own point', () => {
  assert.deepEqual(pricePointsFor(known(8995, false), 7495, NOW), [
    { price: 8995, at: LAST_SEEN },
    { price: 7495, at: NOW },
  ]);
  assert.deepEqual(priceChange(known(8995, false), 7495), {
    previousPrice: 8995,
  });
});

test('a missing, zero or negative price is not a price', () => {
  assert.deepEqual(pricePointsFor(known(8995, true), undefined, NOW), []);
  assert.deepEqual(pricePointsFor(null, 0, NOW), []);
  assert.deepEqual(pricePointsFor(null, -5, NOW), []);
  assert.equal(priceChange(known(8995, true), undefined), null);
  assert.equal(priceChange(known(0, true), 8995), null);
  assert.deepEqual(pricePointsFor(known(null, false), 8995, NOW), [{ price: 8995, at: NOW }]);
});

test('a price sent as text counts as that number', () => {
  assert.deepEqual(pricePointsFor(null, '8995' as unknown as number, NOW), [{ price: 8995, at: NOW }]);
  assert.deepEqual(priceChange(known(8995, true), '7495' as unknown as number), { previousPrice: 8995 });
  assert.deepEqual(pricePointsFor(null, 'free' as unknown as number, NOW), []);
  assert.deepEqual(pricePointsFor(null, '' as unknown as number, NOW), []);
});

test('a store id sent as a number does not stop the listing from saving', () => {
  const fields = listingFields(item({ sku: 469811286002 as unknown as string }), NOW);
  assert.equal(fields.sku, 469811286002);
  assert.equal('styleCode' in fields, false);
});

test('listing fields carry the scrape time and a style code found in the item', () => {
  const fields = listingFields(item({ variantSku: 'DZ5485-612-UK8' }), NOW);
  assert.equal(fields.scrapedAt, NOW);
  assert.equal(fields.styleCode, 'DZ5485-612');
  assert.equal(fields.price, 8995);
  assert.equal('previousPrice' in fields, false);
  assert.equal('priceChangedAt' in fields, false);
});

test('only scraper fields are written, whatever the caller sends', () => {
  const sent = {
    ...item(),
    styleCode: 'ZZ9999-999',
    previousPrice: 1,
    priceChangedAt: new Date('2020-01-01T00:00:00.000Z'),
    status: 'published',
    publishedProductId: 'abc',
    scrapedAt: new Date('2020-01-01T00:00:00.000Z'),
  } as ScrapedItem;
  const fields = listingFields(sent, NOW);
  assert.deepEqual(Object.keys(fields).sort(), ['brand', 'images', 'name', 'price', 'scrapedAt', 'sizes', 'sourceSite', 'sourceUrl']);
  assert.equal(fields.scrapedAt, NOW);
});

test('a code that only appears in the description is not trusted', () => {
  const fields = listingFields(item({ description: 'Also available in DZ5485-612.' }), NOW);
  assert.equal('styleCode' in fields, false);
  assert.equal(fields.description, 'Also available in DZ5485-612.');
});

test('the latest price point is the last known price, and a row without points falls back to its stored price', () => {
  assert.equal(knownListing(null, null), null);
  assert.deepEqual(knownListing({ price: 7495, scrapedAt: LAST_SEEN }, 8995), { price: 8995, scrapedAt: LAST_SEEN, hasHistory: true });
  assert.deepEqual(knownListing({ price: 7495, scrapedAt: LAST_SEEN }, null), { price: 7495, scrapedAt: LAST_SEEN, hasHistory: false });
});

test('a price written without its point is recorded on the next run', () => {
  const known = knownListing({ price: 7495, scrapedAt: LAST_SEEN }, 8995);
  assert.deepEqual(pricePointsFor(known, 7495, NOW), [{ price: 7495, at: NOW }]);
  assert.deepEqual(priceChange(known, 7495), { previousPrice: 8995 });
});

test('a stored price with no history gets a baseline point before anything is overwritten', () => {
  const priced = new Types.ObjectId();
  const tracked = new Types.ObjectId();
  const unpriced = new Types.ObjectId();
  const undated = new Types.ObjectId();
  const stored = [
    { _id: priced, sourceSite: 'superkicks' as const, price: 8995, scrapedAt: LAST_SEEN },
    { _id: tracked, sourceSite: 'superkicks' as const, price: 7495, scrapedAt: LAST_SEEN },
    { _id: unpriced, sourceSite: 'footlocker' as const, price: null, scrapedAt: LAST_SEEN },
    { _id: undated, sourceSite: 'vegnonveg' as const, price: 9495, scrapedAt: null },
  ];
  assert.deepEqual(baselinePoints(stored, new Set([String(tracked)]), NOW), [
    { listing: priced, sourceSite: 'superkicks', price: 8995, at: LAST_SEEN },
    { listing: undated, sourceSite: 'vegnonveg', price: 9495, at: NOW },
  ]);
  assert.deepEqual(baselinePoints([], new Set(), NOW), []);
});

test('only http and https URLs are accepted', () => {
  assert.equal(isWebUrl('https://www.superkicks.in/products/a'), true);
  assert.equal(isWebUrl('http://example.com'), true);
  assert.equal(isWebUrl('javascript:alert(1)'), false);
  assert.equal(isWebUrl('/products/a'), false);
  assert.equal(isWebUrl(undefined), false);
});

test('a failure in the first query answers 500 as well, and a null item is only skipped', async () => {
  process.env.SCRAPER_SECRET = 'scraper-secret';
  const rejectedFind = RejectedUrl.find;
  (RejectedUrl as unknown as { find: unknown }).find = () => {
    throw new Error('mongo down');
  };
  const app = express();
  app.use(express.json());
  app.use('/scraper', ingestRoutes);
  const server = app.listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/scraper/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer scraper-secret' },
      body: JSON.stringify({ products: [null, item()] }),
    });
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'Ingest failed' });
  } finally {
    server.close();
    (RejectedUrl as unknown as { find: unknown }).find = rejectedFind;
  }
});

test('a save failure answers 500 instead of leaving the request open', async () => {
  process.env.SCRAPER_SECRET = 'scraper-secret';
  const rejectedFind = RejectedUrl.find;
  const scrapedFind = ScrapedProduct.find;
  (RejectedUrl as unknown as { find: unknown }).find = () => ({ lean: async () => [] });
  (ScrapedProduct as unknown as { find: unknown }).find = () => {
    throw new Error('mongo down');
  };
  const app = express();
  app.use(express.json());
  app.use('/scraper', ingestRoutes);
  const server = app.listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/scraper/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer scraper-secret' },
      body: JSON.stringify({ products: [item()] }),
    });
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'Ingest failed' });
  } finally {
    server.close();
    (RejectedUrl as unknown as { find: unknown }).find = rejectedFind;
    (ScrapedProduct as unknown as { find: unknown }).find = scrapedFind;
  }
});
