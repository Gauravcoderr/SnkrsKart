/**
 * Reads products-template.xlsx and upserts every row into MongoDB.
 *
 * Run: npm run import-excel
 *      (or: npx ts-node scripts/import-excel.ts)
 *
 * Rules:
 *  - Existing product with same slug → UPDATED
 *  - New slug → INSERTED
 *  - brandProductCount is recalculated after import
 */

import 'dotenv/config';
import * as XLSX from 'xlsx';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Product } from '../src/models/Product';
import { Brand } from '../src/models/Brand';

// ─── Helpers ───────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseCSVList(val: unknown): string[] {
  if (!val) return [];
  return String(val).split(',').map((s) => s.trim()).filter(Boolean);
}

function parseNumberList(val: unknown): number[] {
  return parseCSVList(val).map(Number).filter((n) => !isNaN(n));
}

function parseBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  return String(val).toUpperCase() === 'TRUE';
}

function parseNullableNumber(val: unknown): number | null {
  if (val === '' || val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ─── Row → Product doc ─────────────────────────────────────────────────────

function rowToProduct(row: Record<string, unknown>) {
  const name  = String(row['name']  || '').trim();
  const brand = String(row['brand'] || '').trim();

  if (!name || !brand) {
    throw new Error(`Row missing required "name" or "brand": ${JSON.stringify(row)}`);
  }

  const rawSlug = String(row['slug'] || '').trim();
  const slug    = rawSlug || toSlug(`${brand}-${name}-${row['colorway'] ?? ''}`);

  const images = parseCSVList(row['images']);
  if (!images.length) throw new Error(`Row "${slug}" has no images`);

  return {
    slug,
    name,
    brand,
    colorway:      String(row['colorway']     || '').trim(),
    gender:        (String(row['gender']       || 'unisex').trim().toLowerCase()) as 'men' | 'women' | 'unisex' | 'kids',
    price:         Number(row['price (₹)']    ?? row['price'] ?? 0),
    originalPrice: parseNullableNumber(row['originalPrice']),
    discount:      parseNullableNumber(row['discount (%)'] ?? row['discount']),
    images,
    hoverImage:    String(row['hoverImage']    || images[0]).trim(),
    sizes:         parseNumberList(row['sizes (UK)'] ?? row['sizes']),
    availableSizes:parseNumberList(row['availableSizes']),
    colors:        parseCSVList(row['colors']).map((c) => c.toLowerCase()),
    tags:          parseCSVList(row['tags']).map((t) => t.toLowerCase()),
    featured:      parseBool(row['featured']),
    trending:      parseBool(row['trending']),
    newArrival:    parseBool(row['newArrival']),
    soldOut:       parseBool(row['soldOut']),
    rating:        Number(row['rating']        || 0),
    reviewCount:   Number(row['reviewCount']   || 0),
    description:   String(row['description']   || '').trim(),
    category:      String(row['category']      || 'lifestyle').trim().toLowerCase(),
    sku:           String(row['sku']           || '').trim(),
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const filePath = path.join(__dirname, '..', 'products-template.xlsx');

  console.log(`📂 Reading: ${filePath}`);
  const wb = XLSX.readFile(filePath);

  const sheet = wb.Sheets['Products'];
  if (!sheet) {
    console.error('❌ Sheet "Products" not found in the Excel file.');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  console.log(`📋 Found ${rows.length} data row(s)`);

  await connectDB();

  let inserted = 0;
  let updated  = 0;
  let errors   = 0;

  for (const [i, row] of rows.entries()) {
    try {
      const doc = rowToProduct(row);
      const existing = await Product.findOne({ slug: doc.slug }).lean();
      await Product.findOneAndUpdate(
        { slug: doc.slug },
        { $set: doc },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      if (existing) { updated++; } else { inserted++; }
      console.log(`  ✅ [${i + 1}/${rows.length}] ${doc.brand} ${doc.name} (${doc.slug})`);
    } catch (err) {
      errors++;
      console.error(`  ❌ [${i + 1}] Error:`, (err as Error).message);
    }
  }

  // Recalculate brand product counts
  await syncBrandCounts();

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Done! Upserted: ${inserted + updated} | Errors: ${errors}`);
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
}

async function syncBrandCounts() {
  const KNOWN_BRANDS = [
    { name: 'Nike',        slug: 'nike',        logoText: 'NIKE',        heroColor: '#111827' },
    { name: 'Adidas',      slug: 'adidas',      logoText: 'ADIDAS',      heroColor: '#1f2937' },
    { name: 'New Balance', slug: 'new-balance', logoText: 'NEW BALANCE', heroColor: '#374151' },
    { name: 'Asics',       slug: 'asics',       logoText: 'ASICS',       heroColor: '#111827' },
    { name: 'Puma',        slug: 'puma',        logoText: 'PUMA',        heroColor: '#1f2937' },
    { name: 'Vans',        slug: 'vans',        logoText: 'VANS',        heroColor: '#374151' },
  ];

  // Find all distinct brands in products collection
  const distinctBrands: string[] = await Product.distinct('brand');

  for (const brandName of distinctBrands) {
    const count  = await Product.countDocuments({ brand: brandName });
    const known  = KNOWN_BRANDS.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
    const slug   = known?.slug ?? toSlug(brandName);

    await Brand.findOneAndUpdate(
      { slug },
      { $set: { name: brandName, slug, productCount: count, logoText: known?.logoText ?? brandName.toUpperCase(), heroColor: known?.heroColor ?? '#18181b' } },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`  🏷  Brand "${brandName}": ${count} product(s)`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
