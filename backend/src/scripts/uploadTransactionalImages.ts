import 'dotenv/config';
import { uploadBlogImageToCloudinary } from './uploadBlogImage';

// Verified images: each entry shows what the photo actually depicts
const uploads = [
  // === AJ4 Black Cat ===
  // photo-1560906992-4b00de401b90 = Air Jordan 4 black/orange held on court ✅
  { id: 'where-to-buy-air-jordan-4-black-cat-india-cover',    url: 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80' },
  // photo-1552346154-21d32810aba3 = Air Jordan 1 Low red/black/white on court ✅
  { id: 'where-to-buy-air-jordan-4-black-cat-india-inline-2', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80' },

  // === AJ3 Black Cement ===
  // Overwrite MacBook: use AJ4 (dark Jordan) as cover for AJ3 black cement post
  { id: 'air-jordan-3-black-cement-price-india-2026-cover',   url: 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80' },
  // photo-1552346154-21d32810aba3 = AJ1 Low red/black ✅ (Jordan inline)
  { id: 'air-jordan-3-black-cement-price-india-2026-inline-1', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80' },

  // === Nike Dunks ===
  // photo-1570464197285-9949814674a7 = Nike AF1 black/white (Nike low-top, close enough) ✅
  { id: 'where-to-buy-authentic-nike-dunks-india-cover', url: 'https://images.unsplash.com/photo-1570464197285-9949814674a7?w=1200&q=80' },

  // === New Balance 1906R ===
  // photo-1653704841749-c9b33386ef15 = New Balance shoes on shelf with NB logo ✅
  { id: 'new-balance-1906r-review-india-2026-cover',    url: 'https://images.unsplash.com/photo-1653704841749-c9b33386ef15?w=1200&q=80' },
  { id: 'new-balance-1906r-review-india-2026-inline-1', url: 'https://images.unsplash.com/photo-1653704841749-c9b33386ef15?w=1200&q=80' },
  { id: 'new-balance-1906r-review-india-2026-inline-2', url: 'https://images.unsplash.com/photo-1653704841749-c9b33386ef15?w=1200&q=80' },

  // === AJ1 Low vs High ===
  // photo-1552346154-21d32810aba3 = AJ1 Low red/black/white ✅
  { id: 'air-jordan-1-low-vs-high-india-2026-cover',    url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80' },
  // photo-1542219550-37153d387c27 = AJ1 High grey/gold (already uploaded, overwrite MacBook)
  { id: 'air-jordan-1-low-vs-high-india-2026-inline-1', url: 'https://images.unsplash.com/photo-1542219550-37153d387c27?w=1200&q=80' },
  // AJ4 as second inline
  { id: 'air-jordan-1-low-vs-high-india-2026-inline-2', url: 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80' },

  // === Adidas Samba ===
  // Overwrite PUMA: photo-1695552839440-c7e7a9e4eac7 = Adidas Samba white/green ✅
  { id: 'adidas-samba-price-india-buy-authentic-2026-cover',    url: 'https://images.unsplash.com/photo-1695552839440-c7e7a9e4eac7?w=1200&q=80' },
  { id: 'adidas-samba-price-india-buy-authentic-2026-inline-2', url: 'https://images.unsplash.com/photo-1695552839440-c7e7a9e4eac7?w=1200&q=80' },

  // === Nike Dunk Stranger Things ===
  // Already fine (inline-1 = AF1 Shadow pastel, inline-2 = red Nike) — only cover needs check
  // Stranger Things collab is dark/phantom, use Nike AF1 black/white as cover
  { id: 'nike-dunk-low-stranger-things-india-buy-cover', url: 'https://images.unsplash.com/photo-1570464197285-9949814674a7?w=1200&q=80' },

  // === Cheapest Jordans ===
  // AJ4 as cover, overwrite MacBook inline-2
  { id: 'cheapest-authentic-jordans-india-2026-cover',    url: 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80' },
  { id: 'cheapest-authentic-jordans-india-2026-inline-2', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80' },

  // === Crocs Collab ===
  // Overwrite PUMA: photo-1496114269798-2705b43a53ae = classic black Crocs clogs ✅
  { id: 'crocs-collab-sneakers-india-buy-2026-cover', url: 'https://images.unsplash.com/photo-1496114269798-2705b43a53ae?w=1200&q=80' },

  // === How to Order Guide ===
  // General sneaker images are fine for a guide post
  { id: 'how-to-order-from-snkrs-cart-india-guide-cover',    url: 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80' },
  { id: 'how-to-order-from-snkrs-cart-india-guide-inline-1', url: 'https://images.unsplash.com/photo-1653704841749-c9b33386ef15?w=1200&q=80' },
];

async function main() {
  const results: Record<string, string> = {};
  for (const { id, url } of uploads) {
    try {
      const cloudUrl = await uploadBlogImageToCloudinary(url, id);
      results[id] = cloudUrl;
      console.log(`✅ ${id}`);
    } catch (e: any) {
      console.error(`❌ ${id}: ${e.message}`);
      results[id] = '';
    }
  }
  console.log('\n=== FINAL MAP ===');
  for (const [k, v] of Object.entries(results)) {
    console.log(`${k}: ${v}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
