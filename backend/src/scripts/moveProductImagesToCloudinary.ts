import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Product } from '../models/Product';
import { uploadToCloudinary } from './uploadBlogImage';

const DRY = process.argv.includes('--dry');
const FOLDER = 'product-images';
const BACKUP_DIR = path.resolve(__dirname, '../../../content-ml/data/backups');

function isCloudinary(url: string): boolean {
  try {
    return new URL(url).hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

function shortHash(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 6);
}

async function run() {
  await connectDB();
  const products = await Product.find({}).select('slug images hoverImage').lean();
  const todo = products.filter((p: any) =>
    [...(p.images || []), p.hoverImage].some((u: string) => u && !isCloudinary(u)),
  );
  console.log(`${todo.length} of ${products.length} products have images outside Cloudinary${DRY ? ' (dry run)' : ''}`);
  if (!todo.length) return;

  if (!DRY) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const file = path.join(BACKUP_DIR, `product-images-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(file, JSON.stringify(todo, null, 2));
    console.log(`Backup: ${file}`);
  }

  const moved = new Map<string, string>();
  let uploaded = 0;
  let failed = 0;
  let updated = 0;

  for (const p of todo as any[]) {
    console.log(p.slug);
    const move = async (url: string, label: string): Promise<string> => {
      if (!url || isCloudinary(url)) return url;
      const known = moved.get(url);
      if (known) return known;
      const publicId = `${p.slug}-${label}-${shortHash(url)}`;
      if (DRY) {
        console.log(`  would move ${label}: ${url.slice(0, 100)} -> ${FOLDER}/${publicId}`);
        return url;
      }
      try {
        const secure = await uploadToCloudinary(url, publicId, FOLDER);
        moved.set(url, secure);
        uploaded++;
        console.log(`  ${label}: ${secure}`);
        return secure;
      } catch (e) {
        failed++;
        console.log(`  FAILED ${label}: ${(e as Error).message}`);
        return url;
      }
    };

    const images: string[] = [];
    for (let i = 0; i < (p.images || []).length; i++) images.push(await move(p.images[i], `img-${i}`));
    const hoverImage = await move(p.hoverImage, 'hover');

    const changed = hoverImage !== p.hoverImage || images.some((u, i) => u !== p.images[i]);
    if (!DRY && changed) {
      await Product.updateOne({ _id: p._id }, { $set: { images, hoverImage } });
      updated++;
    }
  }

  console.log(`\nUploaded ${uploaded} images, ${failed} failed, ${updated} products updated.`);
}

run()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
