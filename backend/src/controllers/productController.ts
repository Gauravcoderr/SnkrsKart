import { Request, Response } from 'express';
import { Product } from '../models/Product';

type MongoFilter = Record<string, any>;

function buildFilter(query: Record<string, string>): MongoFilter {
  const filter: MongoFilter = {};

  if (query.brand) {
    const brands = query.brand.split(',').map((b) => b.trim().replace(/-/g, ' '));
    // Case-insensitive exact match — uses the brand index unlike a mid-string regex
    filter.brand = { $in: brands.map((b) => new RegExp(`^${b}$`, 'i')) };
  }

  if (query.size) {
    const sizes = query.size.split(',').map(Number);
    filter.availableSizes = { $in: sizes };
  }

  if (query.color) {
    const colors = query.color.split(',').map((c) => c.trim().toLowerCase());
    filter.colors = { $in: colors };
  }

  if (query.gender) {
    const genders = query.gender.split(',').map((g) => g.trim().toLowerCase());
    filter.gender = { $in: genders };
  }

  if (query.minPrice) filter.price = { ...((filter.price as object) ?? {}), $gte: Number(query.minPrice) };
  if (query.maxPrice) filter.price = { ...((filter.price as object) ?? {}), $lte: Number(query.maxPrice) };

  if (query.search) {
    // Split into words so "adidas samba cow print" matches each term independently
    const words = query.search.trim().split(/\s+/).filter((w) => w.length > 1);
    if (words.length > 0) {
      filter.$or = words.flatMap((w) => {
        const re = new RegExp(w, 'i');
        return [{ name: re }, { brand: re }, { colorway: re }, { tags: re }];
      });
    }
  }

  return filter;
}

function buildSort(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'price_asc':  return { price: 1 };
    case 'price_desc': return { price: -1 };
    case 'newest':     return { createdAt: -1 };
    case 'popular':
    default:           return { reviewCount: -1 };
  }
}

// Fields needed for product cards — variants used in ProductCard for price/hover, sizes for display
const CARD_FIELDS =
  'slug name brand colorway gender price originalPrice discount images hoverImage ' +
  'availableSizes sizes colors variants featured trending newArrival soldOut comingSoon rating reviewCount category';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as Record<string, string>;
    const page  = Math.max(1, parseInt(query.page  || '1'));
    const limit = Math.min(48, parseInt(query.limit || '12'));
    const skip  = (page - 1) * limit;

    const filter = buildFilter(query);
    const userSort = buildSort(query.sort || 'popular');

    // comingSoon:-1 → true first; soldOut:1 → false first (soldOut last)
    const sort = { comingSoon: -1 as const, soldOut: 1 as const, ...userSort, _id: 1 as const };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).select(CARD_FIELDS).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products: products.map((p) => ({ ...p, id: (p._id as any).toString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json({ ...product, id: (product._id as any).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const getFeaturedProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ featured: true })
      .sort({ reviewCount: -1 })
      .limit(6)
      .select(CARD_FIELDS)
      .lean();
    res.json(products.map((p) => ({ ...p, id: (p._id as any).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
};

export const getNewArrivals = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ newArrival: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .select(CARD_FIELDS)
      .lean();
    res.json(products.map((p) => ({ ...p, id: (p._id as any).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch new arrivals' });
  }
};

export const getTrendingProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ trending: true })
      .sort({ reviewCount: -1 })
      .limit(8)
      .select(CARD_FIELDS)
      .lean();
    res.json(products.map((p) => ({ ...p, id: (p._id as any).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
};

export const getComingSoonProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ comingSoon: true })
      .sort({ createdAt: -1 })
      .limit(12)
      .select(CARD_FIELDS)
      .lean();
    res.json(products.map((p) => ({ ...p, id: (p._id as any).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coming soon products' });
  }
};
