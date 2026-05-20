import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET;
  const auth = req.headers.get('authorization') || '';
  if (!jwtSecret || !auth.startsWith('Bearer ')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const payload = jwt.verify(auth.slice(7), jwtSecret) as Record<string, unknown>;
    if (!payload.username) return new NextResponse('Unauthorized', { status: 401 });
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'HF_TOKEN not configured' }, { status: 500 });
  }

  const arrayBuffer = await req.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
  }

  const hfRes = await fetch(
    'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: arrayBuffer,
    }
  );

  if (!hfRes.ok) {
    const msg = await hfRes.text();
    return NextResponse.json({ error: msg }, { status: hfRes.status });
  }

  const imageBuffer = await hfRes.arrayBuffer();
  return new NextResponse(imageBuffer, {
    headers: { 'Content-Type': 'image/png' },
  });
}
