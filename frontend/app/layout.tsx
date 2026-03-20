import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import QueryProvider from '@/components/layout/QueryProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

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
    'Shop the latest and greatest sneakers from Nike, Adidas, New Balance, Asics, Puma & Vans. Premium kicks, zero compromise.',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
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
            <Header />
            <CartDrawer />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
