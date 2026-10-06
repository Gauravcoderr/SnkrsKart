import { Router, Request, Response } from 'express';
import { Seller } from '../models/Seller';
import { sendMail } from '../lib/mailer';
import { EMAIL_REASON, transactionalShell } from '../lib/emailLayout';

const router = Router();

// POST /api/v1/seller
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, brandsSell, pairsCount, message } = req.body;

    if (!name || !email || !phone) {
      res.status(400).json({ error: 'Name, email and phone are required' });
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    if (!emailValid) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    await Seller.create({ name, email, phone, brandsSell, pairsCount, message });

    res.json({ success: true });

    const storeEmail = process.env.GMAIL_USER || 'info@snkrscart.com';

    // Notify store
    sendMail({
      to: storeEmail,
      subject: `New Seller Inquiry — ${name}`,
      html: transactionalShell(`
            <p style="font-size:16px;font-weight:bold;margin-top:0;">New Seller / Consignment Inquiry</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#666;width:130px;">Name</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Brands</td><td style="padding:8px 0;">${brandsSell || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Pairs/month</td><td style="padding:8px 0;">${pairsCount || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Message</td><td style="padding:8px 0;">${message || '—'}</td></tr>
            </table>
      `, EMAIL_REASON.admin),
    });

    // Confirm to seller
    sendMail({
      to: email,
      subject: 'We received your seller application — SNKRS CART',
      html: transactionalShell(`
            <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>,</p>
            <p style="color:#444;">Thanks for reaching out! We've received your seller inquiry and will get back to you within 24–48 hours to discuss next steps.</p>
            <p style="color:#444;">In the meantime, feel free to WhatsApp or email us directly if you have any questions.</p>
      `, EMAIL_REASON.sellerApplication),
    });
  } catch (err) {
    console.error('Seller inquiry error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

export default router;
