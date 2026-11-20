import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMarkets, createMarketCache, pricedProfiles, MARKET_CACHE_MS, MARKET_PAIR_LIMIT, MARKET_RETRY_MS, OwnListing, ScrapedListing, SneakerMarket } from '../src/lib/sneakerMarket';

const NOW = new Date('2026-11-21T06:00:00.000Z');

const PROFILES = [
  { slug: 'air-jordan-1', name: 'Air Jordan 1', brand: 'Jordan' },
  { slug: 'air-jordan-1-low', name: 'Air Jordan 1 Low', brand: 'Jordan Brand' },
  { slug: 'nike-dunk-low', name: 'Nike Dunk Low', brand: 'Nike' },
  { slug: 'adidas-samba', name: 'Adidas Samba', brand: 'adidas' },
  { slug: 'nike-x-sacai', name: 'Nike x Sacai', brand: 'Nike' },
  { slug: 'nike-cortez', name: 'Nike Cortez', brand: 'Nike' },
];

function own(slug: string, name: string, brand: string, priceFrom: number, sizes: Array<number | string> = [8]): OwnListing {
  return { slug, name, brand, colorway: 'Test Colour', sku: 'AB1234-001', priceFrom, sizes };
}

const OWN: OwnListing[] = [
  own('aj1-low-royal', 'Air Jordan 1 Low Game Royal', 'Jordan', 9000, [8, 9]),
  own('aj1-high-royal', 'Air Jordan 1 Retro High OG Royal', 'Air Jordan', 19000),
  own('aj1-low-gs', 'Air Jordan 1 Low (GS) Panda', 'Jordan', 6000),
  own('dunk-sold-out', 'Nike Dunk Low Panda', 'Nike', 0, []),
  own('dunk-fir', 'Nike Dunk Low Retro Fir', 'Nike', 12999),
];

const SCRAPED: ScrapedListing[] = [
  { name: 'Air Jordan 1 Low SE', brand: 'Jordan', price: 8000, scrapedAt: '2026-11-18T01:00:00.000Z' },
  { name: 'AIR JORDAN 1 LOW OG', brand: 'Jordan', price: 12000, scrapedAt: '2026-11-19T01:00:00.000Z' },
  { name: 'Jordan 1 Mid', brand: 'Jordan', price: 11495 },
  { name: 'Nike Dunk Low Retro', brand: 'Nike', price: 8295.4 },
  { name: 'Nike Dunk High', brand: 'Nike', price: 11000 },
  { name: 'Dunk Low Kids', brand: 'Nike', price: 5000 },
  { name: "Women's Samba OG", brand: 'Adidas', price: 10999, scrapedAt: '2026-11-10T01:00:00.000Z' },
  { name: 'Samba OG Cloud White', brand: 'Adidas', price: 9999, scrapedAt: new Date('2026-11-15T01:00:00.000Z') },
  { name: 'Nike x Sacai LDWaffle', brand: 'Nike', price: 30000 },
];

const markets = () => buildMarkets(PROFILES, OWN, SCRAPED, NOW);

test('a model takes its own pairs and scraped prices, cheapest own pair first', () => {
  assert.deepEqual(markets().get('air-jordan-1-low'), {
    inrMin: 8000,
    inrMax: 12000,
    inrMedian: 9000,
    listings: 3,
    ownCount: 1,
    ownMin: 9000,
    ownMax: 9000,
    pricedAt: '2026-11-21T06:00:00.000Z',
    productSlugs: ['aj1-low-royal'],
    pairs: [{ slug: 'aj1-low-royal', name: 'Air Jordan 1 Low Game Royal', colorway: 'Test Colour', sku: 'AB1234-001', priceFrom: 9000, sizes: [8, 9] }],
  });
});

test('a shorter model does not take listings that belong to a longer sibling model', () => {
  const market = markets().get('air-jordan-1');
  assert.equal(market?.listings, 2);
  assert.equal(market?.inrMin, 11495);
  assert.equal(market?.inrMax, 19000);
  assert.equal(market?.inrMedian, 15248);
  assert.deepEqual(market?.productSlugs, ['aj1-high-royal']);
});

test('kids pairs, other models and unbuyable own pairs stay out', () => {
  const market = markets().get('nike-dunk-low');
  assert.equal(market?.listings, 2);
  assert.equal(market?.inrMin, 8295);
  assert.equal(market?.inrMax, 12999);
  assert.equal(market?.inrMedian, 10647);
  assert.equal(market?.ownCount, 1);
  assert.deepEqual(market?.productSlugs, ['dunk-fir']);
});

test('scraped prices alone make a market dated by the newest scrape, with no own figures', () => {
  assert.deepEqual(markets().get('adidas-samba'), {
    inrMin: 9999,
    inrMax: 10999,
    inrMedian: 10499,
    listings: 2,
    ownCount: 0,
    ownMin: null,
    ownMax: null,
    pricedAt: '2026-11-15T01:00:00.000Z',
    productSlugs: [],
    pairs: [],
  });
});

test('a scraped-only market with no scrape dates has no price date', () => {
  const undated = buildMarkets(PROFILES, [], [{ name: 'Nike Cortez Leather', brand: 'Nike', price: 7495 }], NOW).get('nike-cortez');
  assert.equal(undated?.pricedAt, null);
});

test('models with no listing and collab names get no market', () => {
  assert.equal(markets().has('nike-cortez'), false);
  assert.equal(markets().has('nike-x-sacai'), false);
});

test('shown pairs are capped but the own count and own price range cover every pair', () => {
  const many = Array.from({ length: MARKET_PAIR_LIMIT + 2 }, (_, index) => own(`cortez-${index}`, `Nike Cortez Colour ${index}`, 'Nike', 20000 - index * 100));
  const market = buildMarkets(PROFILES, many, [], NOW).get('nike-cortez');
  assert.equal(market?.listings, MARKET_PAIR_LIMIT + 2);
  assert.equal(market?.ownCount, MARKET_PAIR_LIMIT + 2);
  assert.equal(market?.ownMin, 20000 - (MARKET_PAIR_LIMIT + 1) * 100);
  assert.equal(market?.ownMax, 20000);
  assert.equal(market?.pairs.length, MARKET_PAIR_LIMIT);
  assert.equal(market?.pairs[0].slug, `cortez-${MARKET_PAIR_LIMIT + 1}`);
  const rows = pricedProfiles([{ slug: 'nike-cortez', name: 'Nike Cortez', brand: 'Nike' }], buildMarkets(PROFILES, many, [], NOW));
  assert.equal(rows[0].market?.ownPairs, MARKET_PAIR_LIMIT + 2);
});

test('the price list keeps only profiles with a market or an India retail price', () => {
  const rows = pricedProfiles(
    [
      { slug: 'air-jordan-1-low', name: 'Air Jordan 1 Low', brand: 'Jordan Brand', image: 'https://img/aj1.jpg', category: 'lifestyle', indiaRetailPrice: null },
      { slug: 'nike-cortez', name: 'Nike Cortez', brand: 'Nike', indiaRetailPrice: 7495 },
      { slug: 'nike-x-sacai', name: 'Nike x Sacai', brand: 'Nike', indiaRetailPrice: 0 },
      { slug: 'no-price', name: 'Nike Nothing', brand: 'Nike' },
    ],
    markets(),
  );
  assert.deepEqual(rows, [
    {
      slug: 'air-jordan-1-low',
      name: 'Air Jordan 1 Low',
      brand: 'Jordan Brand',
      image: 'https://img/aj1.jpg',
      category: 'lifestyle',
      indiaRetailPrice: null,
      market: { inrMin: 8000, inrMax: 12000, inrMedian: 9000, listings: 3, ownPairs: 1, pricedAt: '2026-11-21T06:00:00.000Z' },
    },
    { slug: 'nike-cortez', name: 'Nike Cortez', brand: 'Nike', image: '', category: '', indiaRetailPrice: 7495, market: null },
  ]);
});

function fakeLoader(results: Array<Map<string, SneakerMarket> | Error>) {
  let calls = 0;
  const load = async () => {
    const result = results[Math.min(calls, results.length - 1)];
    calls++;
    if (result instanceof Error) throw result;
    return result;
  };
  return { load, calls: () => calls };
}

test('the cache loads once per window and shares one load between callers', async () => {
  const first = new Map<string, SneakerMarket>();
  const second = new Map<string, SneakerMarket>();
  const loader = fakeLoader([first, second]);
  let time = 1000;
  const get = createMarketCache(loader.load, () => time);
  const [a, b] = await Promise.all([get(), get()]);
  assert.equal(a, first);
  assert.equal(b, first);
  assert.equal(loader.calls(), 1);
  time += MARKET_CACHE_MS - 1;
  assert.equal(await get(), first);
  assert.equal(loader.calls(), 1);
  time += 1;
  assert.equal(await get(), second);
  assert.equal(loader.calls(), 2);
});

test('a failed reload keeps serving the last good prices and waits before retrying', async () => {
  const good = new Map<string, SneakerMarket>();
  const fresh = new Map<string, SneakerMarket>();
  const loader = fakeLoader([good, new Error('mongo down'), fresh]);
  let time = 0;
  const get = createMarketCache(loader.load, () => time);
  assert.equal(await get(), good);
  time += MARKET_CACHE_MS;
  assert.equal(await get(), good);
  assert.equal(loader.calls(), 2);
  time += MARKET_RETRY_MS - 1;
  assert.equal(await get(), good);
  assert.equal(loader.calls(), 2);
  time += 1;
  assert.equal(await get(), fresh);
  assert.equal(loader.calls(), 3);
});

test('with no good prices yet a failure is reported, not turned into an empty answer', async () => {
  const good = new Map<string, SneakerMarket>();
  const loader = fakeLoader([new Error('mongo down'), good]);
  let time = 0;
  const get = createMarketCache(loader.load, () => time);
  await assert.rejects(get(), /mongo down/);
  time += MARKET_RETRY_MS - 1;
  await assert.rejects(get(), /unavailable/);
  assert.equal(loader.calls(), 1);
  time += 1;
  assert.equal(await get(), good);
  assert.equal(loader.calls(), 2);
});
