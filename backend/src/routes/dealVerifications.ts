import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { DealVerification } from '../models/DealVerification';
import { sendMail } from '../lib/mailer';

const router = Router();

// In-memory OTP store: email -> { hash, expiry, attempts }
const otpStore = new Map<string, { hash: string; expiry: number; attempts: number }>();

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// POST /api/v1/deals/send-otp
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();

    // 60s cooldown
    const existing = otpStore.get(cleanEmail);
    if (existing && existing.expiry - 240000 > Date.now()) {
      res.status(429).json({ error: 'Please wait 60 seconds before requesting another code' });
      return;
    }

    const otp = String(crypto.randomInt(100000, 999999));
    otpStore.set(cleanEmail, {
      hash: hashOtp(otp),
      expiry: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    sendMail({
      to: cleanEmail,
      subject: `${otp} — Verify your deal submission | SNKRS CART`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;text-align:center;padding:32px 24px;">
          <div style="background:#111;padding:16px;text-align:center;border-radius:8px 8px 0 0;">
            <img src="https://snkrs-kart.vercel.app/logo.jpg" alt="SNKRS CART" style="height:40px;width:auto;" />
          </div>
          <div style="background:#fafafa;padding:32px 24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
            <p style="color:#666;font-size:14px;margin:0 0 8px;">Your deal verification code</p>
            <p style="font-size:36px;font-weight:900;letter-spacing:8px;color:#111;margin:0 0 16px;font-family:monospace;">${otp}</p>
            <p style="color:#999;font-size:12px;margin:0;">Expires in 5 minutes. Do not share this code.</p>
          </div>
        </div>
      `,
    });

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('[deals/send-otp]', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/v1/deals/submit
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, productId, productSlug, productName, submittedUrl, urlMeta, screenshotUrl } = req.body;

    if (!email || !otp || !productId || !productSlug || !productName || !submittedUrl || !screenshotUrl) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const stored = otpStore.get(cleanEmail);
    if (!stored) {
      res.status(400).json({ error: 'No verification code found. Please request a new one.' });
      return;
    }
    if (Date.now() > stored.expiry) {
      otpStore.delete(cleanEmail);
      res.status(400).json({ error: 'Code has expired. Please request a new one.' });
      return;
    }
    if (stored.attempts >= 5) {
      otpStore.delete(cleanEmail);
      res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
      return;
    }
    if (hashOtp(otp.trim()) !== stored.hash) {
      stored.attempts += 1;
      otpStore.set(cleanEmail, stored);
      res.status(400).json({ error: 'Incorrect code. Please try again.', attemptsLeft: 5 - stored.attempts });
      return;
    }

    // OTP valid — clear it
    otpStore.delete(cleanEmail);

    const deal = await DealVerification.create({
      productId,
      productSlug,
      productName,
      submittedUrl,
      urlMeta: urlMeta ?? {},
      screenshotUrl,
      userEmail: cleanEmail,
    });

    // Notify admin
    const senderEmail = (process.env.EMAIL_FROM || 'SNKRS CART <infosnkrscart@gmail.com>')
      .match(/<(.+?)>/)?.[1] || 'infosnkrscart@gmail.com';
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || senderEmail;

    sendMail({
      to: adminEmail,
      subject: `New Deal Check: ${productName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 16px;">New Deal Verification Submitted</h2>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Submitted URL:</strong> <a href="${submittedUrl}">${submittedUrl}</a></p>
          <p><strong>User Email:</strong> ${cleanEmail}</p>
          <p><strong>Site:</strong> ${urlMeta?.siteName || 'Unknown'}</p>
          <br/>
          <a href="https://snkrs-kart.vercel.app/admin/deal-verifications" style="background:#111;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Review in Admin Panel</a>
        </div>
      `,
    });

    res.status(201).json({ success: true, id: deal._id });
  } catch (err) {
    console.error('[deals/submit]', err);
    res.status(500).json({ error: 'Failed to submit deal' });
  }
});

export default router;
