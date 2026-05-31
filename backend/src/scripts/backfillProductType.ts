import mongoose from 'mongoose';
import { Product } from '../models/Product';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  const result = await Product.updateMany(
    { productType: { $exists: false } },
    { $set: { productType: 'shoes' } }
  );
  console.log(`Backfilled productType='shoes' on ${result.modifiedCount} documents`);

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
