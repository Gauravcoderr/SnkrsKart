import 'dotenv/config';
import mongoose from 'mongoose';
import { uploadBlogImageToCloudinary } from './uploadBlogImage';

const MONGODB_URI = process.env.MONGODB_URI!;

// Verified Unsplash sources
const AJ4_COURT       = 'https://images.unsplash.com/photo-1560906992-4b00de401b90?w=1200&q=80'; // AJ4 black/orange held on court
const NIKE_AF1_BW     = 'https://images.unsplash.com/photo-1570464197285-9949814674a7?w=1200&q=80'; // Nike AF1 black/white next to Shoe Dog
const NIKE_AF1_DARK   = 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=1200&q=80';  // Nike AF1 black on shelf (B&W)

// AJ3 cover-v2 already shows correct AJ3 Black Cement — reuse for inline fixes
const AJ3_CORRECT_URL = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780081461/blog-images/air-jordan-3-black-cement-price-india-2026-cover-v2.jpg';

interface UploadEntry { id: string; url: string }

const toUpload: UploadEntry[] = [
  { id: 'where-to-buy-air-jordan-4-black-cat-india-inline-1-fix',     url: AJ4_COURT     },
  { id: 'where-to-buy-authentic-nike-dunks-india-cover-fix',           url: NIKE_AF1_BW   },
  { id: 'where-to-buy-authentic-nike-dunks-india-inline-1-fix',        url: NIKE_AF1_BW   },
  { id: 'nike-dunk-low-stranger-things-india-buy-cover-fix',            url: NIKE_AF1_DARK },
  { id: 'nike-dunk-low-stranger-things-india-buy-inline-1-fix',         url: NIKE_AF1_DARK },
];

async function uploadAll(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const { id, url } of toUpload) {
    try {
      const cloudUrl = await uploadBlogImageToCloudinary(url, id);
      map[id] = cloudUrl;
      console.log(`✅ ${id}`);
    } catch (e: any) {
      console.error(`❌ ${id}: ${e.message}`);
    }
  }
  return map;
}

async function main() {
  console.log('=== Uploading images to Cloudinary ===');
  const urls = await uploadAll();

  const aj4Inline1Fix   = urls['where-to-buy-air-jordan-4-black-cat-india-inline-1-fix'];
  const dunkCoverFix    = urls['where-to-buy-authentic-nike-dunks-india-cover-fix'];
  const dunkInline1Fix  = urls['where-to-buy-authentic-nike-dunks-india-inline-1-fix'];
  const stCoverFix      = urls['nike-dunk-low-stranger-things-india-buy-cover-fix'];
  const stInline1Fix    = urls['nike-dunk-low-stranger-things-india-buy-inline-1-fix'];

  if (!aj4Inline1Fix || !dunkCoverFix || !dunkInline1Fix || !stCoverFix || !stInline1Fix) {
    throw new Error('One or more uploads failed — aborting MongoDB updates');
  }

  console.log('\n=== Connecting to MongoDB ===');
  await mongoose.connect(MONGODB_URI, { dbName: 'snkrs-cart' });
  const Blog = mongoose.model('Blog', new mongoose.Schema({}, { strict: false }));

  // ── Fix 1: AJ4 Black Cat — inline-1 was Nike Air Max ──────────────────────
  {
    const blog = await Blog.findOne({ slug: 'where-to-buy-air-jordan-4-black-cat-india' }) as any;
    if (blog) {
      const OLD = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780079607/blog-images/where-to-buy-air-jordan-4-black-cat-india-inline-1.jpg';
      const OLD_ALT = 'Nike Jordan sneaker on clean background — authentic Jordan product shot';
      const NEW_ALT = 'Air Jordan 4 Black Cat on basketball court — authentic Jordan 4 India';
      let content: string = blog.content;
      content = content.replace(OLD, aj4Inline1Fix).replace(OLD_ALT, NEW_ALT);
      const r = await Blog.updateOne({ slug: 'where-to-buy-air-jordan-4-black-cat-india' }, { $set: { content } });
      console.log(`AJ4 Black Cat inline-1: matched=${r.matchedCount} modified=${r.modifiedCount}`);
    } else { console.error('AJ4 Black Cat blog not found'); }
  }

  // ── Fix 2: AJ3 Black Cement — inline shows AJ4, inline-1 shows AJ1 Low ────
  {
    const blog = await Blog.findOne({ slug: 'air-jordan-3-black-cement-price-india-2026' }) as any;
    if (blog) {
      const OLD_COVER_FIX = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780080687/blog-images/air-jordan-3-black-cement-price-india-2026-cover-fix.jpg';
      const OLD_INLINE1   = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780080595/blog-images/air-jordan-3-black-cement-price-india-2026-inline-1.jpg';
      const OLD_ALT1      = 'Dark Air Jordan sneaker held on basketball court — Jordan 3 Black Cement style';
      const OLD_ALT_I1    = 'Air Jordan 1 Low sneakers on basketball court — Jordan silhouette detail shot';
      const NEW_ALT1      = 'Air Jordan 3 Black Cement on display — AJ3 elephant print mudguard India';
      const NEW_ALT_I1    = 'Air Jordan 3 Black Cement authentic pair — Jordan 3 Black Cement India 2026';
      let content: string = blog.content;
      content = content
        .replace(OLD_COVER_FIX, AJ3_CORRECT_URL).replace(OLD_ALT1, NEW_ALT1)
        .replace(OLD_INLINE1, AJ3_CORRECT_URL).replace(OLD_ALT_I1, NEW_ALT_I1);
      const r = await Blog.updateOne({ slug: 'air-jordan-3-black-cement-price-india-2026' }, { $set: { content } });
      console.log(`AJ3 Black Cement inlines: matched=${r.matchedCount} modified=${r.modifiedCount}`);
    } else { console.error('AJ3 Black Cement blog not found'); }
  }

  // ── Fix 3: Nike Dunks — cover + inline were volt Nike trainer, inline-1 was AF1 Shadow ──
  {
    const blog = await Blog.findOne({ slug: 'where-to-buy-authentic-nike-dunks-india' }) as any;
    if (blog) {
      const OLD_COVER    = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780079613/blog-images/where-to-buy-authentic-nike-dunks-india-cover.jpg';
      const OLD_INLINE1  = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780079614/blog-images/where-to-buy-authentic-nike-dunks-india-inline-1.jpg';
      const OLD_ALT_COV  = 'Nike low-top sneaker black and white — classic Nike silhouette next to Shoe Dog book';
      const OLD_ALT_I1   = 'Nike Air Force 1 Shadow pastel colours — Nike low-top sneaker detail';
      const NEW_ALT_COV  = 'Nike low-top sneaker black and white — Nike sneaker India authentic buy guide';
      const NEW_ALT_I1   = 'Nike low-top sneaker black and white — authentic Nike Dunk Low India';
      let content: string = blog.content;
      content = content
        .replace(OLD_COVER, dunkCoverFix).replace(OLD_ALT_COV, NEW_ALT_COV)
        .replace(OLD_INLINE1, dunkInline1Fix).replace(OLD_ALT_I1, NEW_ALT_I1);
      const r = await Blog.updateOne(
        { slug: 'where-to-buy-authentic-nike-dunks-india' },
        { $set: { coverImage: dunkCoverFix, content } }
      );
      console.log(`Nike Dunks cover+inlines: matched=${r.matchedCount} modified=${r.modifiedCount}`);
    } else { console.error('Nike Dunks blog not found'); }
  }

  // ── Fix 4: Stranger Things Dunk — cover + inline + inline-1 all volt Nike trainer ──
  {
    const blog = await Blog.findOne({ slug: 'nike-dunk-low-stranger-things-india-buy' }) as any;
    if (blog) {
      const OLD_COVER   = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780079613/blog-images/where-to-buy-authentic-nike-dunks-india-cover.jpg';
      const OLD_INLINE1 = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780079624/blog-images/nike-dunk-low-stranger-things-india-buy-inline-1.jpg';
      const OLD_ALT_COV = 'Nike low top sneaker black white — Nike Dunk Low silhouette classic colourway';
      const OLD_ALT_I1  = 'Nike low top sneaker volt colour — Nike trainer profile view';
      const NEW_ALT_COV = 'Nike low-top sneaker black — Nike Dunk Low Stranger Things Phantom India';
      const NEW_ALT_I1  = 'Nike low-top sneaker black on shelf — Nike Dunk Stranger Things Phantom detail';
      let content: string = blog.content;
      content = content
        .replace(OLD_COVER, stCoverFix).replace(OLD_ALT_COV, NEW_ALT_COV)
        .replace(OLD_INLINE1, stInline1Fix).replace(OLD_ALT_I1, NEW_ALT_I1);
      const r = await Blog.updateOne(
        { slug: 'nike-dunk-low-stranger-things-india-buy' },
        { $set: { coverImage: stCoverFix, content } }
      );
      console.log(`Stranger Things cover+inlines: matched=${r.matchedCount} modified=${r.modifiedCount}`);
    } else { console.error('Stranger Things blog not found'); }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
