import { Router, Request, Response } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';

const router = Router();

// GET /api/v1/reviews?productSlug=...
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productSlug } = req.query as { productSlug?: string };
    const filter = productSlug ? { productSlug } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/v1/reviews/recent — latest 6 across all products
router.get('/recent', async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(6).lean();
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Failed to fetch recent reviews' });
  }
});

// POST /api/v1/reviews
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productSlug, productName, name, rating, comment } = req.body;

    if (!productSlug || !productName || !name || !rating || !comment) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }
    if (String(name).trim().length > 80) {
      res.status(400).json({ error: 'Name must be 80 characters or fewer' });
      return;
    }
    if (String(comment).trim().length > 1000) {
      res.status(400).json({ error: 'Review must be 1000 characters or fewer' });
      return;
    }

    const review = await Review.create({ productSlug, productName, name: name.trim(), rating, comment: comment.trim() });

    // Update product's rating and reviewCount (skip for general site reviews)
    if (productSlug !== 'general') {
      const allReviews = await Review.find({ productSlug }).lean();
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await Product.findOneAndUpdate(
        { slug: productSlug },
        { rating: Math.round(avgRating * 10) / 10, reviewCount: allReviews.length }
      );
    }

    res.status(201).json(review);
  } catch {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
