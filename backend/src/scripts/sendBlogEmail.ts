import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import mongoose from 'mongoose';
import { sendMultipleBlogBlast } from '../lib/marketingEmails';
import { Blog } from '../models/Blog';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const slugs = [
    'one8-global-premiere-virat-kohli-delhi-2026',
    'one8-vs-hrx-celebrity-sportswear-india-2026',
    'virat-kohli-one8-agilitas-equity-story-2026',
    'puma-india-post-kohli-next-gen-ambassadors-2026',
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
