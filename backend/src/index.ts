import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import productRoutes from './routes/products';
import brandRoutes from './routes/brands';
import bannerRoutes from './routes/banners';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/banners', bannerRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 SNKRS CART API running on http://localhost:${PORT}`);
  connectDB().catch((err) => {
    console.error('❌ DB connection failed:', err);
  });
});
