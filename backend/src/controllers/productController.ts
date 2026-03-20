import { Request, Response } from 'express';
import { Product } from '../models/Product';

type MongoFilter = Record<string, any>;

function buildFilter(query: Record<string, string>): MongoFilter {
  const filter: MongoFilter = {};

  if (query.brand) {
    const brands = query.brand.split(',').map((b) => b.trim());
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
    filter.$or = [
      { name: new RegExp(query.search, 'i') },
      { brand: new RegExp(query.search, 'i') },
      { colorway: new RegExp(query.search, 'i') },
      { tags: new RegExp(query.search, 'i') },
    ];
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

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as Record<string, string>;
    const page  = Math.max(1, parseInt(query.page  || '1'));
    const limit = Math.min(48, parseInt(query.limit || '12'));
    const skip  = (page - 1) * limit;

    const filter = buildFilter(query);
    const sort   = buildSort(query.sort || 'popular');

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const getFeaturedProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ featured: true }).sort({ reviewCount: -1 }).limit(6).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
};

export const getNewArrivals = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ newArrival: true }).sort({ createdAt: -1 }).limit(8).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch new arrivals' });
  }
};

export const getTrendingProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ trending: true }).sort({ reviewCount: -1 }).limit(8).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
};
