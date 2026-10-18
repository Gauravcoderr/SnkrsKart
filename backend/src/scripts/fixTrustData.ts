import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Product } from '../models/Product';
import { Review } from '../models/Review';

const DRY = process.argv.includes('--dry');
const BACKUP_DIR = path.resolve(__dirname, '../../../content-ml/data/backups');

async function run() {
  await connectDB();
  const products = await Product.find({}).select('slug originalPrice discount variants rating reviewCount').lean() as any[];
  const reviews = await Review.find({}).select('productSlug rating').lean() as any[];

  const real = new Map<string, { sum: number; n: number }>();
  for (const r of reviews) {
    if (!r.productSlug || !r.rating) continue;
    const cur = real.get(r.productSlug) || { sum: 0, n: 0 };
    cur.sum += r.rating;
    cur.n += 1;
    real.set(r.productSlug, cur);
  }

  const changes: any[] = [];
  for (const p of products) {
    const set: Record<string, unknown> = {};
    if (p.originalPrice != null) set.originalPrice = null;
    if (p.discount != null && p.discount !== 0) set.discount = null;
    if ((p.variants || []).some((v: any) => v.originalPrice != null)) {
      set.variants = p.variants.map((v: any) => ({ ...v, originalPrice: null }));
    }
    const r = real.get(p.slug);
    const rating = r ? Math.round((r.sum / r.n) * 10) / 10 : 0;
    const reviewCount = r ? r.n : 0;
    if ((p.rating || 0) !== rating) set.rating = rating;
    if ((p.reviewCount || 0) !== reviewCount) set.reviewCount = reviewCount;
    if (Object.keys(set).length) changes.push({ _id: p._id, slug: p.slug, before: { originalPrice: p.originalPrice, discount: p.discount, rating: p.rating, reviewCount: p.reviewCount, variants: p.variants }, set });
  }

  const priceFixes = changes.filter((c) => 'originalPrice' in c.set || 'variants' in c.set || 'discount' in c.set).length;
  const ratingFixes = changes.filter((c) => 'rating' in c.set || 'reviewCount' in c.set);
  console.log(`${changes.length} products to change: ${priceFixes} reference prices cleared, ${ratingFixes.length} ratings reset to real reviews${DRY ? ' (dry run)' : ''}`);
  for (const c of ratingFixes) console.log(`  ${c.slug}: ${c.before.rating}/${c.before.reviewCount} -> ${c.set.rating ?? c.before.rating}/${c.set.reviewCount ?? c.before.reviewCount}`);
  if (DRY || !changes.length) return;

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `trust-data-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(changes.map(({ slug, before }) => ({ slug, before })), null, 2));
  console.log(`Backup: ${file}`);
  for (const c of changes) await Product.updateOne({ _id: c._id }, { $set: c.set });
  console.log(`Updated ${changes.length} products.`);
}

run()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
