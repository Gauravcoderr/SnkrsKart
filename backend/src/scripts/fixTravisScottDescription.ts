import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// This product's description was pasted in as a full standalone HTML document
// (DOCTYPE/head/style + its own embedded <script type="application/ld+json">),
// unlike every other product which stores plain paragraph HTML. The embedded
// </script> broke out of the page's own JSON-LD <script> tag, corrupting the
// Product structured data — flagged by Google Search Console as
// "Bad escape sequence in string". Replacing with clean paragraph content
// matching every other product's description shape.
const SLUG = 'jordan-travis-scott-x-air-jordan-1-retro-low-og-sail-tropical-pink';

const CLEAN_DESCRIPTION = `<p>The <strong>Travis Scott x Air Jordan 1 Retro Low OG "Sail Tropical Pink"</strong> is one of the most sought-after releases from the Cactus Jack × Jordan Brand collaboration series. Instantly recognizable by its signature reversed Swoosh and backwards Nike Air branding on the heel, this sneaker combines Travis Scott's unmistakable design language with a clean Sail and Tropical Pink colour palette.</p>
<p>Crafted with premium leather and suede panels, the shoe features the vintage-inspired finish that has become synonymous with the Cactus Jack aesthetic. The low-top silhouette makes it easy to style with both casual and elevated outfits, while the soft pastel tones distinguish it from traditional Air Jordan 1 releases.</p>
<p>Every pair is professionally authenticated and inspected twice before dispatch — once before purchase confirmation, and again before shipping.</p>`;

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: 'snkrs-cart' });
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  const before = await Product.findOne({ slug: SLUG }).lean() as any;
  if (!before) {
    console.error('Product not found:', SLUG);
    process.exit(1);
  }
  console.log('Before length:', (before.description || '').length, 'contains <script:', (before.description || '').toLowerCase().includes('<script'));

  const result = await Product.updateOne({ slug: SLUG }, { $set: { description: CLEAN_DESCRIPTION } });
  console.log(`matched=${result.matchedCount} modified=${result.modifiedCount}`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
