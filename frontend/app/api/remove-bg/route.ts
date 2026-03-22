import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'HF_TOKEN not configured' }, { status: 500 });
  }

  const arrayBuffer = await req.arrayBuffer();

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
