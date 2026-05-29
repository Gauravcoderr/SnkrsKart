const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata = {
  title: { absolute: 'Become a Seller | SNKRS CART' },
  description: 'Partner with SNKRS CART to sell authentic sneakers across India. Join our network of verified sneaker sellers and reach thousands of buyers.',
  keywords: ['sell sneakers India', 'sneaker reseller India', 'become a seller SNKRS CART', 'sell authentic sneakers'],
  alternates: { canonical: `${SITE_URL}/sell` },
  openGraph: {
    title: 'Become a Seller | SNKRS CART',
    description: 'Partner with SNKRS CART to sell authentic sneakers across India. Join our verified seller network.',
    url: `${SITE_URL}/sell`,
    siteName: 'SNKRS CART',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Become a Seller | SNKRS CART',
    description: 'Partner with SNKRS CART to sell authentic sneakers across India.',
  },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
