import Link from 'next/link';

export const metadata = {
  title: '404 — Page Not Found | SNKRS CART',
};

const LINKS = [
  { href: '/products', label: 'All Sneakers' },
  { href: '/products?brand=Nike', label: 'Nike' },
  { href: '/products?brand=Jordan', label: 'Jordan' },
  { href: '/products?brand=Adidas', label: 'Adidas' },
  { href: '/products?brand=New+Balance', label: 'New Balance' },
];

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 select-none overflow-hidden relative">

      {/* Giant background 404 */}
      <p
        aria-hidden
        className="absolute inset-0 flex items-center justify-center text-[28vw] font-black tracking-tighter text-zinc-100 pointer-events-none leading-none"
        style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
      >
        404
      </p>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-400 mb-4">
          SNKRS CART
        </p>

        <h1
          className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 leading-none mb-4"
          style={{ fontFamily: 'var(--font-bebas), sans-serif' }}
        >
          WRONG<br />COLORWAY.
        </h1>

        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          This page has been pulled from shelves.<br />
          Check the URL or browse what&apos;s actually in stock.
        </p>

        {/* Quick links */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-bold tracking-widest uppercase px-4 py-2 border border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="inline-block bg-zinc-900 text-white px-10 py-3.5 text-sm font-bold tracking-[0.2em] uppercase hover:bg-zinc-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {/* Bottom ticker tape */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-zinc-100 bg-white py-2.5">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300 mx-6">
              SNKRS CART &nbsp;·&nbsp; 100% AUTHENTIC &nbsp;·&nbsp; PAN INDIA SHIPPING &nbsp;·&nbsp; NO FAKES
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
