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
    ],
  },
};

export default nextConfig;
