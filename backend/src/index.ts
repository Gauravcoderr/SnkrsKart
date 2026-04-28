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
import loyaltyRoutes from './routes/loyalty';

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
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/restock', postLimiter);
app.use('/api/v1/restock', restockRoutes);
app.use('/api/v1/chat', postLimiter);
app.use('/api/v1/chat', chatLeadRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 SNKRS CART API running on http://localhost:${PORT}`);
  connectDB().catch((err) => {
    console.error('❌ DB connection failed:', err);
  });
});
