import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageLabel, dayText, dropStoresLabel, ownPriceNote, safeHref, signedPct, storeLabel } from '../app/admin/_lib/insights.ts';

const NOW = new Date('2026-11-21T06:00:00.000Z');

test('age labels step from minutes to hours to days', () => {
  assert.equal(ageLabel('2026-11-21T05:59:30.000Z', NOW), 'just now');
  assert.equal(ageLabel('2026-11-21T05:48:00.000Z', NOW), '12m ago');
  assert.equal(ageLabel('2026-11-21T01:00:00.000Z', NOW), '5h ago');
  assert.equal(ageLabel('2026-11-20T06:00:00.000Z', NOW), '1d ago');
  assert.equal(ageLabel('2026-10-08T02:43:00.000Z', NOW), '44d ago');
});

test('a source never seen says never, and so does a broken date', () => {
  assert.equal(ageLabel(null, NOW), 'never');
  assert.equal(ageLabel('not a date', NOW), 'never');
});

test('a percentage carries its sign', () => {
  assert.equal(signedPct(9.1), '+9.1%');
  assert.equal(signedPct(-15), '-15%');
  assert.equal(signedPct(0), '0%');
});

test('our price is described against the lowest store', () => {
  assert.equal(ownPriceNote(10), '10% above the lowest store');
  assert.equal(ownPriceNote(-4.5), '4.5% below the lowest store');
  assert.equal(ownPriceNote(0), 'same as the lowest store');
});

test('known stores get a readable name and unknown ones keep their id', () => {
  assert.equal(storeLabel('tatacliqluxury'), 'Tata CLiQ Luxury');
  assert.equal(storeLabel('vegnonveg'), 'VegNonVeg');
  assert.equal(storeLabel('newstore'), 'newstore');
});

test('only web links are rendered as links', () => {
  assert.equal(safeHref('https://www.superkicks.in/products/a'), 'https://www.superkicks.in/products/a');
  assert.equal(safeHref('HTTP://example.com/a'), 'HTTP://example.com/a');
  assert.equal(safeHref('javascript:alert(1)'), '#');
  assert.equal(safeHref('/products/a'), '#');
  assert.equal(safeHref(''), '#');
});

test('a release date prints as its calendar day', () => {
  assert.equal(dayText('2026-12-05T00:00:00.000Z'), '5 Dec 2026');
});

test('the stores column says why a count is missing', () => {
  assert.equal(dropStoresLabel({ styleCode: '', sellers: 0 }, false), 'needs a style code');
  assert.equal(dropStoresLabel({ styleCode: 'DZ5485-612', sellers: 0 }, true), 'no store seen in 48 hours');
  assert.equal(dropStoresLabel({ styleCode: 'DZ5485-612', sellers: 2 }, false), '2');
  assert.equal(dropStoresLabel({ styleCode: 'DZ5485-612', sellers: 0 }, false), '0');
});
