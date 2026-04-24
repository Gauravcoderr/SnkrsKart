import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/layout/QueryProvider';
import LayoutShell from '@/components/layout/LayoutShell';
import AuthModal from '@/components/auth/AuthModal';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';
const OG_IMAGE = `${SITE_URL}/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: 'yuc9DFa0CyTh7rMbHGwSDNI8fMjjZQVX58HiKJ0OW4I',
  },
  title: {
    default: 'SNKRS CART | Buy Authentic Sneakers, Streetwear & Accessories in India.',
    template: '%s | SNKRS CART',
  },
  description:
    'Shop 100% authentic sneakers, streetwear, bags & accessories in India. Trusted reselling platform with secure packaging and fast delivery.',
  keywords: [
    'buy sneakers India', 'authentic sneakers India', 'Nike shoes India', 'Jordan shoes India',
    'Adidas sneakers India', 'New Balance India', 'SNKRS CART', 'sneakers online India',
    'original shoes India', 'limited edition sneakers India',
    'cheap Nike sneakers India', 'affordable Jordan shoes India',
    'cheap New Balance shoes', 'best price sneakers India',
    'sneakers under 5000 India', 'cheapest Jordan shoes India',
    'budget sneakers India', 'Nike shoes price in India',
    'buy cheap Adidas shoes India', 'affordable sneakers online India',
  ],
  authors: [{ name: 'SNKRS CART', url: SITE_URL }],
  creator: 'SNKRS CART',
  publisher: 'SNKRS CART',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: { canonical: SITE_URL },
  appleWebApp: {
    title: 'SNKRS CART',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'SNKRS CART | Buy Authentic Sneakers, Streetwear & Accessories in India.',
    description: 'Shop 100% authentic sneakers, streetwear, bags & accessories in India. Trusted reselling platform with secure packaging and fast delivery.',
    url: SITE_URL,
    siteName: 'SNKRS CART',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'SNKRS CART | Buy Authentic Sneakers, Streetwear & Accessories in India.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SNKRS CART | Buy Authentic Sneakers, Streetwear & Accessories in India.',
    description: 'Shop 100% authentic sneakers, streetwear, bags & accessories in India. Trusted reselling platform with secure packaging and fast delivery.',
    images: [OG_IMAGE],
    creator: '@snkrs_cart',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SNKRS CART',
  alternateName: 'SNKRS CART',
  url: SITE_URL,
  description: 'Buy 100% authentic Nike, Adidas, Jordan, New Balance & Crocs sneakers online in India.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SNKRS CART',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
  description: 'India\'s premium sneaker store — 100% authentic Nike, Jordan, Adidas, New Balance & Crocs.',
  sameAs: [
    'https://www.instagram.com/snkrs_cart',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-94109-03791',
    contactType: 'customer service',
    email: 'infosnkrscart@gmail.com',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Pauri Garhwal',
    addressLocality: 'Pauri Garhwal',
    addressRegion: 'Uttarakhand',
    postalCode: '246001',
    addressCountry: 'IN',
  },
};

const localBusinessLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'SNKRS CART',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  description: 'Buy 100% authentic sneakers online in India — Nike, Jordan, Adidas, New Balance & Crocs. Free pan-India shipping from Pauri Garhwal, Uttarakhand.',
  telephone: '+91-94109-03791',
  email: 'infosnkrscart@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Pauri Garhwal',
    addressLocality: 'Pauri Garhwal',
    addressRegion: 'Uttarakhand',
    postalCode: '246001',
    addressCountry: 'IN',
  },
  openingHours: 'Mo-Sa 10:00-19:00',
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'UPI, Bank Transfer, Cash on Delivery',
  areaServed: 'IN',
  hasMap: 'https://maps.google.com/?q=Pauri+Garhwal,Uttarakhand,India',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <head>
        <link rel="alternate" type="application/rss+xml" title="SNKRS CART Blog" href="/rss.xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SNKRS CART" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#09090b" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
      </head>
      <body className="bg-zinc-50 text-zinc-900 font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <LayoutShell>{children}</LayoutShell>
                <AuthModal />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
