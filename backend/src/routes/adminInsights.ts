import { Router, Response } from 'express';
import { adminAuth, AdminRequest } from '../middleware/adminAuth';
import { loadDailyInsights } from '../lib/dailyInsights';

const router = Router();
router.use(adminAuth);

router.get('/daily', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    res.json(await loadDailyInsights());
  } catch (err) {
    console.error('[insights] daily load failed:', (err as Error).message);
    res.status(500).json({ error: 'Failed to load insights' });
  }
});

export default router;
