import 'dotenv/config';
import { uploadBlogImageToCloudinary } from './uploadBlogImage';

// These are the corrected images — replacing ones Cloudinary refused to overwrite
const fixes = [
  // AJ4 (black/orange on court) — replaces red Nike Free Run
  { id: 'where-to-buy-air-jordan-4-black-cat-india-cover-fix',    url: 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80' },
  // AJ4 (black/orange on court) — replaces MacBook
  { id: 'air-jordan-3-black-cement-price-india-2026-cover-fix',   url: 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80' },
  // New Balance on shelf — replaces AJ1 Low (wrong brand)
  { id: 'new-balance-1906r-review-india-2026-cover-fix',          url: 'https://images.unsplash.com/photo-1653704841749-c9b33386ef15?w=1200&q=80' },
  { id: 'new-balance-1906r-review-india-2026-inline-2-fix',       url: 'https://images.unsplash.com/photo-1653704841749-c9b33386ef15?w=1200&q=80' },
  // AJ1 Low red/black — replaces Nike Air Max (wrong brand for Jordan post)
  { id: 'air-jordan-1-low-vs-high-india-2026-cover-fix',          url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80' },
  // AJ1 High grey/gold — replaces MacBook
  { id: 'air-jordan-1-low-vs-high-india-2026-inline-1-fix',       url: 'https://images.unsplash.com/photo-1542219550-37153d387c27?w=1200&q=80' },
  // Adidas Samba white/green — replaces PUMA chunky
  { id: 'adidas-samba-price-india-buy-authentic-2026-cover-fix',  url: 'https://images.unsplash.com/photo-1695552839440-c7e7a9e4eac7?w=1200&q=80' },
  // AJ1 Low red/black — replaces MacBook
  { id: 'cheapest-authentic-jordans-india-2026-inline-2-fix',     url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80' },
  // Classic Crocs clogs — replaces PUMA chunky
  { id: 'crocs-collab-sneakers-india-buy-2026-cover-fix',         url: 'https://images.unsplash.com/photo-1496114269798-2705b43a53ae?w=1200&q=80' },
];

async function main() {
  const results: Record<string, string> = {};
  for (const { id, url } of fixes) {
    try {
      const cloudUrl = await uploadBlogImageToCloudinary(url, id);
      results[id] = cloudUrl;
      console.log(`✅ ${id}`);
      console.log(`   ${cloudUrl}`);
    } catch (e: any) {
      console.error(`❌ ${id}: ${e.message}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
