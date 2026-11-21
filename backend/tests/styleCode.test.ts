import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findStyleCode, styleCode } from '../src/lib/styleCode';

test('styleCode accepts a whole style code and nothing else', () => {
  assert.equal(styleCode('dz5485-612'), 'DZ5485-612');
  assert.equal(styleCode(' 553558-045 '), '553558-045');
  assert.equal(styleCode('AJ1LMO0001'), '');
  assert.equal(styleCode(undefined), '');
});

test('a code inside a product URL or name is found', () => {
  assert.equal(findStyleCode('Jordan', [undefined, 'Air Jordan 1 Low', 'https://www.tatacliq.com/nike-air-jordan-1-low-553558-045/p-mp000000031743956']), '553558-045');
  assert.equal(findStyleCode('Nike', ['Nike Dunk Low Retro DD1391 100']), 'DD1391-100');
});

test('a variant sku with a size suffix still gives the code', () => {
  assert.equal(findStyleCode('Nike', ['DZ5485-612-UK8']), 'DZ5485-612');
  assert.equal(findStyleCode('Jordan', ['fd4810-107-9.5']), 'FD4810-107');
});

test('store ids are not style codes', () => {
  assert.equal(findStyleCode('Nike', ['469811286002', 'MP000000031743956', 'NIKEX00089031']), '');
  assert.equal(findStyleCode('Nike', ['https://www.ajio.com/nike-men-court-vision-low-lace-up-sneakers/p/469811286_grey']), '');
  assert.equal(findStyleCode('Jordan', ['https://www.footlocker.co.in/nike-men-jordan-t-shirt/p/26565276']), '');
});

test('plain model names give no code', () => {
  assert.equal(findStyleCode('Nike', ["Nike Air Force 1 '07", 'https://limitededt.in/products/wmns-tokyo-off-white-silver-pebble-gum']), '');
  assert.equal(findStyleCode('Jordan', ['JORDAN | AIR JORDAN 1 LOW SE CRAFT { CARGO KHAKI/CARGO KHAKI-KHAKI']), '');
});

test('the bare adidas shape counts only on adidas rows', () => {
  assert.equal(findStyleCode('Adidas', [undefined, "Wmns Samba Jane 'Cloud White' JR1402"]), 'JR1402');
  assert.equal(findStyleCode('Nike', [undefined, "Wmns Samba Jane 'Cloud White' JR1402"]), '');
});

test('season tokens and the ZX model name are refused', () => {
  assert.equal(findStyleCode('Adidas', ['SS2026 drop', 'FW2025']), '');
  assert.equal(findStyleCode('Adidas', ['Adidas ZX8000 Aqua']), '');
});

test('the New Balance shape counts only on New Balance rows', () => {
  assert.equal(findStyleCode('New Balance', ['New Balance 9060 U9060BLK']), 'U9060BLK');
  assert.equal(findStyleCode('Nike', ['U9060BLK']), '');
  assert.equal(findStyleCode('New Balance', ['New Balance 990v6 M990V6']), '');
});

test('a field that is not text is skipped, never an error', () => {
  assert.equal(findStyleCode('Nike', [12345678 as unknown as string, 'DZ5485-612']), 'DZ5485-612');
  assert.equal(findStyleCode('Nike', [{} as unknown as string, 42 as unknown as string]), '');
});

test('the first field that holds a code wins', () => {
  assert.equal(findStyleCode('Nike', ['FD4810-107', 'also DZ5485-612']), 'FD4810-107');
  assert.equal(findStyleCode('Nike', [null, '', 'DZ5485-612']), 'DZ5485-612');
});
