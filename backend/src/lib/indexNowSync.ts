import { Blog } from '../models/Blog';
import { Drop } from '../models/Drop';
import { SneakerProfile } from '../models/SneakerProfile';
import { Product } from '../models/Product';
import { IndexNowLog } from '../models/IndexNowLog';
import { pingIndexNow } from './indexNow';

type SlugDoc = { slug: string };

const DUPLICATE_KEY = 11000;

async function publicPaths(): Promise<string[]> {
  const [blogs, drops, profiles, products] = await Promise.all([
    Blog.find({ published: true }).select('slug').lean<SlugDoc[]>(),
    Drop.find({ published: true }).select('slug').lean<SlugDoc[]>(),
    SneakerProfile.find({ published: true }).select('slug').lean<SlugDoc[]>(),
    Product.find({}).select('slug').lean<SlugDoc[]>(),
  ]);
  return [
    ...blogs.map((d) => `/blogs/${d.slug}`),
    ...drops.map((d) => `/drops/${d.slug}`),
    ...profiles.map((d) => `/sneakers/${d.slug}`),
    ...products.map((d) => `/products/${d.slug}`),
  ];
}

// Content published straight in Mongo never passes the admin routes that ping IndexNow,
// so a periodic diff against the paths already sent catches it. Returns the number sent.
export async function syncIndexNow(): Promise<number> {
  const paths = await publicPaths();
  const sent = new Set((await IndexNowLog.find({ path: { $in: paths } }).select('path').lean<{ path: string }[]>()).map((d) => d.path));
  const fresh = paths.filter((p) => !sent.has(p));
  if (fresh.length === 0) return 0;
  if (!(await pingIndexNow(fresh))) return 0;
  await IndexNowLog.insertMany(fresh.map((path) => ({ path, pingedAt: new Date() })), { ordered: false })
    .catch((err: { code?: number }) => { if (err.code !== DUPLICATE_KEY) throw err; });
  return fresh.length;
}
