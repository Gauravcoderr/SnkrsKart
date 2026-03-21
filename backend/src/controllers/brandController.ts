import { Request, Response } from 'express';
import { Brand } from '../models/Brand';

export const getAllBrands = async (_req: Request, res: Response): Promise<void> => {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

export const getBrandBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const brand = await Brand.findOne({ slug: req.params.slug }).lean();
    if (!brand) { res.status(404).json({ error: 'Brand not found' }); return; }
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
};
