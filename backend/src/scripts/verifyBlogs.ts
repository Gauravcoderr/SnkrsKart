/**
 * Pre-seed quality gate for the `blog` skill.
 *
 * Parses the pending blog objects out of seedBlogs.ts (source text, so it runs
 * BEFORE seeding) and checks every mechanical requirement the skill's quality
 * checklist used to ask a human to eyeball. Also connects to MongoDB to catch
 * slug collisions, cover-image reuse, and tag-variant drift.
 *
 * Usage:
 *   npx ts-node --transpile-only src/scripts/verifyBlogs.ts <slug> [<slug> ...]
 *   npx ts-node --transpile-only src/scripts/verifyBlogs.ts --db <slug> ...   # verify seeded docs instead
 *
 * Exit code 1 if any check FAILs. Warnings never fail the run.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';

// Override with SEED_FILE=/path/to/fixture.ts to test the parser against a fixture.
const SEED_FILE = process.env.SEED_FILE || path.resolve(__dirname, 'seedBlogs.ts');
const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/dadulg5bs/';

const WORDS_MIN = 950;
const WORDS_MAX = 1300;
const IMGS_MIN = 2;
const IMGS_MAX = 3;
const META_DESC_MIN = 145;
const META_DESC_MAX = 160;
const TAGS_MIN = 6;
const TAGS_MAX = 10;

const BANNED_PHRASES = [
  'in the realm of',
  'delve into',
  "it's worth noting",
  'it is worth noting',
  "let's explore",
  'in this article',
  'when it comes to',
  'it goes without saying',
  'needless to say',
  "in today's fast-paced world",
  'in conclusion',
  'to summarize',
  'to summarise',
  'this article will',
  'we will discuss',
  "let's dive in",
  'seamlessly',
  'vibrant',
  'bustling',
  'game-changer',
  'game changing',
  'game-changing',
  'has been buzzing',
];

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Pending = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  content: string;
};

type Result = { slug: string; fails: string[]; warns: string[] };

/** Pull a single-quoted or backtick field out of an object window. */
function field(window: string, key: string): string {
  const m =
    window.match(new RegExp(`\\b${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)) ||
    window.match(new RegExp(`\\b${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  if (!m) return '';
  return m[1].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function tagsField(window: string): string[] {
  const m = window.match(/\btags:\s*\[([^\]]*)\]/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/**
 * Extract the object literal window enclosing a given slug from seedBlogs.ts.
 * Relies on the file's formatting convention: objects open with "\n  {\n" and
 * close with "\n  },". Throws loudly rather than returning a partial match.
 */
function extractPending(src: string, slug: string): Pending {
  const slugIdx = src.indexOf(`slug: '${slug}'`);
  if (slugIdx === -1) throw new Error(`slug not found in seedBlogs.ts: ${slug}`);

  const openIdx = src.lastIndexOf('\n  {\n', slugIdx);
  const closeIdx = src.indexOf('\n  },', slugIdx);
  if (openIdx === -1 || closeIdx === -1 || closeIdx < openIdx) {
    throw new Error(`could not bound object literal for slug: ${slug}`);
  }
  const window = src.slice(openIdx, closeIdx);

  const cStart = window.indexOf('content: `');
  const cEnd = window.lastIndexOf('`.trim()');
  if (cStart === -1 || cEnd === -1 || cEnd < cStart) {
    throw new Error(`could not locate content template literal for slug: ${slug}`);
  }

  return {
    slug,
    title: field(window, 'title'),
    excerpt: field(window, 'excerpt'),
    coverImage: field(window, 'coverImage'),
    tags: tagsField(window),
    metaTitle: field(window, 'metaTitle'),
    metaDescription: field(window, 'metaDescription'),
    metaKeywords: field(window, 'metaKeywords'),
    content: window.slice(cStart + 'content: `'.length, cEnd),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapse a tag to a comparison key so `New Balance`/`new-balance`/`newbalance` collide. */
function tagKey(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function check(b: Pending, dbTagKeys: Map<string, string[]>, dbSlugs: Set<string>, dbCovers: Set<string>): Result {
  const fails: string[] = [];
  const warns: string[] = [];
  const text = stripHtml(b.content);
  const words = text.split(/\s+/).filter(Boolean).length;

  // --- slug ---
  if (!KEBAB.test(b.slug)) fails.push(`slug not kebab-case: "${b.slug}"`);
  if (dbSlugs.has(b.slug)) fails.push(`slug already exists in DB: ${b.slug}`);

  // --- length ---
  if (words < WORDS_MIN || words > WORDS_MAX) {
    fails.push(`word count ${words} outside ${WORDS_MIN}-${WORDS_MAX}`);
  }

  // --- images ---
  const imgTags: string[] = b.content.match(/<img\b[^>]*>/gi) ?? [];
  if (imgTags.length < IMGS_MIN || imgTags.length > IMGS_MAX) {
    fails.push(`${imgTags.length} inline <img> tags, expected ${IMGS_MIN}-${IMGS_MAX}`);
  }
  imgTags.forEach((tag, i) => {
    const src = (tag.match(/src="([^"]*)"/) || [])[1] || '';
    const alt = (tag.match(/alt="([^"]*)"/) || [])[1] || '';
    if (!src.startsWith(CLOUDINARY_PREFIX)) fails.push(`inline img ${i + 1} src is not Cloudinary: ${src.slice(0, 70)}`);
    if (alt.trim().length < 20) fails.push(`inline img ${i + 1} alt text too thin: "${alt}"`);
  });

  // --- cover image ---
  if (!b.coverImage.startsWith(CLOUDINARY_PREFIX)) {
    fails.push(`coverImage is not Cloudinary: ${b.coverImage.slice(0, 70)}`);
  }
  const coverId = b.coverImage.split('/').pop() || '';
  if (coverId && dbCovers.has(coverId)) fails.push(`coverImage filename already used by another blog: ${coverId}`);

  // --- links ---
  const external = (b.content.match(/target="_blank"/g) || []).length;
  const productLinks = (b.content.match(/href="\/products/g) || []).length;
  const blogLinks = (b.content.match(/href="\/blogs\//g) || []).length;
  if (external < 2) fails.push(`${external} external backlinks, need 2+`);
  if (productLinks < 1) fails.push('no internal /products link');
  if (blogLinks < 1) fails.push('no /blogs/ cross-link');
  const noopenerMissing = (b.content.match(/target="_blank"(?![^>]*rel="noopener")/g) || []).length;
  if (noopenerMissing) fails.push(`${noopenerMissing} target="_blank" link(s) missing rel="noopener"`);

  // --- banned phrases ---
  const lower = text.toLowerCase();
  const hits = BANNED_PHRASES.filter((p) => lower.includes(p));
  if (hits.length) fails.push(`banned phrase(s): ${hits.join(', ')}`);

  // --- SEO ---
  const mdLen = b.metaDescription.length;
  if (mdLen < META_DESC_MIN || mdLen > META_DESC_MAX) {
    fails.push(`metaDescription ${mdLen} chars, need ${META_DESC_MIN}-${META_DESC_MAX}`);
  }
  if (!b.metaTitle.includes('SNKRS CART')) fails.push('metaTitle missing "| SNKRS CART"');
  if (b.metaTitle.length > 60) warns.push(`metaTitle ${b.metaTitle.length} chars (target 50-60)`);
  const kwCount = b.metaKeywords.split(',').filter((k) => k.trim()).length;
  if (kwCount < 6 || kwCount > 9) warns.push(`metaKeywords has ${kwCount} phrases (target 6-9)`);

  // --- excerpt ---
  const sentences = b.excerpt.split(/[.!?]+\s/).filter((s) => s.trim().length > 3).length;
  if (sentences < 2 || sentences > 3) warns.push(`excerpt has ~${sentences} sentences (target 2-3)`);

  // --- tags ---
  if (b.tags.length < TAGS_MIN || b.tags.length > TAGS_MAX) {
    fails.push(`${b.tags.length} tags, need ${TAGS_MIN}-${TAGS_MAX}`);
  }
  for (const t of b.tags) {
    if (!KEBAB.test(t)) {
      fails.push(`tag not lowercase-kebab: "${t}"`);
      continue;
    }
    const existing = dbTagKeys.get(tagKey(t));
    if (existing && !existing.includes(t)) {
      fails.push(`tag "${t}" collides with existing DB variant(s) [${existing.join(', ')}] — reuse one of those`);
    }
  }

  return { slug: b.slug, fails, warns };
}

async function main() {
  const argv = process.argv.slice(2);
  const fromDb = argv.includes('--db');
  const slugs = argv.filter((a) => !a.startsWith('--'));

  if (!slugs.length) {
    console.error('Usage: verifyBlogs.ts [--db] <slug> [<slug> ...]');
    process.exit(1);
  }

  await connectDB();
  const all = (await Blog.find({}).select('slug coverImage tags').lean()) as any[];

  // Build DB reference sets, excluding the slugs under test so re-runs stay idempotent.
  const under = new Set(slugs);
  const dbSlugs = new Set<string>(all.filter((b) => !under.has(b.slug)).map((b) => b.slug));
  const dbCovers = new Set<string>(
    all.filter((b) => !under.has(b.slug)).map((b) => String(b.coverImage || '').split('/').pop() || ''),
  );
  const dbTagKeys = new Map<string, string[]>();
  for (const b of all) {
    if (under.has(b.slug)) continue;
    for (const t of b.tags || []) {
      const k = tagKey(t);
      const arr = dbTagKeys.get(k) || [];
      if (!arr.includes(t)) arr.push(t);
      dbTagKeys.set(k, arr);
    }
  }

  let pending: Pending[];
  if (fromDb) {
    const docs = (await Blog.find({ slug: { $in: slugs } }).lean()) as any[];
    const missing = slugs.filter((s) => !docs.find((d) => d.slug === s));
    if (missing.length) {
      console.error(`✗ not in DB: ${missing.join(', ')}`);
      process.exit(1);
    }
    pending = docs.map((d) => ({
      slug: d.slug,
      title: d.title || '',
      excerpt: d.excerpt || '',
      coverImage: d.coverImage || '',
      tags: d.tags || [],
      metaTitle: d.metaTitle || '',
      metaDescription: d.metaDescription || '',
      metaKeywords: d.metaKeywords || '',
      content: d.content || '',
    }));
  } else {
    const src = fs.readFileSync(SEED_FILE, 'utf8');
    pending = slugs.map((s) => extractPending(src, s));
  }

  const results = pending.map((b) => check(b, dbTagKeys, dbSlugs, dbCovers));

  let failed = 0;
  for (const r of results) {
    const words = stripHtml(pending.find((p) => p.slug === r.slug)!.content).split(/\s+/).filter(Boolean).length;
    if (r.fails.length) {
      failed++;
      console.log(`\n✗ ${r.slug}  (${words} words)`);
      r.fails.forEach((f) => console.log(`   FAIL  ${f}`));
    } else {
      console.log(`\n✓ ${r.slug}  (${words} words)`);
    }
    r.warns.forEach((w) => console.log(`   warn  ${w}`));
  }

  console.log(`\n${results.length - failed}/${results.length} blogs passed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
