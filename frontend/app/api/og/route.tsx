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
    console.log('[OG] Fetching image:', imageUrl);
    try {
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)',
          'Accept': 'image/webp,image/jpeg,image/*',
          'Referer': 'https://snkrs-kart.vercel.app/',
        },
      });
      console.log('[OG] Fetch status:', res.status, res.headers.get('content-type'));
      if (res.ok) {
        const mime = res.headers.get('content-type') || 'image/jpeg';
        if (mime.includes('webp')) {
          console.log('[OG] Skipping WebP image — not supported by Satori');
        } else {
          const buf = await res.arrayBuffer();
          console.log('[OG] Image size bytes:', buf.byteLength);
          if (buf.byteLength < 3 * 1024 * 1024 && buf.byteLength > 0) {
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            imageSrc = `data:${mime};base64,${btoa(binary)}`;
            console.log('[OG] Image embedded as base64, length:', imageSrc.length);
          } else {
            console.log('[OG] Image too large or empty, skipping');
          }
        }
      } else {
        console.log('[OG] Fetch failed, CDN blocked request');
      }
    } catch (err) {
      console.log('[OG] Fetch error:', err);
    }
  }

  const formattedPrice = price
    ? `Rs. ${Number(price).toLocaleString('en-IN')}`
    : '';

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
            style={{ width: '500px', height: '630px', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', width: '500px', height: '630px', background: '#1a1a1a' }} />
        )}

        {/* Right panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingTop: '48px',
            paddingBottom: '48px',
            paddingLeft: '40px',
            paddingRight: '40px',
            flex: 1,
          }}
        >
          {/* Brand */}
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#888888' }}>
            {brand.toUpperCase()}
          </div>

          {/* Product name */}
          <div
            style={{
              fontSize: title.length > 40 ? '28px' : '34px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>

          {/* Price + badge */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {formattedPrice ? (
              <div style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                {formattedPrice}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#22c55e',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                paddingTop: '8px',
                paddingBottom: '8px',
                paddingLeft: '14px',
                paddingRight: '14px',
                marginBottom: '14px',
              }}
            >
              100% Authentic
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#444444' }}>
              SNKRS CART
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
