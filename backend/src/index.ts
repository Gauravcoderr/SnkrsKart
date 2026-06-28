import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database';
import productRoutes from './routes/products';
import brandRoutes from './routes/brands';
import bannerRoutes from './routes/banners';
import inquiryRoutes from './routes/inquiries';
import reviewRoutes from './routes/reviews';
import sellerRoutes from './routes/seller';
import blogRoutes from './routes/blogs';
import adminRoutes from './routes/admin';
import orderRoutes from './routes/orders';
import newsletterRoutes from './routes/newsletter';
import authRoutes from './routes/auth';
import restockRoutes from './routes/restock';
import chatLeadRoutes from './routes/chatLeads';
import dealVerificationRoutes from './routes/dealVerifications';
import loyaltyRoutes from './routes/loyalty';
import sneakerProfileRoutes from './routes/sneakerProfiles';
import dropRoutes from './routes/drops';
import siteContentRoutes from './routes/siteContent';
import couponRoutes from './routes/coupons';
import scraperIngestRoutes from './routes/scraperIngest';
import { startScraperJob } from './jobs/scraperJob';
import { initWhatsApp } from './services/whatsapp';

const app = express();
const PORT = process.env.PORT || 4000;

// Trust reverse proxy (Render, Vercel, etc.) so rate-limit can read X-Forwarded-For
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://snkrscart.com',
  'https://www.snkrscart.com',
];
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
// Raw body needed for Cashfree webhook signature verification (must be before express.json)
app.use('/api/v1/orders/cashfree/webhook', express.raw({ type: '*/*' }));
app.use(express.json());
app.use(cookieParser());

// Rate limit: 100 POST requests per IP per day on public write endpoints
const postLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again tomorrow.' },
  skip: (req) => req.method !== 'POST',
});

// Strict rate limit for admin login — 10 attempts per 15 minutes per IP
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

app.use('/api/v1/reviews', postLimiter);
app.use('/api/v1/inquiries', postLimiter);
app.use('/api/v1/orders', postLimiter);
app.use('/api/v1/auth/send-otp', postLimiter);
app.use('/api/v1/seller', postLimiter);
app.use('/api/v1/newsletter', postLimiter);

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/admin/login', adminLoginLimiter);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/restock', postLimiter);
app.use('/api/v1/restock', restockRoutes);
app.use('/api/v1/chat', postLimiter);
app.use('/api/v1/chat', chatLeadRoutes);
app.use('/api/v1/deals', postLimiter);
app.use('/api/v1/deals', dealVerificationRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/sneaker-profiles', sneakerProfileRoutes);
app.use('/api/v1/drops', dropRoutes);
app.use('/api/v1/site-content', siteContentRoutes);
app.use('/api/v1/coupons', postLimiter);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/scraper', scraperIngestRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/whatsapp-qr', (_req, res) => {
  const { getPairingCode } = require('./services/whatsapp');
  const code = getPairingCode();
  res.send(`<!DOCTYPE html><html><head><title>WhatsApp Pairing</title>
    <meta http-equiv="refresh" content="5">
    <style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
      min-height:100vh;background:#fff;font-family:sans-serif;text-align:center;}
      .code{font-size:48px;font-weight:900;letter-spacing:12px;color:#111;margin:16px 0;font-family:monospace;}
      p{color:#666;font-size:14px;max-width:360px;line-height:1.6;}</style></head>
    <body>
      <h2>WhatsApp Pairing Code</h2>
      ${code
        ? `<div class="code">${code}</div>
           <p>Open WhatsApp → Settings → Linked Devices → Link a Device → <strong>Link with phone number</strong><br>Enter this 8-digit code</p>`
        : `<p>Waiting for pairing code… (auto-refreshes)<br>Make sure <code>WHATSAPP_PHONE</code> is set in backend .env</p>`
      }
    </body></html>`);
});

app.listen(PORT, () => {
  console.log(`🚀 SNKRS CART API running on http://localhost:${PORT}`);
  connectDB()
    .then(async () => {
      const { ScrapedProduct } = await import('./models/ScrapedProduct');
      const del = await ScrapedProduct.deleteMany({ sourceSite: { $in: ['soleseriouss', 'nike'] } });
      if (del.deletedCount > 0) console.log(`[startup] Purged ${del.deletedCount} soleseriouss/nike products`);
      startScraperJob();
      if (process.env.WHATSAPP_ENABLED === 'true') initWhatsApp();
    })
    .catch((err) => {
      console.error('❌ DB connection failed:', err);
    });
});
