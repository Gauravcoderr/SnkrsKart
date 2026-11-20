import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FILTERS, GRID_PAGE_SIZE, filterKey, filtersFromParams, prefetchable, toSearchParams } from '../lib/productFilters.ts';

const KNOWN = {
  brands: ['Jordan', 'Nike', 'Adidas', 'New Balance', 'Crocs'],
  genders: ['men', 'women', 'unisex'],
  productTypes: ['shoes', 'clothing', 'accessories'],
  sorts: ['popular', 'newest', 'price_asc', 'price_desc'],
};

const parse = (qs) => filtersFromParams(new URLSearchParams(qs));

test('a bare /products URL gives the default filters', () => {
  assert.deepEqual(parse(''), DEFAULT_FILTERS);
  assert.equal(GRID_PAGE_SIZE, 12);
});

test('URL params become filters the same way on the server and in the browser', () => {
  const filters = parse('brand=new-balance,nike&gender=Men&productType=Shoes&sort=newest&search=dunk');
  assert.deepEqual(filters.brands, ['New Balance', 'Nike']);
  assert.deepEqual(filters.gender, ['men']);
  assert.deepEqual(filters.productTypes, ['shoes']);
  assert.equal(filters.sort, 'newest');
  assert.equal(filters.search, 'dunk');
});

test('the page number is not part of the filter key', () => {
  assert.equal(filterKey(parse('brand=Nike&page=3')), filterKey(parse('brand=Nike')));
  assert.notEqual(filterKey(parse('brand=Nike')), filterKey(parse('brand=Nike&sort=newest')));
});

test('server searchParams records read like the browser URL', () => {
  const params = toSearchParams({ brand: 'Nike', sort: ['newest', 'popular'], gender: undefined });
  assert.equal(params.get('brand'), 'Nike');
  assert.equal(params.get('sort'), 'newest');
  assert.equal(params.has('gender'), false);
});

test('only known filter values are fetched on the server', () => {
  assert.equal(prefetchable(parse(''), KNOWN), true);
  assert.equal(prefetchable(parse('brand=Nike,new-balance&gender=women&sort=price_asc'), KNOWN), true);
  assert.equal(prefetchable(parse('search=dunk'), KNOWN), false);
  assert.equal(prefetchable(parse('brand=Yeezy'), KNOWN), false);
  assert.equal(prefetchable(parse('gender=aliens'), KNOWN), false);
  assert.equal(prefetchable(parse('productType=hats'), KNOWN), false);
  assert.equal(prefetchable(parse('sort=random'), KNOWN), false);
});
