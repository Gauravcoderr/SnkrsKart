import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/components/layout/QueryProvider';
import LayoutShell from '@/components/layout/LayoutShell';
import AuthModal from '@/components/auth/AuthModal';
import EmailCaptureModal from '@/components/layout/EmailCaptureModal';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import GoogleAuthProvider from '@/components/auth/GoogleAuthProvider';
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

const SITE_URL = 'https://www.snkrscart.com';
const OG_IMAGE = `${SITE_URL}/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: 'yuc9DFa0CyTh7rMbHGwSDNI8fMjjZQVX58HiKJ0OW4I',
  },
  title: {
    default: 'SNKRS CART | Buy Authentic Sneakers, Streetwear & Accessories in India.',
    template: '%s | Snkrs Cart',
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
  authors: [{ name: 'Snkrs Cart', url: SITE_URL }],
  creator: 'Snkrs Cart',
  publisher: 'Snkrs Cart',
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
  appleWebApp: {
    title: 'SNKRS CART',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Snkrs Cart | Buy Authentic Sneakers, Streetwear & Accessories in India.',
    description: 'Shop 100% authentic sneakers, streetwear, bags & accessories in India. Trusted reselling platform with secure packaging and fast delivery.',
    url: SITE_URL,
    siteName: 'Snkrs Cart',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Snkrs Cart | Buy Authentic Sneakers, Streetwear & Accessories in India.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snkrs Cart | Buy Authentic Sneakers, Streetwear & Accessories in India.',
    description: 'Shop 100% authentic sneakers, streetwear, bags & accessories in India. Trusted reselling platform with secure packaging and fast delivery.',
    images: [OG_IMAGE],
    creator: '@snkrs_cart',
  },
};


const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Snkrs Cart',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
  description: 'India\'s premium sneaker store — 100% authentic Nike, Jordan, Adidas, New Balance & Crocs.',
  sameAs: [
    'https://www.instagram.com/snkrs_cart',
    'https://twitter.com/snkrs_cart',
    'https://www.facebook.com/snkrscart',
  ],
  foundingDate: '2020',
  knowsAbout: [
    'Nike Sneakers', 'Air Jordan', 'Adidas', 'New Balance', 'Crocs',
    'Authentic Sneakers India', 'Sneaker Authentication', 'Sneaker Resale India',
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
    streetAddress: 'House No. 4, Lingwal Bhawan, Circuit House Road',
    addressLocality: 'Pauri Garhwal',
    addressRegion: 'Uttarakhand',
    postalCode: '246001',
    addressCountry: 'IN',
  },
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Snkrs Cart',
  alternateName: 'Snkrs Cart',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const siteNavLd = [
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Shop Sneakers', url: `${SITE_URL}/products` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Nike',          url: `${SITE_URL}/brands/nike` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Jordan',        url: `${SITE_URL}/brands/jordan` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Adidas',        url: `${SITE_URL}/brands/adidas` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Sneaker Guide', url: `${SITE_URL}/sneakers` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Drop Calendar', url: `${SITE_URL}/drops` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Blog',          url: `${SITE_URL}/blogs` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'Size Guide',    url: `${SITE_URL}/size-guide` },
  { '@context': 'https://schema.org', '@type': 'SiteNavigationElement', name: 'FAQs',          url: `${SITE_URL}/faqs` },
];

const localBusinessLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Snkrs Cart',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  description: 'Buy 100% authentic sneakers online in India — Nike, Jordan, Adidas, New Balance & Crocs. Free pan-India shipping from Pauri Garhwal, Uttarakhand.',
  telephone: '+91-94109-03791',
  email: 'infosnkrscart@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'House No. 4, Lingwal Bhawan, Circuit House Road',
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
        <link rel="llms.txt" type="text/plain" href="/llms.txt" title="SNKRS CART AI Content Feed" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="AI Content Feed (llms.txt)" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="AI Full Content Feed (llms-full.txt)" />
        <link rel="openapi" type="application/yaml" href="/chatgpt-action-schema.yaml" title="SNKRS CART API Schema" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SNKRS CART" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#09090b" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `function googleTranslateElementInit(){new google.translate.TranslateElement({pageLanguage:'en',layout:google.translate.TranslateElement.InlineLayout.SIMPLE,autoDisplay:false},'google_translate_element')}`,
          }}
        />
        {/* Google tag (gtag.js) — GA4 G-S7VRFS4LLG */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://www.googletagmanager.com/gtag/js?id=G-S7VRFS4LLG" async />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-S7VRFS4LLG');`,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" />
      </head>
      <body className="bg-zinc-50 text-zinc-900 font-sans antialiased">
        <GoogleAuthProvider>
          <QueryProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <LayoutShell>{children}</LayoutShell>
                  <AuthModal />
                  <EmailCaptureModal />
                  <WhatsAppFloat />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </QueryProvider>
        </GoogleAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
