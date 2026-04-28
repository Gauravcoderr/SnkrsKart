import 'dotenv/config';

const CLOUD_NAME = 'dadulg5bs';
const UPLOAD_PRESET = 'Snkrs cart';

export async function uploadToCloudinary(imageUrl: string, publicId: string, folder: string): Promise<string> {
  // Download image first with browser-like headers to bypass hotlink protection
  const imgRes = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': new URL(imageUrl).origin + '/',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!imgRes.ok) throw new Error(`Failed to download image (${imgRes.status}): ${imageUrl}`);

  const buffer = await imgRes.arrayBuffer();
  const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;

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

// Backwards-compatible wrapper used by the blog pipeline
export async function uploadBlogImageToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  return uploadToCloudinary(imageUrl, publicId, 'blog-images');
}

// CLI: npx ts-node --transpile-only src/scripts/uploadBlogImage.ts <imageUrl> <publicId> [folder]
if (require.main === module) {
  const [, , imageUrl, publicId, folder = 'blog-images'] = process.argv;
  if (!imageUrl || !publicId) {
    console.error('Usage: uploadBlogImage.ts <imageUrl> <publicId> [folder]');
    process.exit(1);
  }
  uploadToCloudinary(imageUrl, publicId, folder)
    .then(url => { console.log(url); process.exit(0); })
    .catch(e => { console.error(e.message); process.exit(1); });
}
