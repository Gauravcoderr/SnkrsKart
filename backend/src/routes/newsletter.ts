import { Router, Request, Response } from 'express';
import { Newsletter } from '../models/Newsletter';
import { sendMail } from '../lib/mailer';

const router = Router();

// POST /api/v1/newsletter — subscribe
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    if (!emailValid) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    const existing = await Newsletter.findOne({ email: String(email).trim().toLowerCase() }).lean();
    if (existing) {
      res.json({ success: true, alreadySubscribed: true });
      return;
    }

    await Newsletter.create({ email: String(email).trim().toLowerCase() });
    res.status(201).json({ success: true });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

    sendMail({
      to: String(email).trim(),
      subject: 'You\'re in — SNKRS CART drop alerts',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111;">
          <div style="background:#111;padding:20px 32px;text-align:center;">
            <img src="${siteUrl}/logo.jpg" alt="SNKRS CART" style="height:48px;width:auto;" />
          </div>
          <div style="padding:32px;">
            <p style="font-size:18px;font-weight:bold;margin-top:0;">You're on the list.</p>
            <p style="color:#444;font-size:14px;">
              You'll be the first to know about new drops, restocks, and exclusive deals on SNKRS CART.
              We don't spam — only the heat that matters.
            </p>
            <a href="${siteUrl}/products" style="display:inline-block;margin-top:16px;background:#111;color:#fff;padding:12px 24px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;">
              Browse Latest Drops →
            </a>
            <p style="color:#aaa;font-size:11px;margin-top:32px;">
              You subscribed at snkrs-kart.vercel.app. To unsubscribe, reply to this email.
            </p>
          </div>
        </div>
      `,
    });

  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

export default router;
