import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate token against backend
  const check = await fetch(`${BACKEND}/admin/products?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  if (!check || !check.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await request.json().catch(() => ({}));
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  revalidatePath(`/products/${slug}`);
  return NextResponse.json({ revalidated: true, slug });
}
