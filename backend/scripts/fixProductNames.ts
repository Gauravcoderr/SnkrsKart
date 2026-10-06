import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Product } from '../src/models/Product';
import { normalizeProductName } from '../src/lib/productName';
import { pingIndexNow } from '../src/lib/indexNow';

const DRY = process.argv.includes('--dry');

async function main() {
  await connectDB();
  const products = await Product.find({}).select('name slug').lean();
  const changed = products
    .map((p) => ({ id: String(p._id), slug: p.slug, from: p.name, to: normalizeProductName(p.name) }))
    .filter((c) => c.to !== c.from);

  console.log(`${products.length} products scanned, ${changed.length} name${changed.length === 1 ? '' : 's'} to change${DRY ? ' (dry run)' : ''}`);
  for (const c of changed) console.log(`  ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);

  if (DRY || changed.length === 0) {
    await mongoose.disconnect();
    return;
  }

  for (const c of changed) {
    await Product.updateOne({ _id: c.id }, { $set: { name: c.to } });
  }
  pingIndexNow(changed.map((c) => `/products/${c.slug}`));
  console.log(`updated ${changed.length} product name${changed.length === 1 ? '' : 's'}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
