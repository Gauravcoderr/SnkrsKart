import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceInIndiaTitle } from '../lib/productTitle.ts';
import { brandSeo } from '../lib/brandSeo.ts';
import { MIN_TAG_POSTS, indexableTags, tagIsIndexable } from '../app/blogs/blogUtils.ts';

const shoe = (name, price = 12000) => ({ name, price, productType: 'shoes', comingSoon: false });

test('product and profile titles lead with the model and "Price in India"', () => {
  assert.equal(priceInIndiaTitle('Jordan', 'Air Jordan 1 Low OG Game Royal'), 'Air Jordan 1 Low OG Game Royal Price in India | Snkrs Cart');
  assert.equal(priceInIndiaTitle('Nike', 'Kobe 6 Protro Coals'), 'Nike Kobe 6 Protro Coals Price in India | Snkrs Cart');
});

test('brand title reads as a reseller page, not the brand itself', () => {
  const products = [shoe('New Balance 1906R Silver'), shoe('New Balance 1906R Grey'), shoe('New Balance 1906R Blue'), shoe('New Balance 1000 Black'), shoe('New Balance 1000 White'), shoe('New Balance 2002R Dream State')];
  const { title } = brandSeo('New Balance', 'new-balance', products);
  assert.equal(title, 'New Balance Sneakers in India: 1906R & 1000 Prices | SNKRS CART');
  assert.ok(!title.startsWith('New Balance India'));
});

test('brand title without two models falls back to a price title', () => {
  assert.equal(brandSeo('Crocs', 'crocs', [shoe('Mystery Clog', 4999)]).title, 'Crocs Shoes in India: Prices from ₹4,999 | SNKRS CART');
});

test('a tag is indexable only with at least three posts', () => {
  assert.equal(MIN_TAG_POSTS, 3);
  assert.equal(tagIsIndexable(2), false);
  assert.equal(tagIsIndexable(3), true);
});

test('sitemap tags count each post once and merge spelling variants', () => {
  const blogs = [
    { tags: ['Jordan', 'Releases'] },
    { tags: ['jordan', 'Jordan'] },
    { tags: ['JORDAN', 'New Balance'] },
    { tags: ['new-balance', 'Releases'] },
    { tags: ['New Balance'] },
    { tags: [] },
    {},
  ];
  assert.deepEqual(indexableTags(blogs), ['jordan', 'new-balance']);
});

const drop = (name, brand, releaseDate) => ({ name, brand, releaseDate: `${releaseDate}T00:00:00.000Z` });

test('release calendars exist for Jordan, Nike, Kobe and Caitlin 1, and unknown slugs do not', async () => {
  const { RELEASE_CALENDARS, findCalendar } = await import('../lib/releaseCalendars.ts');
  assert.deepEqual(RELEASE_CALENDARS.map((c) => c.slug), ['jordan', 'nike', 'kobe', 'nike-caitlin-1']);
  assert.equal(findCalendar('adidas'), undefined);
  assert.equal(findCalendar('kobe').title(2026), 'Nike Kobe Release Dates 2026 and Prices | Snkrs Cart');
  assert.equal(findCalendar('nike-caitlin-1').label, 'Caitlin Clark');
});

test('a calendar splits its drops into upcoming (soonest first) and released this year (latest first)', async () => {
  const { findCalendar, calendarDrops } = await import('../lib/releaseCalendars.ts');
  const drops = [
    drop('Air Jordan 3 "Not Nice"', 'Jordan', '2026-11-21'),
    drop('Air Jordan 14 Low Bin 23', 'Jordan', '2027-01-10'),
    drop('Air Jordan 4 Bred', 'Jordan', '2026-11-18'),
    drop('Air Jordan 3 Laser', 'Jordan', '2026-08-22'),
    drop('Air Jordan 1 Chicago', 'Jordan', '2025-12-20'),
    drop('Nike Kobe 6 Protro "Coals"', 'Nike', '2026-12-25'),
  ];
  const { upcoming, released } = calendarDrops(findCalendar('jordan'), drops, '2026-11-18');
  assert.deepEqual(upcoming.map((d) => d.name), ['Air Jordan 4 Bred', 'Air Jordan 3 "Not Nice"', 'Air Jordan 14 Low Bin 23']);
  assert.deepEqual(released.map((d) => d.name), ['Air Jordan 3 Laser']);
});

test('model calendars match on the name, across brands', async () => {
  const { findCalendar, calendarDrops } = await import('../lib/releaseCalendars.ts');
  const drops = [
    drop('Nike Caitlin 1 "Racer Blue"', 'Nike', '2026-10-01'),
    drop('Caitlin Clark x Nike Kobe 5 Protro "Coconut Milk"', 'Nike', '2026-06-15'),
    drop('Nike Kobe 8 Protro "Mambacurial"', 'Nike', '2026-08-08'),
    drop('Nike Air Force 1 Low', 'Nike', '2026-12-01'),
  ];
  const caitlin = calendarDrops(findCalendar('nike-caitlin-1'), drops, '2026-11-18');
  assert.deepEqual(caitlin.released.map((d) => d.name), ['Nike Caitlin 1 "Racer Blue"', 'Caitlin Clark x Nike Kobe 5 Protro "Coconut Milk"']);
  const kobe = calendarDrops(findCalendar('kobe'), drops, '2026-11-18');
  assert.deepEqual(kobe.released.map((d) => d.name), ['Nike Kobe 8 Protro "Mambacurial"', 'Caitlin Clark x Nike Kobe 5 Protro "Coconut Milk"']);
  assert.equal(kobe.upcoming.length, 0);
});
