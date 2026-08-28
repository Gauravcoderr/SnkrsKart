const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://checkout.razorpay.com https://sdk.cashfree.com https://accounts.google.com https://apis.google.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://snkrskart.onrender.com https://www.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://api.razorpay.com https://lumberjack.razorpay.com https://api.cashfree.com https://sandbox.cashfree.com https://accounts.google.com https://payments.cashfree.com",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://payments.cashfree.com https://sandbox.cashfree.com https://accounts.google.com https://translate.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'snkrs-kart.vercel.app' }],
        destination: 'https://www.snkrscart.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.snkrs-kart.vercel.app' }],
        destination: 'https://www.snkrscart.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'snkrscart.com' }],
        destination: 'https://www.snkrscart.com/:path*',
        permanent: true,
      },
      {
        source: '/blogs',
        has: [{ type: 'query', key: 'tag', value: '(?<tag>.+)' }],
        destination: '/blogs/tag/:tag',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/rss.xml',        destination: '/api/rss'        },
      { source: '/llms.txt',      destination: '/api/llms'       },
      { source: '/llms-full.txt', destination: '/api/llms-full'  },
      { source: '/llms-blogs.txt',destination: '/api/llms-blogs' },
      { source: '/llms-drops.txt',destination: '/api/llms-drops' },
      { source: '/security.txt', destination: '/.well-known/security.txt' },
    ];
  },
  images: {
    loader: 'custom',
    loaderFile: './src/cloudinary-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.vegnonveg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.culture-circle.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.footlocker.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.stockx.com', pathname: '/**' },
      { protocol: 'https', hostname: 'crepdogcrew.com', pathname: '/**' },
      { protocol: 'https', hostname: 'static.nike.com', pathname: '/**' },
      { protocol: 'https', hostname: 'limitededt.in', pathname: '/**' },
      { protocol: 'https', hostname: 'assets.adidas.com', pathname: '/**' },
      { protocol: 'https', hostname: 'captaincreps.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.superkicks.in', pathname: '/**' },
      { protocol: 'https', hostname: 'feature.com', pathname: '/**' },
      { protocol: 'https', hostname: 'sneakerpolitics.com', pathname: '/**' },
      { protocol: 'https', hostname: 'hustleculture.co.in', pathname: '/**' },
      { protocol: 'https', hostname: 'www.crocs.in', pathname: '/**' },
      { protocol: 'https', hostname: 'media.crocs.com', pathname: '/**' },
      { protocol: 'https', hostname: 'djm0962033frr.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: 'laceupclub.com', pathname: '/**' },
      { protocol: 'https', hostname: 'adn-static1.nykaa.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ypsogynovubjdriipnbu.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'sneakerbardetroit.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.sneaktorious.com', pathname: '/**' },
      { protocol: 'https', hostname: 'justfreshkicks.com', pathname: '/**' },
      { protocol: 'https', hostname: 'image-cdn.hypb.st', pathname: '/**' },
    ],
  },
};

export default nextConfig;
