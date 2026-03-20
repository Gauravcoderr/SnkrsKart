import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white mt-24">
      {/* Top strip */}
      <div className="border-b border-zinc-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display text-3xl tracking-[0.1em]">SNKRS CART</div>
          <p className="text-sm text-zinc-400 tracking-wide">
            Premium sneakers. Zero compromise.
          </p>
          <div className="flex items-center gap-4">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/snkrs_cart/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">Shop</h3>
            <ul className="space-y-2">
              {['New Arrivals', 'Trending', 'Sale', 'All Sneakers'].map((item) => (
                <li key={item}>
                  <Link href="/products" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">Brands</h3>
            <ul className="space-y-2">
              {['Nike', 'Adidas', 'New Balance', 'Asics', 'Puma', 'Vans'].map((brand) => (
                <li key={brand}>
                  <Link
                    href={`/products?brand=${brand.toLowerCase().replace(' ', '-')}`}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">Help</h3>
            <ul className="space-y-2">
              {['Size Guide', 'Shipping Info', 'Returns & Exchanges', 'Track My Order', 'FAQs'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">About</h3>
            <ul className="space-y-2">
              {['Our Story', 'Careers', 'Press', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} SNKRS CART. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-xs text-zinc-500 hover:text-zinc-300">Privacy Policy</Link>
            <Link href="#" className="text-xs text-zinc-500 hover:text-zinc-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
