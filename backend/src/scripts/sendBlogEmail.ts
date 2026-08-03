import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import mongoose from 'mongoose';
import { sendMultipleBlogBlast } from '../lib/marketingEmails';
import { Blog } from '../models/Blog';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const slugs = [
    'travis-kelce-air-jordan-10-chiefs-pe-2026',
    'nike-air-force-1-low-floral-ir8617-900-india-2026',
    'pokemon-adidas-30th-anniversary-collection-india-2026',
  ];
  const blogs = await Blog.find({ slug: { $in: slugs }, published: true }).lean();
  if (!blogs.length) { console.log('No published blogs found'); process.exit(0); }
  console.log(`→ Sending combined email for ${blogs.length} blog(s)`);
  await sendMultipleBlogBlast(
    (blogs as any[]).map((b) => ({ title: b.title, slug: b.slug, coverImage: b.coverImage, excerpt: b.excerpt })),
  );
  console.log('✓ Email sent');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
