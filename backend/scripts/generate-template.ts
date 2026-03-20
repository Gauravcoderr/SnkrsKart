/**
 * Generates products-template.xlsx
 * Run: npx ts-node scripts/generate-template.ts
 *
 * The Excel file will have:
 *   - Sheet "Products"  — one row per product, all required columns
 *   - Sheet "Instructions" — field descriptions + allowed values
 */

import * as XLSX from 'xlsx';
import path from 'path';

// ─── Column definitions ────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'slug',           label: 'slug',           example: 'nike-air-max-90-white-black',        note: 'URL-safe unique ID (lowercase, hyphens). Auto-generated from name+brand if blank.' },
  { key: 'name',           label: 'name',           example: 'Air Max 90',                          note: 'Product name' },
  { key: 'brand',          label: 'brand',          example: 'Nike',                                note: 'Nike | Adidas | New Balance | Asics | Puma | Vans (or any new brand)' },
  { key: 'colorway',       label: 'colorway',       example: 'White / Black / Grey',                note: 'Colourway description' },
  { key: 'gender',         label: 'gender',         example: 'unisex',                              note: 'men | women | unisex | kids' },
  { key: 'price',          label: 'price (₹)',      example: 12995,                                 note: 'Price in rupees (integer, e.g. 12995 = ₹12,995)' },
  { key: 'originalPrice',  label: 'originalPrice',  example: 14995,                                 note: 'Original price before discount. Leave blank if no discount.' },
  { key: 'discount',       label: 'discount (%)',   example: 13,                                    note: 'Discount percentage (integer). Leave blank if no discount.' },
  { key: 'images',         label: 'images',         example: 'https://url1.jpg, https://url2.jpg',  note: 'Comma-separated image URLs (at least 1 required)' },
  { key: 'hoverImage',     label: 'hoverImage',     example: 'https://url2.jpg',                    note: 'URL shown on card hover (usually 2nd image)' },
  { key: 'sizes',          label: 'sizes (UK)',     example: '6, 7, 8, 9, 10, 11',                 note: 'All available size options (comma-separated numbers)' },
  { key: 'availableSizes', label: 'availableSizes', example: '7, 8, 9, 10',                         note: 'Sizes currently in stock (subset of sizes)' },
  { key: 'colors',         label: 'colors',         example: 'white, black',                        note: 'Comma-separated colour names (lowercase)' },
  { key: 'tags',           label: 'tags',           example: 'classic, lifestyle, retro',           note: 'Comma-separated tags for search' },
  { key: 'featured',       label: 'featured',       example: 'TRUE',                                note: 'TRUE | FALSE — shows on home featured section' },
  { key: 'trending',       label: 'trending',       example: 'TRUE',                                note: 'TRUE | FALSE — shows on home trending section' },
  { key: 'newArrival',     label: 'newArrival',     example: 'FALSE',                               note: 'TRUE | FALSE — shows on home new arrivals section' },
  { key: 'soldOut',        label: 'soldOut',        example: 'FALSE',                               note: 'TRUE | FALSE' },
  { key: 'rating',         label: 'rating',         example: 4.6,                                   note: 'Rating 0.0 – 5.0' },
  { key: 'reviewCount',    label: 'reviewCount',    example: 312,                                   note: 'Number of reviews (integer)' },
  { key: 'description',    label: 'description',   example: 'A clean, classic sneaker...',          note: 'Product description (1-3 sentences)' },
  { key: 'category',       label: 'category',       example: 'lifestyle',                            note: 'lifestyle | running | basketball | skate' },
  { key: 'sku',            label: 'sku',            example: 'CT4352-100',                          note: 'Official product SKU' },
];

// ─── Sample rows (2 examples) ─────────────────────────────────────────────
const SAMPLE_ROWS = [
  {
    slug: 'nike-air-max-90-white-black',
    name: 'Air Max 90',
    brand: 'Nike',
    colorway: 'White / Black / Grey',
    gender: 'unisex',
    price: 12995,
    originalPrice: 14995,
    discount: 13,
    images: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80, https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
    sizes: '6, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11',
    availableSizes: '7, 8, 8.5, 9, 10',
    colors: 'white, black',
    tags: 'classic, lifestyle, retro',
    featured: 'TRUE',
    trending: 'TRUE',
    newArrival: 'FALSE',
    soldOut: 'FALSE',
    rating: 4.6,
    reviewCount: 312,
    description: 'The Air Max 90 stays true to its OG running roots with the iconic Waffle outsole, stitched overlays, and classic TPU accents.',
    category: 'lifestyle',
    sku: 'CT4352-100',
  },
  {
    slug: 'adidas-samba-og-white-black',
    name: 'Samba OG',
    brand: 'Adidas',
    colorway: 'Cloud White / Core Black',
    gender: 'unisex',
    price: 9995,
    originalPrice: '',
    discount: '',
    images: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80',
    sizes: '6, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11',
    availableSizes: '7, 8, 9, 10',
    colors: 'white, black',
    tags: 'classic, lifestyle, football',
    featured: 'TRUE',
    trending: 'TRUE',
    newArrival: 'FALSE',
    soldOut: 'FALSE',
    rating: 4.8,
    reviewCount: 1876,
    description: 'A street icon since 1950. The Adidas Samba OG brings indoor football heritage to everyday style.',
    category: 'lifestyle',
    sku: 'B75806',
  },
];

function buildProductsSheet() {
  const headers = COLUMNS.map((c) => c.label);
  const sampleData = SAMPLE_ROWS.map((row) =>
    COLUMNS.map((c) => (row as Record<string, unknown>)[c.key] ?? '')
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Column widths
  ws['!cols'] = COLUMNS.map((c) => ({ wch: Math.max(c.label.length, 18) }));

  // Style header row bold (xlsx-style would be needed for full styling; using basic for compat)
  return ws;
}

function buildInstructionsSheet() {
  const rows = [
    ['SNKRS CART — Product Import Instructions', ''],
    ['', ''],
    ['HOW TO USE', ''],
    ['1. Fill in the "Products" sheet — one product per row.', ''],
    ['2. Do NOT change the header row.', ''],
    ['3. Leave slug blank to auto-generate from name + brand.', ''],
    ['4. Save the file, then run:  npm run import-excel', ''],
    ['5. New products are inserted; existing slugs are updated (upsert).', ''],
    ['', ''],
    ['FIELD REFERENCE', ''],
    ['Column', 'Notes'],
    ...COLUMNS.map((c) => [c.label, c.note]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 80 }];
  return ws;
}

// ─── Write workbook ────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, buildProductsSheet(), 'Products');
XLSX.utils.book_append_sheet(wb, buildInstructionsSheet(), 'Instructions');

const outPath = path.join(__dirname, '..', 'products-template.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`✅ Template written to: ${outPath}`);
console.log('   → Fill in the "Products" sheet, then run: npm run import-excel');
