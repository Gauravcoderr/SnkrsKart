/**
 * Seeds MongoDB with the existing 30 products from products.json and brands.json
 *
 * Run: npm run seed
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Product } from '../src/models/Product';
import { Brand } from '../src/models/Brand';
import productsData from '../src/data/products.json';
import brandsData from '../src/data/brands.json';

async function main() {
  await connectDB();

  // Seed products
  console.log('🌱 Seeding products...');
  let productCount = 0;
  for (const p of productsData) {
    await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: p },
      { upsert: true, returnDocument: 'after' }
    );
    productCount++;
    process.stdout.write(`\r   ${productCount}/${productsData.length} products`);
  }
  console.log(`\n✅ ${productCount} products seeded`);

  // Seed brands
  console.log('🌱 Seeding brands...');
  let brandCount = 0;
  for (const b of brandsData) {
    await Brand.findOneAndUpdate(
      { slug: b.slug },
      { $set: b },
      { upsert: true, returnDocument: 'after' }
    );
    brandCount++;
  }
  console.log(`✅ ${brandCount} brands seeded`);

  await mongoose.disconnect();
  console.log('\n🎉 Database seeded successfully!');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
