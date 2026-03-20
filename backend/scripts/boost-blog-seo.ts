/**
 * Boosts SEO meta fields on all blog posts with trending, high-volume keywords.
 * Run: npx ts-node-dev --transpile-only scripts/boost-blog-seo.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Blog } from '../src/models/Blog';

// High-volume keyword clusters for Indian sneaker searches
const KEYWORD_BOOSTS: Record<string, { addKeywords: string; appendDescription?: string }> = {
  // Jordan posts
  'jordan': {
    addKeywords: 'buy jordan shoes online india, jordan sneakers price india, original jordan india, air jordan india online, jordan shoes for men',
    appendDescription: ' Buy 100% authentic Jordan sneakers online in India at SNKRS CART.',
  },
  'air-jordan-1': {
    addKeywords: 'air jordan 1 price india, jordan 1 buy online india, aj1 india, air jordan 1 original, jordan 1 high og india',
  },
  'jordan-4': {
    addKeywords: 'jordan 4 price india, air jordan 4 buy online, aj4 india, jordan 4 black cat price, jordan 4 original india',
  },
  // Nike posts
  'nike': {
    addKeywords: 'nike shoes online india, buy original nike india, nike sneakers price india, nike shoes for men india, best nike shoes india',
    appendDescription: ' Shop original Nike shoes at SNKRS CART with pan-India delivery.',
  },
  'dunk': {
    addKeywords: 'nike dunk low price india, dunk low buy online india, nike dunk india, panda dunk india, dunk low for men',
  },
  'air-force-1': {
    addKeywords: 'nike air force 1 price india, af1 buy online india, air force 1 white india, nike af1 original',
  },
  'air-max': {
    addKeywords: 'nike air max price india, air max 90 india, air max 97 india, buy air max online india',
  },
  // Adidas posts
  'adidas': {
    addKeywords: 'adidas shoes online india, buy original adidas india, adidas sneakers price india, best adidas shoes india',
    appendDescription: ' Shop authentic Adidas sneakers at SNKRS CART.',
  },
  'samba': {
    addKeywords: 'adidas samba price india, samba og india, buy adidas samba online, samba shoes india',
  },
  // New Balance posts
  'new-balance': {
    addKeywords: 'new balance shoes india, buy new balance online india, new balance sneakers price india, new balance 550 india',
    appendDescription: ' Buy authentic New Balance in India at SNKRS CART.',
  },
  // Crocs posts
  'crocs': {
    addKeywords: 'crocs india price, buy crocs online india, crocs clogs india, crocs original india',
    appendDescription: ' Shop genuine Crocs at SNKRS CART.',
  },
  // Guide posts
  'buying-guide': {
    addKeywords: 'best sneakers to buy india, which sneakers to buy, sneaker buying guide india, shoes online india',
  },
  'budget': {
    addKeywords: 'affordable sneakers india, cheap original shoes india, sneakers under 10000 india, budget shoes india',
  },
  'india': {
    addKeywords: 'sneakers online india, buy shoes online india, authentic sneakers india, original shoes india',
  },
  'styling': {
    addKeywords: 'how to style sneakers india, sneaker outfit ideas, shoes with kurta, sneaker fashion tips',
  },
  'sneaker-care': {
    addKeywords: 'how to clean shoes india, shoe cleaning tips, sneaker cleaning india, shoe care products india',
  },
  'authentication': {
    addKeywords: 'how to check original shoes, fake vs real sneakers india, legit check india, first copy vs original',
  },
  'resale': {
    addKeywords: 'sell sneakers india, sneaker resale india, buy resale shoes india, used sneakers india',
  },
  'women': {
    addKeywords: 'best sneakers for women india, women shoes online india, nike women india, adidas women shoes india',
  },
  'college': {
    addKeywords: 'best shoes for college india, college sneakers, sneakers for students india, casual shoes college',
  },
  'monsoon': {
    addKeywords: 'waterproof shoes india, shoes for rain india, monsoon footwear india, rainy season shoes',
  },
  'wedding': {
    addKeywords: 'sneakers for wedding india, groom sneakers, shoes with sherwani, wedding shoes men india',
  },
  'startups': {
    addKeywords: 'indian shoe brands, d2c footwear india, new shoe startups india, made in india sneakers',
  },
  'trends': {
    addKeywords: 'sneaker trends 2025, sneaker trends india, popular shoes india 2025, trending sneakers',
  },
};

async function main() {
  await connectDB();

  const blogs = await Blog.find().lean();
  console.log(`\n🔍 Boosting SEO meta on ${blogs.length} blog posts...\n`);

  let updated = 0;

  for (const blog of blogs) {
    const currentKeywords = blog.metaKeywords || '';
    const currentDesc = blog.metaDescription || '';
    let newKeywords = currentKeywords;
    let newDesc = currentDesc;
    let changed = false;

    for (const tag of blog.tags) {
      const boost = KEYWORD_BOOSTS[tag];
      if (!boost) continue;

      // Add keywords that aren't already present
      const existingKw = new Set(currentKeywords.toLowerCase().split(',').map((k: string) => k.trim()));
      const newKw = boost.addKeywords.split(',').map((k) => k.trim()).filter((k) => !existingKw.has(k.toLowerCase()));

      if (newKw.length > 0) {
        newKeywords = newKeywords ? `${newKeywords}, ${newKw.join(', ')}` : newKw.join(', ');
        changed = true;
      }

      // Append to description if it doesn't already mention SNKRS CART
      if (boost.appendDescription && !currentDesc.includes('SNKRS CART')) {
        newDesc = currentDesc + boost.appendDescription;
        changed = true;
      }
    }

    if (changed) {
      await Blog.findByIdAndUpdate(blog._id, {
        $set: {
          metaKeywords: newKeywords,
          metaDescription: newDesc.substring(0, 320), // keep reasonable length
        },
      });
      updated++;
      console.log(`  ✅ ${blog.title}`);
    } else {
      console.log(`  ⏭  ${blog.title} (no changes)`);
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅ Done! Updated: ${updated} / ${blogs.length} posts`);
  console.log(`─────────────────────────────────────\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
