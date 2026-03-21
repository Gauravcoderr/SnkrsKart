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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';
const OG_IMAGE = `${SITE_URL}/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: 'I0grEulg3kyDfy5QEuIn3nNrUPwBpamqI0Ak1SOup5k',
  },
  title: {
    default: 'SNKRS CART — Shop 100% Authentic Sneakers in India',
    template: '%s | SNKRS CART',
  },
  description:
    'Buy 100% authentic Nike, Adidas, Jordan, New Balance & Crocs sneakers online in India. Secure packaging, pan India shipping. No fakes, no compromise.',
  keywords: [
    'buy sneakers India', 'authentic sneakers India', 'Nike shoes India', 'Jordan shoes India',
    'Adidas sneakers India', 'New Balance India', 'SNKRS CART', 'sneakers online India',
    'original shoes India', 'limited edition sneakers India',
  ],
  authors: [{ name: 'SNKRS CART', url: SITE_URL }],
  creator: 'SNKRS CART',
  publisher: 'SNKRS CART',
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  appleWebApp: {
    title: 'SNKRS CART',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'SNKRS CART — 100% Authentic Sneakers in India',
    description: 'Buy authentic Nike, Jordan, Adidas & New Balance sneakers online. Pan India shipping. No fakes, no compromise.',
    url: SITE_URL,
    siteName: 'SNKRS CART',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'SNKRS CART — 100% Authentic Sneakers in India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SNKRS CART — 100% Authentic Sneakers in India',
    description: 'Authentic Nike, Jordan, Adidas & New Balance sneakers. Pan India shipping.',
    images: [OG_IMAGE],
    creator: '@snkrs_cart',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
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
