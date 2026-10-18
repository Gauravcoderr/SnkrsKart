const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata = {
  title: { absolute: 'Become a Seller | Snkrs Cart' },
  description: 'Partner with SNKRS CART to sell authentic sneakers across India. List your pairs, get them photo-verified by our team and sell to buyers across India.',
  keywords: ['sell sneakers India', 'sneaker reseller India', 'become a seller SNKRS CART', 'sell authentic sneakers'],
  alternates: { canonical: `${SITE_URL}/sell` },
  openGraph: {
    title: 'Become a Seller | Snkrs Cart',
    description: 'Partner with SNKRS CART to sell authentic sneakers across India. Join our verified seller network.',
    url: `${SITE_URL}/sell`,
    siteName: 'Snkrs Cart',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Become a Seller | Snkrs Cart',
    description: 'Partner with SNKRS CART to sell authentic sneakers across India.',
  },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
