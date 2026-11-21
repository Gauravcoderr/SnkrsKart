import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyInsights, InsightInput, InsightListing, MOVE_LIMIT, NEW_LIMIT, PAIR_LIMIT } from '../src/lib/dailyInsights';

const NOW = new Date('2026-11-21T06:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const SITES = ['myntra', 'footlocker', 'vegnonveg', 'limitededt', 'superkicks', 'nike', 'tatacliq', 'tatacliqluxury', 'ajio'];

function ago(hours: number): Date {
  return new Date(NOW.getTime() - hours * HOUR);
}

function listing(site: string, name: string, overrides: Partial<InsightListing> = {}): InsightListing {
  return {
    site,
    brand: 'Jordan',
    name,
    url: `https://${site}.example/${name.toLowerCase().replace(/\s+/g, '-')}`,
    price: 9000,
    previousPrice: null,
    priceChangedAt: null,
    styleCode: '',
    firstSeenAt: ago(24 * 20),
    lastSeenAt: ago(2),
    ...overrides,
  };
}

const LISTINGS: InsightListing[] = [
  listing('superkicks', 'Palomino', {
    styleCode: 'DZ5485-612',
    price: 9000,
    firstSeenAt: ago(18),
    lastSeenAt: ago(5),
  }),
  listing('vegnonveg', 'Palomino VNV', {
    styleCode: 'DZ5485-612',
    price: 8500,
    previousPrice: 10000,
    priceChangedAt: ago(26),
  }),
  listing('tatacliq', 'Royal', {
    styleCode: 'HQ1111-001',
    price: 12000,
    previousPrice: 11000,
    priceChangedAt: ago(48),
    firstSeenAt: ago(24 * 5),
  }),
  listing('tatacliqluxury', 'Royal Luxe', {
    styleCode: 'HQ1111-001',
    price: 12500,
  }),
  listing('footlocker', 'Metallic Gold', {
    styleCode: 'FD4810-107',
    price: 15000,
  }),
  listing('limitededt', 'Samba', {
    brand: 'Adidas',
    price: 10999,
    previousPrice: 12999,
    priceChangedAt: ago(24 * 11),
  }),
  listing('superkicks', 'Palomino dearer', {
    styleCode: 'DZ5485-612',
    price: 9500,
  }),
  listing('ajio', 'Court Vision', {
    brand: 'Nike',
    price: null,
    firstSeenAt: ago(1),
  }),
  listing('myntra', 'Palomino gone', { styleCode: 'DZ5485-612', price: 7000, lastSeenAt: ago(24 * 5) }),
];

function input(overrides: Partial<InsightInput> = {}): InsightInput {
  return {
    sites: SITES,
    listings: LISTINGS,
    totals: [
      { site: 'superkicks', stored: 500, lastSeenAt: ago(5) },
      { site: 'vegnonveg', stored: 300, lastSeenAt: ago(2) },
      { site: 'tatacliq', stored: 700, lastSeenAt: ago(2) },
      { site: 'tatacliqluxury', stored: 600, lastSeenAt: ago(2) },
      { site: 'footlocker', stored: 500, lastSeenAt: ago(47.9) },
      { site: 'limitededt', stored: 200, lastSeenAt: ago(48) },
      { site: 'ajio', stored: 800, lastSeenAt: ago(2) },
      {
        site: 'myntra',
        stored: 352,
        lastSeenAt: new Date('2026-10-08T02:43:00.000Z'),
      },
    ],
    drops: [
      {
        slug: 'too-far',
        name: 'Too Far',
        brand: 'Nike',
        releaseDate: new Date('2026-12-06T00:00:00.000Z'),
        styleCode: '',
      },
      {
        slug: 'edge',
        name: 'Edge',
        brand: 'Nike',
        releaseDate: new Date('2026-12-05T00:00:00.000Z'),
        styleCode: '',
      },
      {
        slug: 'yesterday',
        name: 'Yesterday',
        brand: 'Nike',
        releaseDate: new Date('2026-11-20T00:00:00.000Z'),
        styleCode: 'DZ5485-612',
      },
      {
        slug: 'today',
        name: 'Today',
        brand: 'Jordan',
        releaseDate: new Date('2026-11-21T00:00:00.000Z'),
        styleCode: 'DZ5485-612',
      },
    ],
    ownPairs: [
      {
        slug: 'aj1-metallic-gold',
        name: 'Air Jordan 1 Retro High OG Metallic Gold',
        styleCode: 'FD4810-107',
        priceFrom: 16500,
      },
    ],
    historyPoints: 12,
    historySince: new Date('2026-11-21T01:00:00.000Z'),
    ...overrides,
  };
}

test('a source with nothing seen for 48 hours is stale, and a source with no rows is listed', () => {
  const sources = new Map(buildDailyInsights(input(), NOW).sources.map((source) => [source.site, source]));
  assert.equal(sources.size, 9);
  assert.deepEqual(sources.get('nike'), {
    site: 'nike',
    stored: 0,
    live: 0,
    seenLastDay: 0,
    newLastDay: 0,
    withStyleCode: 0,
    lastSeenAt: null,
    stale: true,
  });
  assert.equal(sources.get('myntra')?.stale, true);
  assert.equal(sources.get('myntra')?.live, 1);
  assert.equal(sources.get('limitededt')?.stale, true);
  assert.equal(sources.get('footlocker')?.stale, false);
  assert.deepEqual(sources.get('superkicks'), {
    site: 'superkicks',
    stored: 500,
    live: 2,
    seenLastDay: 2,
    newLastDay: 1,
    withStyleCode: 2,
    lastSeenAt: ago(5).toISOString(),
    stale: false,
  });
});

test('new listings are counted for a day and a week, newest first', () => {
  const fresh = buildDailyInsights(input(), NOW).newListings;
  assert.equal(fresh.lastDay, 2);
  assert.equal(fresh.lastWeek, 3);
  assert.deepEqual(
    fresh.items.map((item) => item.name),
    ['Court Vision', 'Palomino', 'Royal'],
  );
  assert.equal(fresh.items[0].price, null);
});

test('price moves of the last 7 days split into drops and rises', () => {
  const moves = buildDailyInsights(input(), NOW).priceMoves;
  assert.deepEqual(moves.drops, [
    {
      site: 'vegnonveg',
      brand: 'Jordan',
      name: 'Palomino VNV',
      url: 'https://vegnonveg.example/palomino-vnv',
      from: 10000,
      to: 8500,
      changePct: -15,
      changedAt: ago(26).toISOString(),
    },
  ]);
  assert.deepEqual([moves.dropCount, moves.riseCount], [1, 1]);
  assert.equal(moves.rises.length, 1);
  assert.equal(moves.rises[0].name, 'Royal');
  assert.equal(moves.rises[0].changePct, 9.1);
});

test('a listing not seen for 48 hours is not a current store price', () => {
  const pair = buildDailyInsights(input(), NOW).samePairs.items.find((item) => item.styleCode === 'DZ5485-612');
  assert.deepEqual(
    pair?.stores.map((store) => store.site),
    ['vegnonveg', 'superkicks'],
  );
  assert.equal(pair?.lowest, 8500);
});

test('the same pair needs two independent sellers or our own product', () => {
  const pairs = buildDailyInsights(input(), NOW).samePairs;
  assert.equal(pairs.total, 2);
  assert.deepEqual(
    pairs.items.map((pair) => pair.styleCode),
    ['FD4810-107', 'DZ5485-612'],
  );
  assert.deepEqual(pairs.items[0].own, {
    slug: 'aj1-metallic-gold',
    name: 'Air Jordan 1 Retro High OG Metallic Gold',
    priceFrom: 16500,
    gapPct: 10,
  });
  assert.equal(pairs.items[0].sellers, 1);
  assert.deepEqual(pairs.items[1].stores, [
    {
      site: 'vegnonveg',
      price: 8500,
      url: 'https://vegnonveg.example/palomino-vnv',
    },
    {
      site: 'superkicks',
      price: 9000,
      url: 'https://superkicks.example/palomino',
    },
  ]);
  assert.equal(pairs.items[1].sellers, 2);
  assert.equal(pairs.items[1].lowest, 8500);
  assert.equal(pairs.items[1].highest, 9000);
  assert.equal(pairs.items[1].spreadPct, 5.9);
  assert.equal(pairs.items[1].own, null);
});

test('upcoming drops cover today to 14 days ahead, soonest first, with the stores that list the code', () => {
  const drops = buildDailyInsights(input(), NOW).upcomingDrops;
  assert.deepEqual(
    drops.map((drop) => [drop.slug, drop.sellers]),
    [
      ['today', 2],
      ['edge', 0],
    ],
  );
});

test('history totals pass through and an empty history says so', () => {
  assert.deepEqual(buildDailyInsights(input(), NOW).history, {
    points: 12,
    since: '2026-11-21T01:00:00.000Z',
  });
  assert.deepEqual(buildDailyInsights(input({ historyPoints: 0, historySince: null }), NOW).history, { points: 0, since: null });
});

test('lists are capped while every count stays whole', () => {
  const many: InsightListing[] = [];
  for (let i = 0; i < 60; i++) {
    const code = `AB${String(1000 + i)}-001`;
    many.push(
      listing('superkicks', `Pair ${i} SK`, {
        styleCode: code,
        price: 9000 + i,
        previousPrice: 10000,
        priceChangedAt: ago(3),
        firstSeenAt: ago(2),
      }),
    );
    many.push(
      listing('vegnonveg', `Pair ${i} VNV`, {
        styleCode: code,
        price: 9500 + i,
      }),
    );
  }
  const built = buildDailyInsights(input({ listings: many, ownPairs: [] }), NOW);
  assert.equal(built.newListings.lastWeek, 60);
  assert.equal(built.newListings.items.length, NEW_LIMIT);
  assert.equal(built.priceMoves.dropCount, 60);
  assert.equal(built.priceMoves.drops.length, MOVE_LIMIT);
  assert.equal(built.samePairs.total, 60);
  assert.equal(built.samePairs.items.length, PAIR_LIMIT);
});

test('no listings gives empty sections, not an error', () => {
  const built = buildDailyInsights(input({ listings: [], totals: [], drops: [], ownPairs: [] }), NOW);
  assert.equal(built.newListings.lastWeek, 0);
  assert.deepEqual(built.priceMoves, { dropCount: 0, riseCount: 0, drops: [], rises: [] });
  assert.deepEqual(built.samePairs, { total: 0, items: [] });
  assert.deepEqual(built.upcomingDrops, []);
  assert.equal(
    built.sources.every((source) => source.stale),
    true,
  );
});
