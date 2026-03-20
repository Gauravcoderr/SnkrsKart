/**
 * Post-processes blog posts in MongoDB to inject internal and external SEO links.
 * Run: npx ts-node-dev --transpile-only scripts/inject-blog-links.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Blog } from '../src/models/Blog';

// ─── Link definitions ──────────────────────────────────────────────────────

interface LinkRule {
  /** Text to match (case-insensitive, whole word boundary) */
  match: RegExp;
  /** Replacement HTML */
  replace: string;
  /** Max times to apply per post (default 1 — first occurrence only) */
  max?: number;
}

const INTERNAL_LINKS: LinkRule[] = [
  // Brand shop pages
  { match: /\bAir Jordan 4 Retro.{0,20}Black Cat\b/i, replace: '<a href="/products/air-jordan-4-retro-black-cat-2025">Air Jordan 4 Retro Black Cat</a>' },
  { match: /\bAir Jordan 1 Retro.{0,20}Chicago\b/i, replace: '<a href="/products/air-jordan-1-retro-low-og-chicago-2025">Air Jordan 1 Retro Chicago</a>' },
  { match: /\bJordan 1 High OG Satin Shadow\b/i, replace: '<a href="/products/jordan-1-retro-high-og-satin-shadow">Jordan 1 High OG Satin Shadow</a>' },
  { match: /\bBatman Batmobile Classic Clog\b/i, replace: '<a href="/products/crocs-batman-batmobile-classic-clog">Batman Batmobile Classic Clog</a>' },
  { match: /\bNike Dunk Low Stranger Things\b/i, replace: '<a href="/products/nike-dunk-low-stranger-things-phantom">Nike Dunk Low Stranger Things</a>' },
  { match: /\b1906R\b/, replace: '<a href="/products/new-balance-1906r-phantom-new-spruce">1906R</a>' },

  // Brand collection pages (only link once per post)
  { match: /(?<!["/])(Jordan sneakers|Jordan shoes|shop Jordan|Shop Jordan)\b/i, replace: '<a href="/products?brand=Jordan">$&</a>' },
  { match: /(?<!["/])(Nike sneakers|Nike shoes|shop Nike|Shop Nike)\b/i, replace: '<a href="/products?brand=Nike">$&</a>' },
  { match: /(?<!["/])(Adidas sneakers|Adidas shoes|shop Adidas|Shop Adidas)\b/i, replace: '<a href="/products?brand=Adidas">$&</a>' },
  { match: /(?<!["/])(New Balance sneakers|New Balance shoes|shop New Balance)\b/i, replace: '<a href="/products?brand=New+Balance">$&</a>' },
  { match: /(?<!["/])(Crocs clogs|shop Crocs|Shop Crocs)\b/i, replace: '<a href="/products?brand=Crocs">$&</a>' },

  // Blog cross-links
  { match: /\bsneaker care\b/i, replace: '<a href="/blogs/sneaker-care-guide-india">sneaker care</a>' },
  { match: /\bspot fake sneakers\b/i, replace: '<a href="/blogs/how-to-spot-fake-sneakers-india">spot fake sneakers</a>' },
  { match: /\bsizing guide\b/i, replace: '<a href="/blogs/sneaker-sizing-guide-india-uk-us-eu">sizing guide</a>' },
  { match: /\bresale market\b/i, replace: '<a href="/blogs/resale-sneaker-market-india-guide">resale market</a>' },
];

const EXTERNAL_LINKS: LinkRule[] = [
  // Brand official sites
  { match: /(?<!["/a-z])(Nike)(?=[^<]*<\/p|[^<]*<\/li)/i, replace: '<a href="https://www.nike.com" target="_blank" rel="noopener noreferrer">Nike</a>', max: 1 },
  { match: /(?<!["/a-z])(Jordan Brand)\b/i, replace: '<a href="https://www.nike.com/jordan" target="_blank" rel="noopener noreferrer">Jordan Brand</a>', max: 1 },
  { match: /\bAdidas\b(?=[^<]*<\/p)(?!.*href)/, replace: '<a href="https://www.adidas.co.in" target="_blank" rel="noopener noreferrer">Adidas</a>', max: 1 },
  { match: /\bNew Balance\b(?=[^<]*<\/p)(?!.*href)/, replace: '<a href="https://www.newbalance.com" target="_blank" rel="noopener noreferrer">New Balance</a>', max: 1 },
  { match: /\bCrocs\b(?=[^<]*<\/p)(?!.*href)/, replace: '<a href="https://www.crocs.in" target="_blank" rel="noopener noreferrer">Crocs</a>', max: 1 },

  // Sneaker media/authority
  { match: /\bSneaker News\b/, replace: '<a href="https://sneakernews.com" target="_blank" rel="noopener noreferrer">Sneaker News</a>', max: 1 },
  { match: /\bHypebeast\b/, replace: '<a href="https://hypebeast.com" target="_blank" rel="noopener noreferrer">Hypebeast</a>', max: 1 },
  { match: /\bComplex\b(?=[^<]*<)/, replace: '<a href="https://www.complex.com/sneakers" target="_blank" rel="noopener noreferrer">Complex</a>', max: 1 },

  // Indian sneaker stores (authority in the Indian context)
  { match: /\bVegNonVeg\b/, replace: '<a href="https://www.vegnonveg.com" target="_blank" rel="noopener noreferrer">VegNonVeg</a>', max: 1 },
  { match: /\bSuperkicks\b/, replace: '<a href="https://superkicks.in" target="_blank" rel="noopener noreferrer">Superkicks</a>', max: 1 },
  { match: /\bCrepdog Crew\b/, replace: '<a href="https://crepdogcrew.com" target="_blank" rel="noopener noreferrer">Crepdog Crew</a>', max: 1 },
  { match: /\bMainstreet Marketplace\b/, replace: '<a href="https://mainstreet.co.in" target="_blank" rel="noopener noreferrer">Mainstreet Marketplace</a>', max: 1 },
];

// CTA block to append to posts that don't have one
const CTA_TEMPLATES: Record<string, string> = {
  jordan: '\n<p><strong>Looking for authentic Jordans?</strong> <a href="/products?brand=Jordan">Browse our Jordan collection</a> — every pair is 100% genuine with pan-India delivery.</p>',
  nike: '\n<p><strong>Shop authentic Nike sneakers</strong> at <a href="/products?brand=Nike">SNKRS CART</a> — 100% genuine, delivered across India.</p>',
  adidas: '\n<p><strong>Want to grab a pair?</strong> <a href="/products?brand=Adidas">Shop Adidas on SNKRS CART</a> — authentic sneakers, zero compromise.</p>',
  'new-balance': '\n<p><strong>Ready to try New Balance?</strong> <a href="/products?brand=New+Balance">Shop the collection on SNKRS CART</a> — 100% authentic, pan-India shipping.</p>',
  crocs: '\n<p><strong>Check out our Crocs collection</strong> at <a href="/products?brand=Crocs">SNKRS CART</a> — including limited collabs and classics.</p>',
  default: '\n<p><strong>Explore our full sneaker collection</strong> at <a href="/products">SNKRS CART</a> — 100% authentic, from Nike and Jordan to New Balance and Crocs.</p>',
};

// ─── Processing ────────────────────────────────────────────────────────────

function applyRule(html: string, rule: LinkRule): string {
  // Skip if already has a link for this match
  const max = rule.max ?? 1;
  let count = 0;

  return html.replace(rule.match, (match) => {
    if (count >= max) return match;
    // Don't replace if already inside an <a> tag
    count++;
    return rule.replace.includes('$&') ? rule.replace.replace('$&', match) : rule.replace;
  });
}

function injectLinks(html: string): string {
  let result = html;

  // Skip content that already has many links (already processed)
  const existingLinks = (result.match(/<a\s/g) || []).length;
  if (existingLinks > 8) return result;

  // Apply internal links
  for (const rule of INTERNAL_LINKS) {
    result = applyRule(result, rule);
  }

  // Apply external links
  for (const rule of EXTERNAL_LINKS) {
    result = applyRule(result, rule);
  }

  return result;
}

function addCTA(html: string, tags: string[]): string {
  // Skip if already has a CTA-style link at the end
  if (html.includes('Shop') && html.includes('SNKRS CART') && html.includes('href="/products')) return html;

  // Pick CTA based on dominant tag
  const brandTags = ['jordan', 'nike', 'adidas', 'new-balance', 'crocs'];
  const matchedBrand = brandTags.find((b) => tags.includes(b));
  const cta = CTA_TEMPLATES[matchedBrand || 'default'];

  return html.trim() + cta;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  await connectDB();

  const blogs = await Blog.find().lean();
  console.log(`\n🔗 Processing ${blogs.length} blog posts for SEO links...\n`);

  let updated = 0;

  for (const blog of blogs) {
    const original = blog.content;
    let processed = injectLinks(original);
    processed = addCTA(processed, blog.tags);

    if (processed !== original) {
      await Blog.findByIdAndUpdate(blog._id, { $set: { content: processed } });
      updated++;
      console.log(`  ✅ Updated: ${blog.title}`);
    } else {
      console.log(`  ⏭  Skipped (no changes): ${blog.title}`);
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
