import { Router, Request, Response } from 'express';
import {
  getAllProducts,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getTrendingProducts,
  getComingSoonProducts,
} from '../controllers/productController';
import { Product } from '../models/Product';

const router = Router();

router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/trending', getTrendingProducts);
router.get('/coming-soon', getComingSoonProducts);

// GET /api/v1/products/count — total product count (sitemap use)
router.get('/count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await Product.countDocuments({});
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count products' });
  }
});

// GET /api/v1/products/slugs?page=N&limit=500 — sitemap use only, no limit cap
router.get('/slugs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string || '1'));
    const limit = Math.min(500, parseInt(req.query.limit as string || '500'));
    const skip  = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).select('slug createdAt').lean(),
      Product.countDocuments({}),
    ]);
    res.json({
      slugs: products.map((p) => ({ slug: p.slug, createdAt: p.createdAt })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch product slugs' });
  }
});

// GET /api/v1/products/feed — full catalogue for feeds / llms.txt / schema (frontend lib/catalog.ts).
// Every product, feed fields incl. sku + description, no pagination cap. Cached 1h upstream.
router.get('/feed', async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .select('slug name brand colorway colors gender price originalPrice discount images hoverImage ' +
              'sizes availableSizes stringSizes availableStringSizes productType soldOut comingSoon ' +
              'releaseDate description sku category tags faqs rating reviewCount ' +
              'featured trending newArrival createdAt')
      .lean();
    res.json({ products: products.map((p) => ({ ...p, id: (p._id as any).toString() })), total: products.length });
  } catch {
    res.status(500).json({ error: 'Failed to build product feed' });
  }
});

router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);

export default router;
