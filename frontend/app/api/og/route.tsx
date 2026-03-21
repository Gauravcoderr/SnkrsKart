import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || 'SNKRS CART';
  const brand = searchParams.get('brand') || '';
  const price = searchParams.get('price') || '';
  const imageUrl = searchParams.get('image') || '';

  // Proxy through wsrv.nl which converts any format (WebP, PNG, etc.) to JPEG
  // and serves it at a URL Satori can fetch directly — no manual base64 needed.
  const imageSrc = imageUrl
    ? `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&output=jpg&w=600&q=85`
    : '';

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
