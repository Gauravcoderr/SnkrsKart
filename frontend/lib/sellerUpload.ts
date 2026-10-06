const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadVerificationPhoto(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Photo upload is not configured. Contact SNKRS CART.');
  }
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', UPLOAD_PRESET);
  body.append('folder', 'seller-verifications');

  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body });
  } catch {
    throw new Error('Upload failed. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.secure_url !== 'string') {
    const reason = data?.error?.message ? ` (${data.error.message})` : '';
    throw new Error(`Photo upload failed${reason}. Please retake.`);
  }
  return data.secure_url as string;
}
