import { Router, Request, Response } from 'express';
import { Newsletter } from '../models/Newsletter';
import { sendMail } from '../lib/mailer';
import { EMAIL_REASON, transactionalShell } from '../lib/emailLayout';
import { reactivateContact } from '../lib/syncUnsubscribes';

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

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await Newsletter.findOne({ email: cleanEmail }).lean();
    if (existing) {
      // Previously unsubscribed but now opting back in via the form —
      // reactivate: clear the flag here and un-blacklist on Brevo.
      if (existing.unsubscribed) {
        await reactivateContact(cleanEmail);
        res.json({ success: true, resubscribed: true });
        return;
      }
      res.json({ success: true, alreadySubscribed: true });
      return;
    }

    await Newsletter.create({ email: cleanEmail });
    res.status(201).json({ success: true });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

    sendMail({
      to: String(email).trim(),
      subject: 'You\'re in — SNKRS CART drop alerts',
      html: transactionalShell(`
            <p style="font-size:18px;font-weight:bold;margin-top:0;">You're on the list.</p>
            <p style="color:#444;font-size:14px;">
              You'll be the first to know about new drops, restocks, and exclusive deals on SNKRS CART.
              We don't spam — only the heat that matters.
            </p>
            <a href="${siteUrl}/products" style="display:inline-block;margin-top:16px;background:#111;color:#fff;padding:12px 24px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;">
              Browse Latest Drops →
            </a>
      `, EMAIL_REASON.newsletter),
    });

  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

export default router;
