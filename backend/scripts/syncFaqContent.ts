import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { SiteContent } from '../src/models/SiteContent';
import { faqs } from '../../frontend/app/faqs/faqs-data';

// Copies the FAQ answers in frontend/app/faqs/faqs-data.ts into the admin CMS page "faq", which
// overrides them on /faqs and feeds GET /api/v1/faqs. Keeps one policy wording everywhere.
// Backs the current CMS items up to content-ml/data/backups/ first. --dry only prints the diff.

const DRY = process.argv.includes('--dry');

async function main() {
  await connectDB();
  const doc = await SiteContent.findOne({ pageKey: 'faq' }).lean();
  if (!doc) throw new Error('CMS page "faq" not found');

  const current = (doc.faqItems ?? []).map((f) => ({ q: f.q, a: f.a }));
  const next = faqs.map((f) => ({ q: f.q, a: f.a }));
  next.forEach((f, i) => {
    const old = current[i];
    if (!old || old.q !== f.q || old.a !== f.a) {
      console.log(`#${i + 1} ${f.q}\n  - ${old ? old.a : '(none)'}\n  + ${f.a}\n`);
    }
  });
  if (current.length > next.length) console.log(`Removes ${current.length - next.length} extra CMS item(s).`);
  if (JSON.stringify(current) === JSON.stringify(next)) {
    console.log('CMS FAQ already matches faqs-data.ts.');
    return;
  }
  if (DRY) {
    console.log('Dry run, nothing written.');
    return;
  }

  const backupDir = path.resolve(__dirname, '../../content-ml/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `site-content-faq-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backup, JSON.stringify(doc, null, 2));
  console.log(`Backup: ${backup}`);

  await SiteContent.updateOne({ pageKey: 'faq' }, { $set: { faqItems: next } });
  console.log(`Updated CMS FAQ to ${next.length} items. /faqs refreshes within 5 minutes.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
