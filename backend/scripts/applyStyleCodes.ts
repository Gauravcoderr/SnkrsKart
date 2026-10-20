import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Product } from '../src/models/Product';
import { styleCode } from '../src/lib/instagramSlides';
import { pingIndexNow } from '../src/lib/indexNow';

const DRY = process.argv.includes('--dry');
const file = process.argv.slice(2).find((a) => !a.startsWith('--'));

interface Row { slug: string; styleCode: string }

async function main() {
  if (!file) throw new Error('usage: applyStyleCodes.ts <codes.json> [--dry]  (codes.json = [{ slug, styleCode }])');
  const rows: Row[] = JSON.parse(fs.readFileSync(file, 'utf8'));
  await connectDB();

  const plan: { id: string; slug: string; from: string; to: string }[] = [];
  const seen = new Map<string, string>();
  for (const r of rows) {
    const code = styleCode(r.styleCode);
    if (!code) { console.log(`  skip ${r.slug}: ${JSON.stringify(r.styleCode)} is not a style code`); continue; }
    if (seen.has(code)) { console.log(`  skip ${r.slug}: ${code} also given for ${seen.get(code)}`); continue; }
    seen.set(code, r.slug);
    const p = await Product.findOne({ slug: r.slug }).select('slug sku').lean();
    if (!p) { console.log(`  skip ${r.slug}: no such product`); continue; }
    if (p.sku === code) continue;
    if (styleCode(p.sku)) { console.log(`  skip ${r.slug}: already has style code ${p.sku}`); continue; }
    const clash = await Product.findOne({ sku: code, _id: { $ne: p._id } }).select('slug').lean();
    if (clash) { console.log(`  skip ${r.slug}: ${code} already on ${clash.slug}`); continue; }
    plan.push({ id: String(p._id), slug: p.slug, from: p.sku, to: code });
  }

  console.log(`${rows.length} rows, ${plan.length} sku${plan.length === 1 ? '' : 's'} to set${DRY ? ' (dry run)' : ''}`);
  for (const c of plan) console.log(`  ${c.slug}: ${c.from} -> ${c.to}`);
  if (DRY || plan.length === 0) return;

  const backupDir = path.resolve(__dirname, '../../content-ml/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `product-skus-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backup, JSON.stringify(plan, null, 2));
  console.log(`Backup: ${backup}`);

  for (const c of plan) await Product.updateOne({ _id: c.id }, { $set: { sku: c.to } });
  pingIndexNow(plan.map((c) => `/products/${c.slug}`));
  console.log(`updated ${plan.length} sku${plan.length === 1 ? '' : 's'}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
