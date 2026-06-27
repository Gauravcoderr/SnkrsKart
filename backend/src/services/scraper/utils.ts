import crypto from 'crypto'; // used for jitter + UA selection

export const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.70 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

export function jitter(min = 3000, max = 8000): Promise<void> {
  return new Promise((r) => setTimeout(r, crypto.randomInt(min, max)));
}

export function buildHeaders(referer: string): Record<string, string> {
  return {
    'User-Agent': UA_POOL[crypto.randomInt(0, UA_POOL.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': referer,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'DNT': '1',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };
}

export interface ScrapedItem {
  sourceUrl: string;
  sourceSite: 'myntra' | 'footlocker' | 'vegnonveg' | 'limitededt' | 'superkicks' | 'nike';
  name: string;
  brand: 'Nike' | 'Jordan';
  price?: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colorway?: string;
  sku?: string;
  description?: string;
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  tags?: string[];
}

export async function uploadToCloudinary(sourceImageUrl: string): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? 'dadulg5bs';
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET ?? 'Snkrs cart';

  const form = new FormData();
  form.append('file', sourceImageUrl);
  form.append('upload_preset', preset);
  form.append('folder', 'scraped-products');

  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = (await r.json()) as { secure_url?: string; error?: { message: string } };
  if (!data.secure_url) throw new Error(`Cloudinary: ${data.error?.message ?? 'upload failed'}`);
  return data.secure_url;
}
