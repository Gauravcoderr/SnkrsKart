import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Product } from '../src/models/Product';
import { Blog } from '../src/models/Blog';
import { buildProductSlug, cascadeProductSlug } from '../src/lib/productSlug';
import { syncBrandCounts } from '../src/lib/brandCounts';
import { pingIndexNow } from '../src/lib/indexNow';

const DRY = process.argv.includes('--dry');

const MANUAL: Record<string, { slug: string; brand?: string }> = {
  'puma-x-hyrox-pwrmode-herb-garden': { slug: 'puma-x-hyrox-tee-pwrmode-herb-garden' },
  'jordan-puma-x-mas-tiempo-twenty-four-woven-shorts-magenta-gleam': { slug: 'puma-x-mas-tiempo-twenty-four-woven-shorts-magenta-gleam', brand: 'Puma' },
};

const ALIASES: Record<string, string[]> = {
  'air-jordan-1-low-og-chicago-2025': ['air-jordan-1-retro-low-og-chicago-2025'],
};

async function main() {
  await connectDB();
  const products = await Product.find({}).select('slug name brand sku previousSlugs').lean();
  const taken = new Set(products.map((p) => p.slug));
  const changed: Array<{ id: string; from: string; to: string; brand?: string }> = [];

  for (const p of products) {
    const manual = MANUAL[p.slug];
    let target = manual?.slug ?? buildProductSlug(p.slug, p.brand, p.sku);
    if (!target || target === p.slug) continue;
    if (taken.has(target)) {
      let n = 2;
      while (taken.has(`${target}-${n}`)) n++;
      target = `${target}-${n}`;
    }
    taken.delete(p.slug);
    taken.add(target);
    changed.push({ id: String(p._id), from: p.slug, to: target, brand: manual?.brand });
  }

  console.log(`${products.length} products scanned, ${changed.length} slug${changed.length === 1 ? '' : 's'} to change${DRY ? ' (dry run)' : ''}`);
  for (const c of changed) console.log(`  ${c.from}\n    -> ${c.to}${c.brand ? `  [brand -> ${c.brand}]` : ''}`);

  if (DRY) { await mongoose.disconnect(); return; }

  const touched: string[] = [];
  for (const c of changed) {
    const $set: Record<string, unknown> = { slug: c.to };
    if (c.brand) $set.brand = c.brand;
    await Product.updateOne({ _id: c.id }, { $set, $addToSet: { previousSlugs: c.from } });
    await cascadeProductSlug(c.from, c.to);
    touched.push(`/products/${c.from}`, `/products/${c.to}`);
  }

  for (const [slug, aliases] of Object.entries(ALIASES)) {
    const res = await Product.updateOne({ slug }, { $addToSet: { previousSlugs: { $each: aliases } } });
    if (res.matchedCount) {
      console.log(`aliases on ${slug}: ${aliases.join(', ')}`);
      for (const alias of aliases) {
        const blogs = await Blog.find({ content: { $regex: `/products/${alias}(?![\\w-])` } }).select('slug content');
        for (const b of blogs) {
          b.content = b.content.split(`/products/${alias}`).join(`/products/${slug}`);
          await b.save();
          console.log(`  blog ${b.slug}: links -> /products/${slug}`);
        }
      }
    }
  }

  await syncBrandCounts();
  await pingIndexNow(touched);
  console.log('done');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
