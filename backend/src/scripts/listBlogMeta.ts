import 'dotenv/config';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';

async function run() {
  await connectDB();
  const blogs = await (Blog as any).find({}).select('slug coverImage title').lean();
  console.log('=== SLUGS ===');
  blogs.forEach((b: any) => console.log(b.slug));
  console.log('\n=== COVER_IMAGES ===');
  blogs.forEach((b: any) => console.log(b.coverImage));
  console.log('\n=== TITLES ===');
  blogs.forEach((b: any) => console.log(b.title));
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
