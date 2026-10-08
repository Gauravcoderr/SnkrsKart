import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';
import { Drop } from '../models/Drop';
import { SneakerProfile } from '../models/SneakerProfile';
import { Product } from '../models/Product';
import { SellerListing } from '../models/SellerListing';
import { ScrapedProduct } from '../models/ScrapedProduct';

function writeJsonl(file: string, rows: unknown[]) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  fs.renameSync(tmp, file);
}

async function run() {
  const dataDir = process.argv[2] || path.resolve(__dirname, '../../../content-ml/data');
  await connectDB();

  const blogs = await Blog.find({}).select('slug title excerpt content tags metaTitle metaDescription metaKeywords published createdAt').lean();
  const drops = await Drop.find({}).select('slug name brand colorway description releaseDate retailPrice currency productSlug published').lean();
  const profiles = await SneakerProfile.find({}).select('slug name brand tagline description searchTags originalRetailPrice releaseYear published').lean();
  const content = [
    ...(blogs as any[]).map((b) => ({ kind: 'blog', slug: b.slug, title: b.title, excerpt: b.excerpt, html: b.content, tags: b.tags, metaTitle: b.metaTitle, metaDescription: b.metaDescription, metaKeywords: b.metaKeywords, published: !!b.published, date: b.createdAt })),
    ...(drops as any[]).map((d) => ({ kind: 'drop', slug: d.slug, title: d.name, brand: d.brand, colorway: d.colorway, text: d.description, published: !!d.published, date: d.releaseDate })),
    ...(profiles as any[]).map((p) => ({ kind: 'profile', slug: p.slug, title: p.name, brand: p.brand, tagline: p.tagline, text: p.description, tags: p.searchTags, published: !!p.published })),
  ];
  writeJsonl(path.join(dataDir, 'ours.jsonl'), content);

  const products = await Product.find({}).select('slug name brand sku price originalPrice variants').lean();
  const listings = await SellerListing.find({ status: 'active' }).select('product listPrice').lean();
  const listPrices = new Map<string, number[]>();
  for (const l of listings as any[]) {
    const k = String(l.product);
    listPrices.set(k, [...(listPrices.get(k) || []), l.listPrice]);
  }
  const scraped = await ScrapedProduct.find({}).select('name brand sku price').lean();
  const catalog = [
    ...(products as any[]).map((p) => ({
      type: 'product', slug: p.slug, name: p.name, brand: p.brand, sku: p.sku || '',
      inr: Array.from(new Set([p.price, p.originalPrice, ...(p.variants || []).flatMap((v: any) => [v.price, v.originalPrice]), ...(listPrices.get(String(p._id)) || [])].filter((x) => typeof x === 'number' && x > 0))),
    })),
    ...(scraped as any[]).filter((s) => s.price || s.sku).map((s) => ({ type: 'scraped', name: s.name, brand: s.brand, sku: s.sku || '', inr: s.price ? [s.price] : [] })),
    ...(drops as any[]).map((d) => ({ type: 'drop', slug: d.slug, name: d.name, brand: d.brand, releaseDate: d.releaseDate, retail: d.retailPrice, currency: d.currency, productSlug: d.productSlug })),
  ];
  writeJsonl(path.join(dataDir, 'catalog.jsonl'), catalog);

  const count = (k: string) => content.filter((c) => c.kind === k).length;
  console.log(`exported ${count('blog')} blogs, ${count('drop')} drops, ${count('profile')} profiles, ${catalog.length} catalog rows -> ${dataDir}`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
