import 'dotenv/config';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';

const blogs = [
  {
    title: 'V.A.A. Air Jordan 1 "Alaska" — Virgil Abloh\'s Archive Drops Its First Sneaker',
    slug: 'vaa-air-jordan-1-alaska-virgil-abloh-archive',
    excerpt: 'The Virgil Abloh Archive, led by his widow Shannon Abloh, has released its debut sneaker — the V.A.A. Air Jordan 1 "Alaska." Here\'s everything you need to know.',
    coverImage: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80',
    author: 'SNKRS CART',
    tags: ['Jordan', 'Nike', 'Collaboration', 'Virgil Abloh', 'New Release'],
    metaTitle: 'V.A.A. Air Jordan 1 "Alaska" — Virgil Abloh Archive First Sneaker Drop | SNKRS CART',
    metaDescription: 'The Virgil Abloh Archive has released its first sneaker — the V.A.A. Air Jordan 1 "Alaska." Learn about the design, release date, and where to buy in India.',
    metaKeywords: 'V.A.A Air Jordan 1 Alaska, Virgil Abloh Archive sneaker, VAA Jordan 1, Off-White Jordan 1 2026, Jordan 1 new release India',
    published: true,
    content: `<p>Placeholder — seeded separately.</p>`.trim(),
  },
];

async function seed() {
  await connectDB();
  console.log('Connected to DB');

  for (const blog of blogs) {
    try {
      const res = await fetch(blog.coverImage, { method: 'HEAD' });
      if (!res.ok) console.warn(`⚠️  Image may not load for "${blog.slug}": ${blog.coverImage} (${res.status})`);
    } catch {
      console.warn(`⚠️  Could not reach image for "${blog.slug}": ${blog.coverImage}`);
    }
  }

  let added = 0;
  for (const blog of blogs) {
    const exists = await Blog.findOne({ slug: blog.slug });
    if (exists) {
      console.log(`⏭  Skipping "${blog.title}" — already exists`);
      continue;
    }
    await Blog.create(blog);
    console.log(`✅ Added: "${blog.title}"`);
    added++;
  }

  console.log(`\nDone — ${added} blog(s) added.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
