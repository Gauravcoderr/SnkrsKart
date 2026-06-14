import 'dotenv/config';
import mongoose from 'mongoose';
import { uploadBlogImageToCloudinary } from './uploadBlogImage';

const MONGODB_URI = process.env.MONGODB_URI!;

// Verified Crocs Unsplash photo (black Classic Clog on floor)
const CROCS_CLASSIC = 'https://images.unsplash.com/photo-1496114269798-2705b43a53ae?w=1200&q=80';

async function main() {
  console.log('Uploading Crocs images to Cloudinary...');

  const [riseOfCrocsCover, crocCollabInline] = await Promise.all([
    uploadBlogImageToCloudinary(CROCS_CLASSIC, 'rise-of-crocs-ugly-to-iconic-cover-fix'),
    uploadBlogImageToCloudinary(CROCS_CLASSIC, 'crocs-collab-sneakers-india-buy-2026-inline-1-fix'),
  ]);

  console.log('rise-of-crocs cover:', riseOfCrocsCover);
  console.log('crocs-collab inline:', crocCollabInline);

  await mongoose.connect(MONGODB_URI, { dbName: 'snkrs-cart' });

  const Blog = mongoose.model('Blog', new mongoose.Schema({}, { strict: false }));

  // Fix 1: rise-of-crocs cover image
  const r1 = await Blog.updateOne(
    { slug: 'rise-of-crocs-ugly-to-iconic' },
    { $set: { coverImage: riseOfCrocsCover } }
  );
  console.log(`rise-of-crocs: matched=${r1.matchedCount} modified=${r1.modifiedCount}`);

  // Fix 2: crocs-collab inline-1 image (wrong Air Jordan 1 image)
  const collabBlog = await Blog.findOne({ slug: 'crocs-collab-sneakers-india-buy-2026' }) as any;
  if (collabBlog) {
    const OLD_URL = 'https://res.cloudinary.com/dadulg5bs/image/upload/v1780079629/blog-images/crocs-collab-sneakers-india-buy-2026-inline-1.jpg';
    const OLD_ALT = 'Red black Air Jordan 1 sneakers on court — colourful sneaker style India';
    const NEW_ALT = 'Crocs collaboration clogs displayed — Crocs collab India 2026';

    let content: string = collabBlog.content;
    content = content.replace(OLD_URL, crocCollabInline);
    content = content.replace(OLD_ALT, NEW_ALT);

    const r2 = await Blog.updateOne(
      { slug: 'crocs-collab-sneakers-india-buy-2026' },
      { $set: { content } }
    );
    console.log(`crocs-collab: matched=${r2.matchedCount} modified=${r2.modifiedCount}`);
  } else {
    console.error('crocs-collab blog not found in DB');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
