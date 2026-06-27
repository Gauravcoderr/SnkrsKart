import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WebP, or GIF allowed' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `deal-screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, file, { access: 'public' });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('[deal-verify/upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
