import CartPageClient from './CartPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Bag — SNKRS CART',
};

// Cart is a fully client-side page (reads from localStorage)
export default function CartPage() {
  return <CartPageClient />;
}
