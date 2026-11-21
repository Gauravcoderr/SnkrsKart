import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

const URI = process.env.IG_TEST_MONGO_URI;
const skip = !URI || /mongodb\.net|snkrs-cart/.test(URI) ? 'set IG_TEST_MONGO_URI to a local throwaway database' : false;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.SCRAPER_SECRET = 'scraper-secret';

const PAIR_URL = 'https://www.superkicks.in/products/jordan-air-jordan-1-low-palomino';
const OLD_URL = 'https://www.vegnonveg.com/products/jordan-air-jordan-1-low-palomino-blackphantom';
let server: Server;
let base = '';
let token = '';

let db: typeof import('mongoose');
let ScrapedProduct: typeof import('../src/models/ScrapedProduct').ScrapedProduct;
let ScrapedPricePoint: typeof import('../src/models/ScrapedPricePoint').ScrapedPricePoint;

before(async () => {
  if (skip) return;
  const mongoose = (await import('mongoose')).default;
  const express = (await import('express')).default;
  const jwt = (await import('jsonwebtoken')).default;
  await mongoose.connect(URI as string, { dbName: 'price-history-test' });
  await mongoose.connection.dropDatabase();
  db = mongoose;
  ScrapedProduct = (await import('../src/models/ScrapedProduct')).ScrapedProduct;
  ScrapedPricePoint = (await import('../src/models/ScrapedPricePoint')).ScrapedPricePoint;
  const app = express();
  app.use(express.json());
  app.use('/api/v1/scraper', (await import('../src/routes/scraperIngest')).default);
  app.use('/api/v1/admin/insights', (await import('../src/routes/adminInsights')).default);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  token = jwt.sign({ username: 'tester' }, process.env.JWT_SECRET as string);
});

after(async () => {
  if (skip) return;
  server?.close();
  await db.connection.dropDatabase();
  await db.disconnect();
});

function pair(price: number, url = PAIR_URL, site = 'superkicks') {
  return {
    sourceUrl: url,
    sourceSite: site,
    name: 'JORDAN | AIR JORDAN 1 LOW { PALOMINO',
    brand: 'Jordan',
    price,
    images: ['https://cdn.example/a.jpg'],
    sizes: ['UK 8'],
    variantSku: 'DZ5485-612-UK8',
  };
}

async function ingest(products: unknown[], secret = 'scraper-secret') {
  const res = await fetch(`${base}/scraper/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ products }),
  });
  return { status: res.status, body: await res.json() };
}

async function points(url: string): Promise<number[]> {
  const doc = await ScrapedProduct.findOne({ sourceUrl: url }).lean();
  const rows = await ScrapedPricePoint.find({ listing: doc._id }).sort({ at: 1, _id: 1 }).lean();
  return rows.map((row: { price: number }) => row.price);
}

test('ingest keeps price history: first sight, no change, then a drop', { skip }, async () => {
  const first = await ingest([pair(8995)]);
  assert.equal(first.status, 200);
  assert.deepEqual([first.body.inserted, first.body.updated, first.body.pricePoints], [1, 0, 1]);

  const same = await ingest([pair(8995)]);
  assert.deepEqual([same.body.inserted, same.body.updated, same.body.pricePoints], [0, 1, 0]);

  const drop = await ingest([pair(7495)]);
  assert.deepEqual([drop.body.inserted, drop.body.updated, drop.body.pricePoints], [0, 1, 1]);

  assert.deepEqual(await points(PAIR_URL), [8995, 7495]);
  const stored = await ScrapedProduct.findOne({
    sourceUrl: PAIR_URL,
  }).lean();
  assert.equal(stored.price, 7495);
  assert.equal(stored.previousPrice, 8995);
  assert.ok(stored.priceChangedAt instanceof Date);
  assert.equal(stored.styleCode, 'DZ5485-612');
  assert.equal(stored.variantSku, 'DZ5485-612-UK8');
});

test('a price saved without its point is healed by the next run', { skip }, async () => {
  await ScrapedProduct.updateOne({ sourceUrl: PAIR_URL }, { $set: { price: 6995 } });
  const healed = await ingest([pair(6995)]);
  assert.deepEqual([healed.body.inserted, healed.body.updated, healed.body.pricePoints], [0, 1, 1]);
  assert.deepEqual(await points(PAIR_URL), [8995, 7495, 6995]);
  const stored = await ScrapedProduct.findOne({ sourceUrl: PAIR_URL }).lean();
  assert.equal(stored?.previousPrice, 7495);
});

test('a URL that is not http or https, and fields a scraper may not set, are refused', { skip }, async () => {
  const before = await ScrapedProduct.countDocuments();
  const bad = await ingest([pair(8995, 'javascript:alert(1)')]);
  assert.deepEqual([bad.body.inserted, bad.body.updated, bad.body.errors.length], [0, 0, 1]);
  assert.equal(await ScrapedProduct.countDocuments(), before);
  await ingest([{ ...pair(6995), status: 'published' }]);
  const stored = await ScrapedProduct.findOne({ sourceUrl: PAIR_URL }).lean();
  assert.equal(stored?.status, 'draft');
});

test('a style code that is no longer found is cleared, and a null item is skipped', { skip }, async () => {
  const bare = await ingest([null, { ...pair(6995), variantSku: undefined }]);
  assert.deepEqual([bare.body.updated, bare.body.errors.length], [1, 1]);
  const cleared = await ScrapedProduct.findOne({ sourceUrl: PAIR_URL }).lean();
  assert.equal(cleared?.styleCode, undefined);
  await ingest([pair(6995)]);
  const restored = await ScrapedProduct.findOne({ sourceUrl: PAIR_URL }).lean();
  assert.equal(restored?.styleCode, 'DZ5485-612');
});

test('a row stored before price history existed still ingests and gains both prices', { skip }, async () => {
  const seenAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  await ScrapedProduct.collection.insertOne({
    sourceUrl: OLD_URL,
    sourceSite: 'vegnonveg',
    name: 'AIR JORDAN 1 LOW',
    brand: 'Jordan',
    price: 9495,
    images: [],
    sizes: [],
    tags: [],
    flags: [],
    gender: 'unisex',
    status: 'draft',
    scrapedAt: seenAt,
    createdAt: seenAt,
    updatedAt: seenAt,
  });
  const moved = await ingest([
    {
      ...pair(8495, OLD_URL, 'vegnonveg'),
      variantSku: undefined,
      name: 'AIR JORDAN 1 LOW',
    },
  ]);
  assert.deepEqual([moved.body.inserted, moved.body.updated, moved.body.pricePoints], [0, 1, 2]);
  assert.deepEqual(await points(OLD_URL), [9495, 8495]);
  const stored = await ScrapedProduct.findOne({
    sourceUrl: OLD_URL,
  }).lean();
  assert.equal(stored.previousPrice, 9495);
  assert.equal(stored.styleCode, undefined);
});

test('an old row whose price did not move gets one baseline point, once', { skip }, async () => {
  const url = 'https://www.footlocker.co.in/nike-men-dunk-low/p/1234';
  const seenAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  await ScrapedProduct.collection.insertOne({
    sourceUrl: url,
    sourceSite: 'footlocker',
    name: 'Nike Men Dunk Low',
    brand: 'Nike',
    price: 8695,
    images: [],
    sizes: [],
    status: 'draft',
    scrapedAt: seenAt,
    createdAt: seenAt,
    updatedAt: seenAt,
  });
  const same = { ...pair(8695, url, 'footlocker'), variantSku: undefined, name: 'Nike Men Dunk Low', brand: 'Nike' };
  const first = await ingest([same]);
  assert.deepEqual([first.body.updated, first.body.pricePoints], [1, 1]);
  const second = await ingest([same]);
  assert.deepEqual([second.body.updated, second.body.pricePoints], [1, 0]);
  assert.deepEqual(await points(url), [8695]);
});

test('the same listing twice in one batch is one insert and one point', { skip }, async () => {
  const url = 'https://limitededt.in/products/samba-og-cloud-white';
  const twice = await ingest([pair(10999, url, 'limitededt'), pair(10999, url, 'limitededt')]);
  assert.deepEqual([twice.body.inserted, twice.body.updated, twice.body.pricePoints], [1, 1, 1]);
  assert.deepEqual(await points(url), [10999]);
});

test('ingest refuses a wrong secret', { skip }, async () => {
  const res = await ingest([pair(8995)], 'wrong');
  assert.equal(res.status, 401);
});

test('daily insights need an admin token and show the move end to end', { skip }, async () => {
  const anonymous = await fetch(`${base}/admin/insights/daily`);
  assert.equal(anonymous.status, 401);
  const forged = await fetch(`${base}/admin/insights/daily`, {
    headers: { Authorization: 'Bearer not-a-token' },
  });
  assert.equal(forged.status, 401);

  const res = await fetch(`${base}/admin/insights/daily`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  const drops = body.priceMoves.drops.map((move: { name: string; from: number; to: number }) => [move.name, move.from, move.to]);
  assert.deepEqual(drops, [
    ['AIR JORDAN 1 LOW', 9495, 8495],
    ['JORDAN | AIR JORDAN 1 LOW { PALOMINO', 7495, 6995],
  ]);
  assert.equal(body.newListings.lastDay, 2);
  assert.equal(body.history.points, 7);
  assert.deepEqual([body.priceMoves.dropCount, body.priceMoves.riseCount], [2, 0]);
  const superkicks = body.sources.find((source: { site: string }) => source.site === 'superkicks');
  assert.deepEqual([superkicks.live, superkicks.withStyleCode, superkicks.stale], [1, 1, false]);
  const myntra = body.sources.find((source: { site: string }) => source.site === 'myntra');
  assert.deepEqual([myntra.stored, myntra.lastSeenAt, myntra.stale], [0, null, true]);
});
