import Link from 'next/link';
import {
  SITE_NAME,
  SITE_TAGLINE,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  INSTAGRAM_URL,
  BRANDS,
  FOOTER_SHOP_LINKS,
  FOOTER_HELP_LINKS,
  FOOTER_ABOUT_LINKS,
} from '@/lib/constants';
import { InstagramIcon, MailIcon, PhoneIcon } from '@/components/ui/Icons';

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white">
      {/* Top strip */}
      <div className="border-b border-zinc-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display text-3xl tracking-[0.1em]">{SITE_NAME}</div>
          <p className="text-sm text-zinc-400 tracking-wide">{SITE_TAGLINE}</p>
          <div className="flex items-center gap-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid [grid-template-columns:repeat(2,minmax(0,160px))] md:grid-cols-4 gap-4 xl:gap-8">

          {/* Shop */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">Shop</h3>
            <ul className="space-y-2">
              {FOOTER_SHOP_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">Brands</h3>
            <ul className="space-y-2">
              {BRANDS.map((brand) => (
                <li key={brand.slug}>
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {brand.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">Help</h3>
            <ul className="space-y-2">
              {FOOTER_HELP_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">About</h3>
            <ul className="space-y-2">
              {FOOTER_ABOUT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <MailIcon className="w-3.5 h-3.5 shrink-0" />
                {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:${CONTACT_PHONE_TEL}`}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
                {CONTACT_PHONE_DISPLAY}
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300">Terms of Service</Link>
            <Link href="/sitemap.xml" className="text-xs text-zinc-500 hover:text-zinc-300">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
