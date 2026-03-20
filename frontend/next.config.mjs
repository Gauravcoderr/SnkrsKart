/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
};

export default nextConfig;
