import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Banner } from '../models/Banner';

async function main() {
  await connectDB();

  const banners = await Banner.find();
  for (const b of banners) {
    if (b.headlineFontSize == null) b.headlineFontSize = 8;
    if (b.headlineFontWeight == null) b.headlineFontWeight = 900;
    await b.save();
    console.log(b.brand, b.headline.join(' '), '->', b.headlineFontSize, b.headlineFontWeight);
  }

  // Stranger Things hero word is long ("Stranger Things") — shrink it so it
  // never wraps/hyphen-breaks on narrow viewports.
  const st = await Banner.findOneAndUpdate(
    { href: '/products/nike-dunk-low-stranger-things-phantom' },
    { headlineFontSize: 5.5 },
    { returnDocument: 'after' }
  );
  console.log('Stranger Things size ->', st?.headlineFontSize);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
