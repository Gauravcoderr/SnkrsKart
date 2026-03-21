import { Router, Request, Response } from 'express';
import { Restock } from '../models/Restock';

const router = Router();

// POST /api/v1/restock — save restock notification request
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, productSlug, size } = req.body;

    if (!email || !productSlug) {
      res.status(400).json({ error: 'Email and productSlug are required' });
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    if (!emailValid) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    await Restock.findOneAndUpdate(
      {
        email: String(email).trim().toLowerCase(),
        productSlug: String(productSlug).trim(),
        size: size != null ? Number(size) : null,
      },
      {
        $setOnInsert: {
          email: String(email).trim().toLowerCase(),
          productSlug: String(productSlug).trim(),
          size: size != null ? Number(size) : null,
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Restock notify error:', err);
    res.status(500).json({ error: 'Failed to save notification request' });
  }
});

export default router;
