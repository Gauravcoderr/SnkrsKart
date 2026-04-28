import 'dotenv/config';

const CLOUD_NAME = 'dadulg5bs';
const UPLOAD_PRESET = 'Snkrs cart';
const FOLDER = 'blog-images';

export async function uploadBlogImageToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', FOLDER);
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

// CLI: npx ts-node --transpile-only src/scripts/uploadBlogImage.ts <imageUrl> <publicId>
async function main() {
  const [, , imageUrl, publicId] = process.argv;
  if (!imageUrl || !publicId) {
    console.error('Usage: uploadBlogImage.ts <imageUrl> <publicId>');
    process.exit(1);
  }
  const url = await uploadBlogImageToCloudinary(imageUrl, publicId);
  console.log(url);
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
