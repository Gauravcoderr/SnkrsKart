import { Router, Request, Response } from 'express';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

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

    res.json({ success: true });

    const FROM = process.env.RESEND_FROM || 'SNKRS CART <onboarding@resend.dev>';
    const storeEmail = process.env.GMAIL_USER || 'infosnkrscart@gmail.com';

    // Notify store
    resend.emails.send({
      from: FROM,
      to: storeEmail,
      subject: `New Seller Inquiry — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;color:#111;">
          <div style="background:#111;padding:16px 24px;text-align:center;">
            <img src="https://snkrs-kart.vercel.app/logo.jpg" alt="SNKRS CART" style="height:48px;width:auto;display:inline-block;" />
          </div>
          <div style="padding:24px;">
            <p style="font-size:16px;font-weight:bold;margin-top:0;">New Seller / Consignment Inquiry</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#666;width:130px;">Name</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Brands</td><td style="padding:8px 0;">${brandsSell || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Pairs/month</td><td style="padding:8px 0;">${pairsCount || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Message</td><td style="padding:8px 0;">${message || '—'}</td></tr>
            </table>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error('Seller inquiry email failed:', err));

    // Confirm to seller
    resend.emails.send({
      from: FROM,
      to: email,
      subject: 'We received your seller application — SNKRS CART',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
          <div style="background:#111;padding:20px 32px;text-align:center;">
            <img src="https://snkrs-kart.vercel.app/logo.jpg" alt="SNKRS CART" style="height:56px;width:auto;display:inline-block;" />
          </div>
          <div style="padding:32px;">
            <p style="font-size:16px;margin-top:0;">Hi <strong>${name}</strong>,</p>
            <p style="color:#444;">Thanks for reaching out! We've received your seller inquiry and will get back to you within 24–48 hours to discuss next steps.</p>
            <p style="color:#444;">In the meantime, feel free to WhatsApp or email us directly if you have any questions.</p>
            <p style="color:#888;font-size:13px;margin-top:32px;">— The SNKRS CART Team<br>Pauri Garhwal, Uttarakhand</p>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error('Seller confirm email failed:', err));
  } catch (err) {
    console.error('Seller inquiry error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

export default router;
