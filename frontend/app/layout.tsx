import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import QueryProvider from '@/components/layout/QueryProvider';
import LayoutShell from '@/components/layout/LayoutShell';

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

export const metadata: Metadata = {
  title: 'SNKRS CART — Shop Premium Sneakers',
  description:
    'Shop the latest and greatest sneakers from Nike, Adidas, New Balance, Jordan & Crocs. Premium kicks, zero compromise.',
  appleWebApp: {
    title: 'SNKRS CART',
  },
  openGraph: {
    title: 'SNKRS CART',
    description: 'Premium sneakers. Zero compromise.',
    siteName: 'SNKRS CART',
    images: ['/logo.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className="bg-zinc-50 text-zinc-900 font-sans antialiased">
        <QueryProvider>
          <CartProvider>
            <LayoutShell>{children}</LayoutShell>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
