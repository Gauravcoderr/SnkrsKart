import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { buildProductSlug, cascadeProductSlug } from '../lib/productSlug';
import { pingIndexNow } from '../lib/indexNow';

const APPLY = process.argv.includes('--apply');

const LEGACY_ALIASES: Record<string, string> = {
  'jordan-air-jordan-1-low-neutral-grey-black-summit-white': 'air-jordan-1-low-neutral-grey-553558-045',
  'air-jordan-1-low-neutral-grey-black-summit-white': 'air-jordan-1-low-neutral-grey-553558-045',
  'new-balance-new-balance-2002r-dream-state-purple': 'new-balance-2002r-dream-state',
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'snkrs-cart' });
  const products = await Product.find().select('slug brand').lean();
  const taken = new Set(products.map((p) => p.slug));
  const changed: string[] = [];

  for (const p of products) {
    const next = buildProductSlug(p.slug, p.brand);
    if (next === p.slug) continue;
    if (taken.has(next)) {
      console.log(`SKIP (taken) ${p.slug} -> ${next}`);
      continue;
    }
    console.log(`${p.slug}\n  -> ${next}`);
    if (!APPLY) continue;
    await Product.updateOne({ _id: p._id }, { $set: { slug: next }, $addToSet: { previousSlugs: p.slug } });
    await cascadeProductSlug(p.slug, next);
    taken.delete(p.slug);
    taken.add(next);
    changed.push(`/products/${p.slug}`, `/products/${next}`);
  }

  for (const [oldSlug, liveSlug] of Object.entries(LEGACY_ALIASES)) {
    console.log(`alias ${oldSlug}\n  -> ${liveSlug}`);
    if (!APPLY) continue;
    const r = await Product.updateOne({ $or: [{ slug: liveSlug }, { previousSlugs: liveSlug }] }, { $addToSet: { previousSlugs: oldSlug } });
    if (!r.matchedCount) console.log(`  MISSING live product ${liveSlug}`);
    else changed.push(`/products/${oldSlug}`, `/products/${liveSlug}`);
  }

  if (APPLY && changed.length) await pingIndexNow(changed);
  console.log(APPLY ? `Redirects added: ${changed.length / 2}` : 'Dry run. Pass --apply to write.');
  await mongoose.disconnect();
})();
