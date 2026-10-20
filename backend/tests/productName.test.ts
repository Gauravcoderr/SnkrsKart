import { test } from 'node:test';
import assert from 'node:assert/strict';
import { balanceQuotes, normalizeColorway, normalizeProductName } from '../src/lib/productName';

test('closes an unclosed nickname quote', () => {
  assert.equal(balanceQuotes("Air Jordan 1 Mid 'Barons"), "Air Jordan 1 Mid 'Barons'");
  assert.equal(balanceQuotes("New Balance 9060 'Dark Alpine Green"), "New Balance 9060 'Dark Alpine Green'");
  assert.equal(balanceQuotes('Jordan 3 Retro ‘Cement Grey'), "Jordan 3 Retro 'Cement Grey'");
});

test('closes the nickname before age group, year or dash tails', () => {
  assert.equal(balanceQuotes("Nike Dunk Low 'Valentines Day (GS) 2024"), "Nike Dunk Low 'Valentines Day' (GS) 2024");
  assert.equal(balanceQuotes("Air Jordan 4 'Toro 2026"), "Air Jordan 4 'Toro' 2026");
});

test('leaves balanced quotes, year abbreviations and possessives alone', () => {
  for (const name of [
    "Air Jordan 4 Retro 'Black Cat' 2025",
    'Air Force 1 \'07 LX "Sunflower"',
    "Nike Air Force 1 Low Rose White (Women's)",
    "Nike Air More Uptempo '96",
    'Air Jordan 1 Retro High OG "Love Letter"',
  ]) {
    assert.equal(balanceQuotes(name), name);
  }
});

test('capitalises a lowercase nickname', () => {
  assert.equal(balanceQuotes("Adidas Samba OG 'cow Print'"), "Adidas Samba OG 'Cow Print'");
});

test('normalizeProductName still title-cases shouting names', () => {
  assert.equal(normalizeProductName('AIR JORDAN 1 LOW OG'), 'Air Jordan 1 Low OG');
});

test('colourway: shouting becomes title case', () => {
  assert.equal(normalizeColorway('BLACK/SUMMIT WHITE-GORGE GREEN'), 'Black/Summit White-Gorge Green');
  assert.equal(normalizeColorway('SKY J ORANGE'), 'Sky J Orange');
});

test('colourway: stray separators and quotes are trimmed', () => {
  assert.equal(normalizeColorway('/DARK SILVER METALLIC'), 'Dark Silver Metallic');
  assert.equal(normalizeColorway('Medium Olive|Summit White|'), 'Medium Olive|Summit White');
  assert.equal(normalizeColorway('"Black/University Blue'), 'Black/University Blue');
});

test('colourway: lowercase words are capitalised, joiners stay lowercase', () => {
  assert.equal(normalizeColorway('red and black'), 'Red and Black');
  assert.equal(normalizeColorway('Light Khaki suede'), 'Light Khaki Suede');
});

test('colourway: clean mixed-case values are untouched', () => {
  for (const c of ['White / Black / Metallic Gold', 'Cool Weather-PUMA White-PUMA Black', 'Blue/Pink-Multicolor', 'N/A']) {
    assert.equal(normalizeColorway(c), c);
  }
});
