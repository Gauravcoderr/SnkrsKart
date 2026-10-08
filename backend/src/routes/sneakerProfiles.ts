import { Router, Request, Response } from 'express';
import { SneakerProfile } from '../models/SneakerProfile';
import { Product } from '../models/Product';
import { ScrapedProduct } from '../models/ScrapedProduct';
import { attachSellerOffers } from '../lib/sellerOffers';

const router = Router();

const LEADING_NOISE = new Set(['men', 'mens', 'man', 'women', 'womens', 'woman', 'wmns', 'unisex', 'originals']);
const KIDS_TOKENS = new Set([
  'gs', 'ps', 'td', 'kid', 'kids', 'infant', 'infants', 'toddler', 'toddlers',
  'preschool', 'junior', 'youth', 'child', 'children',
]);
const MARKET_SCRAPE_DAYS = 30;
const MARKET_SLUG_LIMIT = 12;
const MARKET_CACHE_MS = 5 * 60 * 1000;
const MARKET_CACHE_MAX = 500;
const marketCache = new Map<string, { at: number; value: SneakerMarket | null }>();

export interface SneakerMarket {
  inrMin: number;
  inrMax: number;
  listings: number;
  productSlugs: string[];
}

function brandKey(brand: string): string {
  const b = brand.trim().toLowerCase().replace(/\s+brand$/, '');
  return b === 'air jordan' ? 'jordan' : b;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function brandPatterns(brand: string): RegExp[] {
  const key = brandKey(brand);
  const names = key === 'jordan' ? ['jordan', 'air jordan', 'jordan brand'] : [key];
  return names.map((n) => new RegExp(`^${escapeRegex(n)}$`, 'i'));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['\u2019`]/g, '')
    .replace(/(\d)\.(\d)/g, '$1p$2')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function tokenRegex(token: string): RegExp {
  return new RegExp(`\\b${escapeRegex(token).replace(/(\d)p(\d)/g, '$1\\.$2')}\\b`, 'i');
}

function modelTokens(name: string, brand: string): string[] {
  const key = brandKey(brand);
  const strip = new Set([...tokenize(key), ...LEADING_NOISE]);
  if (key === 'jordan') ['nike', 'air'].forEach((t) => strip.add(t));
  const tokens = tokenize(name);
  let i = 0;
  while (i < tokens.length && strip.has(tokens[i])) i++;
  return tokens.slice(i);
}

function startsWith(tokens: string[], prefix: string[]): boolean {
  return prefix.length > 0 && prefix.length <= tokens.length && prefix.every((t, i) => tokens[i] === t);
}

function makeMatcher(target: string[], siblings: string[][], brand: string) {
  const longer = siblings.filter((s) => s.length > target.length && startsWith(s, target));
  return (name: string): boolean => {
    const tokens = modelTokens(name, brand);
    if (tokens.some((t) => KIDS_TOKENS.has(t))) return false;
    if (!startsWith(tokens, target)) return false;
    return !longer.some((s) => startsWith(tokens, s));
  };
}

async function computeMarket(profile: { name: string; brand: string; slug: string }): Promise<SneakerMarket | null> {
  const target = modelTokens(profile.name, profile.brand);
  if (target.length === 0 || target[0] === 'x') return null;
  const brands = brandPatterns(profile.brand);
  const nameFilter = tokenRegex(target[0]);

  const siblingDocs = await SneakerProfile.find({ published: true, slug: { $ne: profile.slug }, brand: { $in: brands } })
    .select('name brand')
    .lean();
  const siblings = siblingDocs.map((p) => modelTokens(p.name, p.brand));
  const matches = makeMatcher(target, siblings, profile.brand);

  const since = new Date(Date.now() - MARKET_SCRAPE_DAYS * 24 * 60 * 60 * 1000);
  const [products, scraped] = await Promise.all([
    Product.find({
      brand: { $in: brands },
      name: nameFilter,
      comingSoon: { $ne: true },
      gender: { $ne: 'kids' },
      productType: { $nin: ['clothing', 'accessories'] },
    })
      .select('slug name price originalPrice productType sizes availableSizes stringSizes availableStringSizes variants soldOut comingSoon')
      .lean(),
    ScrapedProduct.find({
      brand: { $in: brands },
      name: nameFilter,
      status: { $ne: 'rejected' },
      gender: { $ne: 'kids' },
      price: { $gt: 0 },
      scrapedAt: { $gte: since },
    })
      .select('name price')
      .lean(),
  ]);

  const matchedProducts = products.filter((p) => matches(p.name));
  const priced = (await attachSellerOffers(matchedProducts))
    .map((p) => ({ slug: p.slug, price: p.offers.length > 0 ? Math.min(...p.offers.map((o) => o.price)) : 0 }))
    .filter((p) => p.price > 0)
    .sort((a, b) => a.price - b.price);

  const prices = [
    ...priced.map((p) => p.price),
    ...scraped.filter((s) => matches(s.name)).map((s) => s.price as number),
  ];
  if (prices.length === 0) return null;

  return {
    inrMin: Math.round(Math.min(...prices)),
    inrMax: Math.round(Math.max(...prices)),
    listings: prices.length,
    productSlugs: priced.slice(0, MARKET_SLUG_LIMIT).map((p) => p.slug),
  };
}

async function cachedMarket(profile: { name: string; brand: string; slug: string }): Promise<SneakerMarket | null> {
  const hit = marketCache.get(profile.slug);
  if (hit && Date.now() - hit.at < MARKET_CACHE_MS) return hit.value;
  const value = await computeMarket(profile);
  if (marketCache.size >= MARKET_CACHE_MAX) marketCache.clear();
  marketCache.set(profile.slug, { at: Date.now(), value });
  return value;
}

// GET /api/v1/sneaker-profiles — all published profiles
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await SneakerProfile.find({ published: true })
      .sort({ name: 1 })
      .select('slug name brand tagline category silhouette image releaseYear originalRetailPrice designer')
      .lean();
    res.json(profiles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profiles' });
  }
});

// GET /api/v1/sneaker-profiles/count — total published count (sitemap use)
router.get('/count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await SneakerProfile.countDocuments({ published: true });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count sneaker profiles' });
  }
});

// GET /api/v1/sneaker-profiles/slugs?page=N&limit=500 — paginated slugs (sitemap use)
router.get('/slugs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string || '1'));
    const limit = Math.min(500, parseInt(req.query.limit as string || '500'));
    const skip  = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      SneakerProfile.find({ published: true }).sort({ name: 1 }).skip(skip).limit(limit).select('slug').lean(),
      SneakerProfile.countDocuments({ published: true }),
    ]);
    res.json({ slugs: profiles.map((p) => p.slug), total, page, limit, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profile slugs' });
  }
});

// GET /api/v1/sneaker-profiles/:slug — single published profile
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await SneakerProfile.findOne({ slug: req.params.slug, published: true }).lean();
    if (!profile) { res.status(404).json({ error: 'Sneaker profile not found' }); return; }
    const market = await cachedMarket(profile).catch((err) => {
      console.error('[sneaker-profiles market]', err);
      return null;
    });
    res.json({ ...profile, market });
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profile' });
  }
});

export default router;
