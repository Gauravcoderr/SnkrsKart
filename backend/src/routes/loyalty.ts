import { Router, Response } from 'express';
import { customerAuth, AuthRequest } from '../middleware/customerAuth';
import { Loyalty, getTier, COINS_TO_RUPEE, MAX_REDEEM_PCT, MIN_REDEEM } from '../models/Loyalty';

const router = Router();

// GET /api/v1/loyalty/me — balance, tier, history
router.get('/me', customerAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loyalty = await Loyalty.findOne({ userId: req.user!.id }).lean();
    const coins = loyalty?.coins ?? 0;
    res.json({
      coins,
      tier: getTier(coins),
      history: (loyalty?.history ?? []).slice(-20).reverse(),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch loyalty balance' });
  }
});

// POST /api/v1/loyalty/redeem — validate redemption amount, return discount
router.post('/redeem', customerAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { coins, orderTotal } = req.body as { coins: number; orderTotal: number };

    if (!coins || coins < MIN_REDEEM) {
      res.status(400).json({ error: `Minimum redemption is ${MIN_REDEEM} coins` });
      return;
    }
    if (!orderTotal || orderTotal <= 0) {
      res.status(400).json({ error: 'Invalid order total' });
      return;
    }

    const loyalty = await Loyalty.findOne({ userId: req.user!.id });
    const available = loyalty?.coins ?? 0;

    if (coins > available) {
      res.status(400).json({ error: 'Insufficient Kart Coins' });
      return;
    }

    const rawDiscount = coins * COINS_TO_RUPEE;
    const maxDiscount = Math.floor(orderTotal * MAX_REDEEM_PCT);
    const discount = Math.min(rawDiscount, maxDiscount);
    const coinsUsed = discount / COINS_TO_RUPEE;

    res.json({ discount, coinsUsed });
  } catch {
    res.status(500).json({ error: 'Failed to process redemption' });
  }
});

export default router;
