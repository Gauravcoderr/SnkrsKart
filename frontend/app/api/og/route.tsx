import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || 'SNKRS CART';
  const brand = searchParams.get('brand') || '';
  const price = searchParams.get('price') || '';
  const imageUrl = searchParams.get('image') || '';

  // Fetch the external product image and convert to data URL so the edge
  // runtime can render it (external CDN URLs are blocked in ImageResponse).
  let imageSrc = '';
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const mime = res.headers.get('content-type') || 'image/jpeg';
        imageSrc = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
      }
    } catch {
      // fall through to no-image layout
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '1200px',
          height: '630px',
          background: '#111111',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Product image — left half */}
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={title}
            style={{
              width: '500px',
              height: '630px',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          <div style={{ display: 'flex', width: '500px', height: '630px', background: '#222' }} />
        )}

        {/* Right panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 40px',
            flex: 1,
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#888',
            }}
          >
            {brand}
          </div>

          {/* Product name */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </div>

          {/* Price + badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {price && (
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
                ₹{Number(price).toLocaleString('en-IN')}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#22c55e',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                width: 'fit-content',
              }}
            >
              ✓ 100% Authentic
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#555',
              }}
            >
              SNKRS CART
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
