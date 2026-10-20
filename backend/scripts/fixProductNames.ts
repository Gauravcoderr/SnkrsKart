import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Product } from '../src/models/Product';
import { normalizeColorway, normalizeProductName } from '../src/lib/productName';
import { pingIndexNow } from '../src/lib/indexNow';

const DRY = process.argv.includes('--dry');

async function main() {
  await connectDB();
  const products = await Product.find({}).select('name colorway slug').lean();
  const changed = products
    .map((p) => ({
      id: String(p._id),
      slug: p.slug,
      name: { from: p.name, to: normalizeProductName(p.name) },
      colorway: { from: p.colorway, to: typeof p.colorway === 'string' ? normalizeColorway(p.colorway) || p.colorway : p.colorway },
    }))
    .filter((c) => c.name.to !== c.name.from || c.colorway.to !== c.colorway.from);

  console.log(`${products.length} products scanned, ${changed.length} to change${DRY ? ' (dry run)' : ''}`);
  for (const c of changed) {
    if (c.name.to !== c.name.from) console.log(`  name     ${JSON.stringify(c.name.from)} -> ${JSON.stringify(c.name.to)}`);
    if (c.colorway.to !== c.colorway.from) console.log(`  colorway ${JSON.stringify(c.colorway.from)} -> ${JSON.stringify(c.colorway.to)}`);
  }

  if (DRY || changed.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const backupDir = path.resolve(__dirname, '../../content-ml/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `product-names-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backup, JSON.stringify(changed, null, 2));
  console.log(`Backup: ${backup}`);

  for (const c of changed) {
    await Product.updateOne({ _id: c.id }, { $set: { name: c.name.to, colorway: c.colorway.to } });
  }
  pingIndexNow(changed.map((c) => `/products/${c.slug}`));
  console.log(`updated ${changed.length} product${changed.length === 1 ? '' : 's'}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
