import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileTitle } from '../lib/productTitle.ts';
import {
  hasIndiaPrice,
  latestPriceDate,
  listingCount,
  marketRange,
  modelOfferJsonLd,
  monthLabel,
  ownPairCount,
  priceAnswer,
  priceDate,
  sortPriceRows,
  trackedCount,
} from '../lib/sneakerPrice.ts';

const NOW = new Date('2026-11-21T06:00:00Z');
const rupees = (amount) => `Rs ${amount}`;
const market = (inrMin, inrMax, listings, inrMedian, extra = {}) => ({ inrMin, inrMax, inrMedian, listings, productSlugs: [], pairs: [], ...extra });

test('a profile has an India price when it has a market or a positive India MRP', () => {
  assert.equal(hasIndiaPrice({ market: market(5000, 9000, 4, 7000), indiaRetailPrice: null }), true);
  assert.equal(hasIndiaPrice({ market: null, indiaRetailPrice: 11495 }), true);
  assert.equal(hasIndiaPrice({ market: null, indiaRetailPrice: 0 }), false);
  assert.equal(hasIndiaPrice({ indiaRetailPrice: null }), false);
});

test('the title promises a price in India only when the profile has one', () => {
  assert.equal(profileTitle('Nike', 'Nike Dunk Low', true), 'Nike Dunk Low Price in India | Snkrs Cart');
  assert.equal(profileTitle('Nike', 'Nike Dunk Low', false), 'Nike Dunk Low Guide: History and Specs | Snkrs Cart');
  assert.equal(profileTitle('Puma', 'Speedcat', false), 'Puma Speedcat Guide: History and Specs | Snkrs Cart');
});

test('the answer sentence carries the price date, the range, the listing count, the middle listing and the MRP', () => {
  const profile = { name: 'Nike Dunk Low', market: market(4977, 25000, 36, 9995, { pricedAt: '2026-11-20T10:00:00.000Z' }), indiaRetailPrice: 8695 };
  assert.equal(
    priceAnswer(profile, NOW, rupees),
    'As of November 2026, the Nike Dunk Low is listed from Rs 4977 to Rs 25000 in India across 36 listings. The middle listing is Rs 9995. The official India retail price (MRP) is Rs 8695.',
  );
});

test('the date in the answer is when the price was seen, not when the page was built', () => {
  const stale = { name: 'Adidas Samba', market: market(9999, 10999, 2, 10499, { pricedAt: '2026-10-25T01:00:00.000Z' }), indiaRetailPrice: null };
  assert.equal(priceAnswer(stale, NOW, rupees), 'As of October 2026, the Adidas Samba is listed from Rs 9999 to Rs 10999 in India across 2 listings.');
  assert.equal(priceDate({ pricedAt: '2026-10-25T01:00:00.000Z' }, NOW).toISOString(), '2026-10-25T01:00:00.000Z');
  assert.equal(priceDate({ pricedAt: null }, NOW), NOW);
  assert.equal(priceDate({ pricedAt: 'not a date' }, NOW), NOW);
  assert.equal(priceDate(null, NOW), NOW);
});

test('small markets skip the middle listing and a single price is not shown as a range', () => {
  assert.equal(
    priceAnswer({ name: 'New Balance 550', market: market(5849, 5849, 2, 5849), indiaRetailPrice: null }, NOW, rupees),
    'As of November 2026, the New Balance 550 is listed at Rs 5849 in India across 2 listings.',
  );
  assert.equal(
    priceAnswer({ name: 'Adidas Samba', market: market(10999, 10999, 1, 10999), indiaRetailPrice: null }, NOW, rupees),
    'As of November 2026, the Adidas Samba is listed at Rs 10999 in India across 1 listing.',
  );
});

test('an MRP alone gives an undated sentence and no price data gives nothing', () => {
  assert.equal(
    priceAnswer({ name: 'Air Jordan 1 Mid', market: null, indiaRetailPrice: 11495 }, NOW, rupees),
    'The official India retail price (MRP) of the Air Jordan 1 Mid is Rs 11495.',
  );
  assert.equal(priceAnswer({ name: 'Puma Speedcat', market: null, indiaRetailPrice: null }, NOW, rupees), null);
});

test('range and listing count wording', () => {
  assert.equal(marketRange({ inrMin: 100, inrMax: 200 }, rupees), 'Rs 100 to Rs 200');
  assert.equal(marketRange({ inrMin: 100, inrMax: 100 }, rupees), 'Rs 100');
  assert.equal(listingCount(1), '1 listing');
  assert.equal(listingCount(2), '2 listings');
});

test('offer markup covers only pairs we sell, and needs two of them', () => {
  const profile = {
    name: 'Nike Dunk Low',
    brand: 'Nike',
    image: 'https://img/dunk.jpg',
    tagline: 'Icon',
    market: market(4977, 25000, 36, 9995, { ownCount: 7, ownMin: 10995, ownMax: 21999 }),
  };
  assert.deepEqual(modelOfferJsonLd(profile, 'https://www.snkrscart.com/sneakers/nike-dunk-low'), {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Nike Dunk Low',
    brand: { '@type': 'Brand', name: 'Nike' },
    image: 'https://img/dunk.jpg',
    description: 'Icon',
    url: 'https://www.snkrscart.com/sneakers/nike-dunk-low',
    offers: { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: 10995, highPrice: 21999, offerCount: 7, availability: 'https://schema.org/InStock' },
  });
  assert.equal(modelOfferJsonLd({ ...profile, market: market(4977, 25000, 36, 9995, { ownCount: 1, ownMin: 10995, ownMax: 10995 }) }, 'https://x'), null);
  assert.equal(modelOfferJsonLd({ ...profile, market: market(4977, 25000, 36, 9995, { ownCount: 0, ownMin: null, ownMax: null }) }, 'https://x'), null);
  assert.equal(modelOfferJsonLd({ ...profile, market: market(4977, 25000, 36, 9995) }, 'https://x'), null);
  assert.equal(modelOfferJsonLd({ ...profile, market: null }, 'https://x'), null);
});

test('the own pair count prefers the full count over the shown pairs', () => {
  assert.equal(ownPairCount({ ownCount: 14, pairs: new Array(12).fill({}) }), 14);
  assert.equal(ownPairCount({ pairs: new Array(3).fill({}) }), 3);
  assert.equal(ownPairCount({}), 0);
  assert.equal(ownPairCount(null), 0);
});

test('price rows sort by listings, then name, without changing the input', () => {
  const rows = [
    { slug: 'b', name: 'B Model', market: { listings: 5 } },
    { slug: 'mrp', name: 'A MRP Only', market: null },
    { slug: 'a', name: 'A Model', market: { listings: 5 } },
    { slug: 'top', name: 'Z Top', market: { listings: 95 } },
  ];
  assert.deepEqual(
    sortPriceRows(rows).map((row) => row.slug),
    ['top', 'a', 'b', 'mrp'],
  );
  assert.equal(rows[0].slug, 'b');
});

test('only rows with a market count as tracked, and the hub date is the newest price date', () => {
  const rows = [
    { slug: 'a', name: 'A', market: { listings: 5, pricedAt: '2026-11-10T00:00:00.000Z' } },
    { slug: 'b', name: 'B', market: { listings: 2, pricedAt: '2026-11-19T00:00:00.000Z' } },
    { slug: 'c', name: 'C', market: { listings: 1, pricedAt: null } },
    { slug: 'mrp', name: 'MRP', market: null },
  ];
  assert.equal(trackedCount(rows), 3);
  assert.equal(latestPriceDate(rows, NOW).toISOString(), '2026-11-19T00:00:00.000Z');
  assert.equal(latestPriceDate([{ slug: 'mrp', name: 'MRP', market: null }], NOW), NOW);
});

test('the month label is in India time', () => {
  assert.equal(monthLabel(new Date('2026-11-30T20:00:00Z')), 'December 2026');
  assert.equal(monthLabel(new Date('2026-11-21T06:00:00Z')), 'November 2026');
});

test('structured data cannot close its own script tag', async () => {
  const { safeJsonLd } = await import('../lib/jsonLd.ts');
  const text = safeJsonLd({ name: '</script><script>alert(1)</script>' });
  assert.equal(text.includes('<'), false);
  assert.deepEqual(JSON.parse(text), { name: '</script><script>alert(1)</script>' });
});
