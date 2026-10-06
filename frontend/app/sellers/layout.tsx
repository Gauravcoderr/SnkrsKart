import type { Metadata } from 'next';
import SellerShell from '@/components/seller/SellerShell';

export const metadata: Metadata = {
  title: 'Seller Portal',
  robots: { index: false, follow: false },
};

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
