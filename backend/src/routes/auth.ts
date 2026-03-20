import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { customerAuth, AuthRequest } from '../middleware/customerAuth';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'snkrs-cart-jwt-s3cr3t-k3y-2026';
const FROM = process.env.RESEND_FROM || 'SNKRS CART <onboarding@resend.dev>';

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId, email, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  // Production (Render + Vercel = cross-origin) needs SameSite=None; Secure
  // NODE_ENV is set to 'production' by Render automatically
  const isProd = process.env.NODE_ENV === 'production';
  const cookieBase = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  };
  res.cookie('access_token', accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

// ─── Send OTP ──────────────────────────────────────────────────────────────

router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check cooldown (60s)
    let user = await User.findOne({ email: cleanEmail });
    if (user?.lastOtpSent) {
      const diff = Date.now() - new Date(user.lastOtpSent).getTime();
      if (diff < 60000) {
        res.status(429).json({ error: 'Please wait before requesting another code', retryAfter: Math.ceil((60000 - diff) / 1000) });
        return;
      }
    }

    // Generate 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));
    const hashed = hashOtp(otp);

    // Upsert user with OTP
    user = await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: {
          otp: hashed,
          otpExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 min
          otpAttempts: 0,
          lastOtpSent: new Date(),
        },
        $setOnInsert: { email: cleanEmail, name: '', phone: '' },
      },
      { upsert: true, new: true }
    );

    // Send OTP email via Resend
    resend.emails.send({
      from: FROM,
      to: cleanEmail,
      subject: `${otp} — Your SNKRS CART verification code`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;text-align:center;padding:32px 24px;">
          <div style="background:#111;padding:16px;text-align:center;border-radius:8px 8px 0 0;">
            <img src="https://snkrs-kart.vercel.app/logo.jpg" alt="SNKRS CART" style="height:40px;width:auto;" />
          </div>
          <div style="background:#fafafa;padding:32px 24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
            <p style="color:#666;font-size:14px;margin:0 0 16px;">Your verification code is</p>
            <p style="font-size:36px;font-weight:900;letter-spacing:8px;color:#111;margin:0 0 16px;font-family:monospace;">${otp}</p>
            <p style="color:#999;font-size:12px;margin:0;">Expires in 5 minutes. Do not share this code.</p>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error('OTP email failed:', err));

    const isNewUser = !user!.name;
    res.json({ message: 'OTP sent', isNewUser });
  } catch (err: any) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ─── Verify OTP ────────────────────────────────────────────────────────────

router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, name, phone } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.otp || !user.otpExpiry) {
      res.status(400).json({ error: 'No OTP requested for this email' });
      return;
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      await User.updateOne({ _id: user._id }, { $set: { otp: null, otpExpiry: null, otpAttempts: 0 } });
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Check max attempts
    if (user.otpAttempts >= 5) {
      await User.updateOne({ _id: user._id }, { $set: { otp: null, otpExpiry: null, otpAttempts: 0 } });
      res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
      return;
    }

    // Verify
    const hashed = hashOtp(otp.trim());
    if (hashed !== user.otp) {
      await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
      res.status(400).json({ error: 'Incorrect code. Please try again.', attemptsLeft: 5 - user.otpAttempts - 1 });
      return;
    }

    // OTP valid — update profile if provided
    const updates: Record<string, any> = {
      otp: null,
      otpExpiry: null,
      otpAttempts: 0,
    };
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), cleanEmail);
    updates.refreshToken = hashOtp(refreshToken);

    await User.updateOne({ _id: user._id }, { $set: updates });

    // Link any guest orders placed with this email to this user account
    Order.updateMany(
      { email: cleanEmail, userId: null },
      { $set: { userId: user._id } }
    ).catch(() => {});

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      accessToken,
      user: {
        id: user._id.toString(),
        email: cleanEmail,
        name: name || user.name,
        phone: phone || user.phone,
        addresses: user.addresses || [],
        isNewUser: !user.name && !name,
      },
    });
  } catch (err: any) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// ─── Refresh Token ─────────────────────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) { res.status(401).json({ error: 'No refresh token' }); return; }

    let decoded: { id: string; email: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== hashOtp(token)) {
      res.status(401).json({ error: 'Token revoked' });
      return;
    }

    // Rotate tokens
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashOtp(refreshToken) } });

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ message: 'Refreshed', accessToken });
  } catch {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// ─── Logout ────────────────────────────────────────────────────────────────

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.access_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      await User.updateOne({ _id: decoded.id }, { $set: { refreshToken: null } });
    } catch { /* ignore */ }
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookieBase = { httpOnly: true, secure: isProd, sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax' };
  res.clearCookie('access_token', cookieBase);
  res.clearCookie('refresh_token', cookieBase);
  res.json({ message: 'Logged out' });
});

// ─── Get Profile ───────────────────────────────────────────────────────────

router.get('/me', customerAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('-otp -otpExpiry -otpAttempts -lastOtpSent -refreshToken -__v').lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ ...user, id: user._id.toString() });
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── Update Profile ────────────────────────────────────────────────────────

router.put('/me', customerAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const user = await User.findByIdAndUpdate(req.user!.id, { $set: updates }, { new: true })
      .select('-otp -otpExpiry -otpAttempts -lastOtpSent -refreshToken -__v').lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ ...user, id: user._id.toString() });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── Addresses ─────────────────────────────────────────────────────────────

router.post('/me/addresses', customerAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { addressLine, city, state, pincode, isDefault } = req.body;
    if (!addressLine || !city || !state || !pincode) {
      res.status(400).json({ error: 'All address fields are required' });
      return;
    }

    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // If setting as default, unset others
    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({ addressLine, city, state, pincode, isDefault: isDefault || user.addresses.length === 0 });
    await user.save();

    res.status(201).json(user.addresses);
  } catch {
    res.status(500).json({ error: 'Failed to add address' });
  }
});

router.put('/me/addresses/:addressId', customerAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const addr = user.addresses.find((a) => a._id?.toString() === req.params.addressId);
    if (!addr) { res.status(404).json({ error: 'Address not found' }); return; }

    const { addressLine, city, state, pincode, isDefault } = req.body;
    if (addressLine) addr.addressLine = addressLine;
    if (city) addr.city = city;
    if (state) addr.state = state;
    if (pincode) addr.pincode = pincode;
    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
      addr.isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch {
    res.status(500).json({ error: 'Failed to update address' });
  }
});

router.delete('/me/addresses/:addressId', customerAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    user.addresses = user.addresses.filter((a) => a._id?.toString() !== req.params.addressId) as any;
    await user.save();
    res.json(user.addresses);
  } catch {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

export default router;
