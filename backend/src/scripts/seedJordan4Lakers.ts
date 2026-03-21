import 'dotenv/config';
import { connectDB } from '../config/database';
import { Product } from '../models/Product';

async function seed() {
  await connectDB();

  const existing = await Product.findOne({ slug: 'jordan-4-retro-lakers' });
  if (existing) {
    console.log('Product already exists, skipping.');
    process.exit(0);
  }

  await Product.create({
    slug: 'jordan-4-retro-lakers',
    name: 'Jordan 4 Retro Lakers',
    brand: 'Jordan',
    colorway: 'Imperial Purple / Multi-Color / Multi-Color',
    gender: 'men',
    price: 28499,
    originalPrice: 29999,
    discount: 5,
    images: [
      'https://laceupclub.com/cdn/shop/files/13_ce594875-b500-4e32-bf15-385e58bbe13c.png?v=1773244058',
    ],
    hoverImage: 'https://laceupclub.com/cdn/shop/files/13_ce594875-b500-4e32-bf15-385e58bbe13c.png?v=1773244058',
    sizes: [9],
    availableSizes: [9],
    colors: ['purple', 'yellow'],
    tags: ['jordan', 'retro', 'lakers', 'basketball', 'air-jordan-4'],
    variants: [{ size: 9, price: 28499, originalPrice: 29999, maxQty: 1 }],
    featured: false,
    trending: false,
    newArrival: false,
    soldOut: false,
    comingSoon: true,
    rating: 0,
    reviewCount: 0,
    description:
      'The Air Jordan 4 Retro "Lakers" features a rich Imperial Purple upper with striking yellow accents inspired by LA basketball heritage. Premium leather construction with breathable mesh panels, TPU wing supports, and visible heel Air cushioning deliver comfort and iconic style.',
    category: 'basketball',
    sku: 'FV5029-500',
  });

  console.log('✅ Jordan 4 Retro Lakers added successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
