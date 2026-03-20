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
