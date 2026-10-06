import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { applyRawTracking, RawTracking } from '../services/aftership';

const router = Router();

router.post('/aftership/webhook', (req: Request, res: Response): void => {
  const secret = process.env.AFTERSHIP_WEBHOOK_SECRET;
  const headerToken = process.env.AFTERSHIP_WEBHOOK_TOKEN;
  if (!secret && !headerToken) {
    console.warn('[aftership] webhook received but neither AFTERSHIP_WEBHOOK_SECRET nor AFTERSHIP_WEBHOOK_TOKEN is set');
    res.status(503).json({ error: 'Webhook auth not configured' });
    return;
  }
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  const safeEqual = (provided: string, expected: string) => {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return provided.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
  };
  const hmacOk = !!secret && safeEqual(
    String(req.headers['aftership-hmac-sha256'] || ''),
    crypto.createHmac('sha256', secret).update(raw).digest('base64'),
  );
  const tokenOk = !!headerToken && safeEqual(String(req.headers['x-snkrs-webhook-token'] || ''), headerToken);
  if (!hmacOk && !tokenOk) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  let payload: any;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  res.status(200).json({ received: true });

  const tracking: RawTracking | undefined = payload?.msg ?? payload?.data?.tracking ?? payload?.data;
  if (!tracking?.id) return;
  applyRawTracking(tracking)
    .then((r) => console.log(`[aftership] webhook ${tracking.slug}/${tracking.tracking_number} tag=${tracking.tag} → sellerOrders=${r.sellerOrders} orders=${r.orders}`))
    .catch((e) => console.error('[aftership] webhook apply failed', e));
});

export default router;
