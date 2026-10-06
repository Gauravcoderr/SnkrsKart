'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import ChatBot from './ChatBot';
import EmailCaptureModal from './EmailCaptureModal';
import WhatsAppFloat from './WhatsAppFloat';
import GoogleReviewsBadge from './GoogleReviewsBadge';

const PORTAL_PREFIXES = ['/admin', '/sellers'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortal = PORTAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPortal) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
      <ChatBot />
      <EmailCaptureModal />
      <WhatsAppFloat />
      <GoogleReviewsBadge />
    </>
  );
}
