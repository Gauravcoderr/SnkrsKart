import 'dotenv/config';
import { connectDB } from '../config/database';
import mongoose from 'mongoose';
import { uploadToCloudinary } from './uploadBlogImage';

const ALWAYS_MIGRATE = [
  'stockx.com',
  'vegnonveg.com',
  'feature.com',
  'sneakerpolitics.com',
  'limitededt.in',
  'superkicks.in',
  'hustleculture.co.in',
  'crepdogcrew.com',
];

const CHECK_429 = [
  'static.nike.com',
  'assets.adidas.com',
];

const SKIP = ['cloudinary.com', 'supabase.co'];

async function headStatus(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return res.status;
  } catch {
    return 0;
  }
}

async function shouldMigrate(url: string): Promise<boolean> {
  if (!url) return false;
  let hostname: string;
  try { hostname = new URL(url).hostname; } catch { return false; }

  if (SKIP.some(d => hostname.includes(d))) return false;
  if (ALWAYS_MIGRATE.some(d => hostname.includes(d))) return true;
  if (CHECK_429.some(d => hostname.includes(d))) {
    const status = await headStatus(url);
    return status === 429;
  }
  return false;
}

async function run(dryRun: boolean) {
  await connectDB();
  const db = mongoose.connection.db!;

  let bannersUpdated = 0;
  let productsUpdated = 0;

  // ── BANNERS ──────────────────────────────────────────────────────────────
  const banners = await db.collection('banners').find({}).toArray();
  console.log(`\nChecking ${banners.length} banners...`);

  for (const banner of banners) {
    const url: string = banner.image;
    if (!await shouldMigrate(url)) continue;

    console.log(`  → Banner ${banner._id}: ${url}`);
    if (dryRun) { console.log('    [DRY RUN — skipping upload]'); continue; }

    try {
      const publicId = `banner-${banner._id}`;
      const newUrl = await uploadToCloudinary(url, publicId, 'banner-images');
      await db.collection('banners').updateOne({ _id: banner._id }, { $set: { image: newUrl } });
      console.log(`  ✅ Updated to: ${newUrl}`);
      bannersUpdated++;
    } catch (e: any) {
      console.error(`  ❌ Failed: ${e.message}`);
    }
  }

  // ── PRODUCTS ─────────────────────────────────────────────────────────────
  const products = await db.collection('products').find({}).toArray();
  console.log(`\nChecking ${products.length} products...`);

  for (const product of products) {
    const slug: string = product.slug || String(product._id);
    const updates: Record<string, any> = {};

    // images array
    if (Array.isArray(product.images)) {
      const newImages = [...product.images];
      let changed = false;
      for (let i = 0; i < product.images.length; i++) {
        const url: string = product.images[i];
        if (!await shouldMigrate(url)) continue;

        console.log(`  → Product "${slug}" image[${i}]: ${url}`);
        if (dryRun) { console.log('    [DRY RUN — skipping upload]'); continue; }

        try {
          const publicId = `${slug}-img-${i}`;
          const newUrl = await uploadToCloudinary(url, publicId, 'product-images');
          newImages[i] = newUrl;
          changed = true;
          console.log(`  ✅ Uploaded: ${newUrl}`);
        } catch (e: any) {
          console.error(`  ❌ Failed image[${i}] for "${slug}": ${e.message}`);
        }
      }
      if (changed) updates['images'] = newImages;
    }

    // hoverImage
    if (product.hoverImage && await shouldMigrate(product.hoverImage)) {
      console.log(`  → Product "${slug}" hoverImage: ${product.hoverImage}`);
      if (!dryRun) {
        try {
          const publicId = `${slug}-hover`;
          const newUrl = await uploadToCloudinary(product.hoverImage, publicId, 'product-images');
          updates['hoverImage'] = newUrl;
          console.log(`  ✅ Hover uploaded: ${newUrl}`);
        } catch (e: any) {
          console.error(`  ❌ Failed hoverImage for "${slug}": ${e.message}`);
        }
      } else {
        console.log('    [DRY RUN — skipping upload]');
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('products').updateOne({ _id: product._id }, { $set: updates });
      console.log(`  ✅ Product "${slug}" updated in DB`);
      productsUpdated++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  if (dryRun) {
    console.log('DRY RUN complete — no changes made.');
  } else {
    console.log(`Migration complete — ${bannersUpdated} banner(s) updated, ${productsUpdated} product(s) updated.`);
  }
  process.exit(0);
}

const dryRun = process.argv.includes('--dry-run');
if (dryRun) console.log('\n⚠️  DRY RUN MODE — no uploads or DB writes will happen\n');

run(dryRun).catch(e => { console.error('Migration failed:', e); process.exit(1); });
