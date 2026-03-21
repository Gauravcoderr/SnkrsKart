import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || 'SNKRS CART';
  const brand = searchParams.get('brand') || '';
  const price = searchParams.get('price') || '';
  const imageUrl = searchParams.get('image') || '';

  // Try to fetch the product image and embed as base64 (bypasses CDN hotlink
  // blocks). Fall back to passing the URL directly so Satori can attempt it.
  let imageSrc = '';
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)',
          'Accept': 'image/webp,image/jpeg,image/*',
          'Referer': 'https://snkrs-kart.vercel.app/',
        },
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        // Skip base64 if image is too large (> 3 MB) to avoid memory issues
        if (buf.byteLength < 3 * 1024 * 1024) {
          const mime = res.headers.get('content-type') || 'image/jpeg';
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          imageSrc = `data:${mime};base64,${btoa(binary)}`;
        } else {
          imageSrc = imageUrl;
        }
      } else {
        // CDN rejected the fetch — let Satori try the URL directly
        imageSrc = imageUrl;
      }
    } catch {
      imageSrc = imageUrl;
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
                alignSelf: 'flex-start',
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
