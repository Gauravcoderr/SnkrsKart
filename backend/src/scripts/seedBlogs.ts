import 'dotenv/config';
import { connectDB } from '../config/database';
import { Blog } from '../models/Blog';

const blogs = [
  // ai-legit-check-sneakers-india-guide-2026 — seeded 2026-05-30
  // air-jordan-1-low-og-sail-india-2026, trophy-room-closing-marcus-jordan-sneaker-culture-2026, world-cup-2026-sneaker-collabs-messi-kith-thrasher-india — seeded 2026-06-05
  // willy-chavarria-adidas-copa-mundial-india-2026, asics-gel-lyte-iii-remastered-shigeyuki-mitsui-2026, new-balance-992-made-in-usa-shadow-grey-india-2026 — seeded 2026-06-08
  // air-jordan-3-bin-23-pinot-noir-june-2026, jjjjound-new-balance-1890-india-2026, sneaker-resale-crash-buyers-guide-2026 — seeded 2026-06-11
  // converse-shai-001-steel-india-2026, salomon-xt-6-gorpcore-india-2026, adidas-hyperboost-euphoria-new-boost-2026 — seeded 2026-06-15
  // vaa-air-jordan-1-alaska-virgil-abloh-archive — seeded 2026-06-18
  // a-ma-maniere-nike-pegasus-premium-2026, nike-air-max-goadome-low-sp-2026, onitsuka-tiger-ot-group-spin-off-2026 — seeded 2026-06-18
  {
    title: 'V.A.A. Air Jordan 1 "Alaska" — Virgil Abloh\'s Archive Drops Its First Sneaker',
    slug: 'vaa-air-jordan-1-alaska-virgil-abloh-archive',
    excerpt: 'The Virgil Abloh Archive, led by his widow Shannon Abloh, has released its debut sneaker — the V.A.A. Air Jordan 1 "Alaska." Here\'s everything you need to know.',
    coverImage: 'https://res.cloudinary.com/dadulg5bs/image/upload/v1781505523/blog-images/vaa-air-jordan-1-alaska-virgil-abloh-archive-cover-fix.jpg',
    author: 'SNKRS CART',
    tags: ['Jordan', 'Nike', 'Collaboration', 'Virgil Abloh', 'New Release'],
    metaTitle: 'V.A.A. Air Jordan 1 "Alaska" — Virgil Abloh Archive First Sneaker Drop | SNKRS CART',
    metaDescription: 'The Virgil Abloh Archive has released its first sneaker — the V.A.A. Air Jordan 1 "Alaska." Learn about the design, release date, and where to buy in India.',
    metaKeywords: 'V.A.A Air Jordan 1 Alaska, Virgil Abloh Archive sneaker, VAA Jordan 1, Off-White Jordan 1 2026, Jordan 1 new release India',
    published: true,
    content: `<p>Placeholder — seeded separately.</p>`.trim(),
  },
  // virat-kohli-one8-sneaker-india-2026, bape-adidas-adizero-evo-sl-2026, jaide-air-jordan-11-low-first-collab-2026 — seeded 2026-06-21
  // one8-global-premiere-virat-kohli-delhi-2026, one8-vs-hrx-celebrity-sportswear-india-2026, virat-kohli-one8-agilitas-equity-story-2026, puma-india-post-kohli-next-gen-ambassadors-2026 — seeded 2026-06-25
  // ronaldo-cr7-mercurial-gold-six-world-cups-2026, messi-f50-el-ultimo-tango-farewell-boot-2026, skechers-reebok-world-cup-2026-underdogs — seeded 2026-06-26
  // air-jordan-7-miro-barcelona-2026, kith-new-balance-2011-ronnie-fieg-2026, air-jordan-3-true-blue-2026 — seeded 2026-06-29
  // hidden-ny-asics-gel-kinetic-2-2026, new-balance-niobium-concept-1-tokyo-2026, nike-air-max-95-konbini-pack-2026 — seeded 2026-07-01
];

async function seed() {
  await connectDB();
  let added = 0;
  let skipped = 0;

  for (const blog of blogs) {
    const existing = await Blog.findOne({ slug: blog.slug });
    if (existing) {
      console.log(`⏭  Already exists: ${blog.slug}`);
      skipped++;
      continue;
    }
    await Blog.create(blog);
    console.log(`✅ Added: ${blog.slug}`);
    added++;
  }

  console.log(`\nDone. Added: ${added} | Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
