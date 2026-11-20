import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orderItemLink } from '../lib/orderItemLink.ts';

test('a delivered item links to the review form of its product', () => {
  assert.deepEqual(orderItemLink({ slug: 'nike-dunk-low-panda', name: 'Nike Dunk Low Panda' }, 'delivered'), {
    href: '/products/nike-dunk-low-panda#reviews',
    label: 'Write a review',
  });
});

test('an item that is not delivered yet links to its product page', () => {
  for (const status of ['pending', 'confirmed', 'shipped', 'cancelled']) {
    assert.deepEqual(orderItemLink({ slug: 'nike-dunk-low-panda', name: 'Nike Dunk Low Panda' }, status), {
      href: '/products/nike-dunk-low-panda',
      label: 'View',
    });
  }
});

test('an item without a slug falls back to search, delivered or not', () => {
  assert.deepEqual(orderItemLink({ name: 'Air Jordan 1 "Royal"' }, 'delivered'), {
    href: '/products?search=Air%20Jordan%201%20%22Royal%22',
    label: 'View',
  });
});
