import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const BACKEND = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SLUG_RE = /^[\w-]+$/;

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate token against backend with 5s timeout to avoid hanging on Render cold start
  const check = await fetch(`${BACKEND}/admin/products?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);

  if (!check || !check.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await request.json().catch(() => ({}));
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'Missing or invalid slug' }, { status: 400 });
  }

  revalidatePath(`/products/${slug}`);
  revalidatePath('/products');
  revalidatePath('/');
  return NextResponse.json({ revalidated: true, slug });
}
