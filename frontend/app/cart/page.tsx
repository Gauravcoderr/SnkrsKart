import CartPageClient from './CartPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Your Bag | Snkrs Cart' },
  robots: { index: false, follow: false },
};

// Cart is a fully client-side page (reads from localStorage)
export default function CartPage() {
  return <CartPageClient />;
}
