/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'snkrs-kart.vercel.app' }],
        destination: 'https://snkrscart.com/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/rss.xml',   destination: '/api/rss'  },
      { source: '/llms.txt',  destination: '/api/llms' },
    ];
  },
  images: {
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
    ],
  },
};

export default nextConfig;
