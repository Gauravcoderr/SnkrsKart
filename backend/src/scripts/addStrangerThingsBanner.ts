import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { Banner } from '../models/Banner';

const CLOUD_NAME = 'dadulg5bs';
const UPLOAD_PRESET = 'Snkrs cart';

async function uploadLocalToCloudinary(filePath: string, publicId: string, folder: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const dataUri = `data:image/avif;base64,${base64}`;

  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${err}`);
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

async function main() {
  const localPath = '/Users/gauravrauthan/Downloads/dunk-low-x-stranger-things (1).avif';
  const publicId = 'nike-dunk-low-stranger-things-phantom-banner';

  console.log('Uploading image to Cloudinary...');
  const imageUrl = await uploadLocalToCloudinary(localPath, publicId, 'banners');
  console.log('Uploaded:', imageUrl);

  await connectDB();

  const maxOrder = await Banner.findOne().sort({ order: -1 }).select('order').lean();
  const nextOrder = (maxOrder?.order ?? 0) + 1;

  const banner = await Banner.create({
    brand: 'Nike',
    tag: 'Stranger Things Collab',
    headline: ['Dunk Low', 'Stranger Things'],
    sub: 'Phantom · Upside Down Edition',
    cta: 'Shop Now',
    href: '/products/nike-dunk-low-stranger-things-phantom',
    image: imageUrl,
    accent: '#e2231a',
    bg: 'linear-gradient(135deg,#0a0505 0%,#2a0808 50%,#4a1010 100%)',
    imgBg: '#1a0a05',
    order: nextOrder,
    active: true,
  });

  console.log('Banner created:', banner._id, 'order:', banner.order);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
