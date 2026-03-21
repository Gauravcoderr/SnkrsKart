import { supabase } from '@/lib/supabase';

const SUPABASE_BUCKETS = ['Snkrs Cart Product Images', 'Snkrs Cart', 'Snkrs Carts'];

async function trySupabase(file: File, path: string): Promise<string | null> {
  for (const bucket of SUPABASE_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) {
      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
  }
  return null;
}

async function tryCloudinary(file: File): Promise<string | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) return null;

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.secure_url ?? null;
}

export async function uploadImage(file: File, folder: 'products' | 'blogs'): Promise<string> {
  const ext = file.name.split('.').pop() || 'webp';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabaseUrl = await trySupabase(file, path);
  if (supabaseUrl) return supabaseUrl;

  const cloudinaryUrl = await tryCloudinary(file);
  if (cloudinaryUrl) return cloudinaryUrl;

  throw new Error('All upload destinations are full or unavailable. Please try again later.');
}
