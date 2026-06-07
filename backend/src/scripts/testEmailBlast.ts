import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { sendProductLaunchBlast, sendBlogPublishBlast } from '../lib/marketingEmails';
import { Product } from '../models/Product';
import { Blog } from '../models/Blog';

async function main() {
  console.log('TEST_EMAIL:', process.env.TEST_EMAIL || '(not set — will send to all users!)');
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB\n');

  // Latest product
  const product = await Product.findOne().sort({ createdAt: -1 }).lean();
  if (product) {
    console.log(`→ Product blast: "${product.name}" (slug: ${product.slug})`);
    await sendProductLaunchBlast({
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      colorway: product.colorway,
      images: product.images,
      price: product.price,
    });
    console.log('  ✓ Product email queued\n');
  } else {
    console.log('  No products found in DB\n');
  }

  // Latest published blog
  const blog = await Blog.findOne({ published: true }).sort({ createdAt: -1 }).lean();
  if (blog) {
    console.log(`→ Blog blast: "${blog.title}" (slug: ${blog.slug})`);
    await sendBlogPublishBlast({
      title: blog.title,
      slug: blog.slug,
      coverImage: blog.coverImage,
      excerpt: blog.excerpt,
    });
    console.log('  ✓ Blog email queued\n');
  } else {
    console.log('  No published blogs found in DB\n');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
