import { Router, Response } from 'express';
import { Coupon } from '../models/Coupon';
import { customerAuth, AuthRequest } from '../middleware/customerAuth';

const router = Router();

// POST /api/v1/coupons/validate — preview discount for a coupon code (logged-in only)
router.post('/validate', customerAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code, items } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ valid: false, error: 'Coupon code is required' });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ valid: false, error: 'Cart items are required' });
      return;
    }

    const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
    if (!coupon) {
      res.status(200).json({ valid: false, error: 'Invalid or inactive coupon code' });
      return;
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      res.status(200).json({ valid: false, error: 'This coupon has expired' });
      return;
    }

    const userId = req.user!.id;
    const alreadyUsed = coupon.usedBy.some((id) => String(id) === String(userId));
    if (alreadyUsed) {
      res.status(200).json({ valid: false, error: 'You have already used this coupon' });
      return;
    }

    // Compute eligible subtotal from client-sent items (preview only; orders.ts re-validates server-side)
    let eligibleSubtotal = 0;
    for (const item of items as any[]) {
      if (
        coupon.appliesTo === 'all' ||
        (item.productType && item.productType === coupon.appliesTo)
      ) {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        eligibleSubtotal += price * qty;
      }
    }

    if (eligibleSubtotal < coupon.minOrderValue) {
      const scope = coupon.appliesTo !== 'all' ? ` on ${coupon.appliesTo}` : '';
      res.status(200).json({
        valid: false,
        error: `Minimum order value of ₹${coupon.minOrderValue}${scope} required for this coupon`,
      });
      return;
    }

    let discountAmount: number;
    if (coupon.discountType === 'percentage') {
      const raw = Math.floor(eligibleSubtotal * coupon.discountValue / 100);
      discountAmount = coupon.maxDiscountAmount !== null
        ? Math.min(raw, coupon.maxDiscountAmount)
        : raw;
    } else {
      discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
    }

    const scopeLabel = coupon.appliesTo === 'all' ? '' : ` on ${coupon.appliesTo}`;
    const typeLabel = coupon.discountType === 'percentage'
      ? `${coupon.discountValue}% off${scopeLabel}`
      : `₹${coupon.discountValue} off${scopeLabel}`;
    const message = `${typeLabel} — ₹${discountAmount} saved`;

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      appliesTo: coupon.appliesTo,
      eligibleSubtotal,
      discountAmount,
      message,
    });
  } catch (err) {
    console.error('Coupon validate error:', err);
    res.status(500).json({ valid: false, error: 'Something went wrong. Try again.' });
  }
});

export default router;
