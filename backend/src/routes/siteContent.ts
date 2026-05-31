import { Router, Request, Response } from 'express';
import { SiteContent } from '../models/SiteContent';

const router = Router();

router.get('/:pageKey', async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await SiteContent.findOne({ pageKey: req.params.pageKey }).lean();
    if (!content) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(content);
  } catch {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

export default router;
