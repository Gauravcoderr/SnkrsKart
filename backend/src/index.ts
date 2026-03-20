import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

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

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 SNKRS CART API running on http://localhost:${PORT}`);
  connectDB().catch((err) => {
    console.error('❌ DB connection failed:', err);
  });
});
