'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { BRANDS } from '@/lib/constants';
import { SearchIcon, BagIcon, XIcon } from '@/components/ui/Icons';

export default function Navbar() {
  const { itemCount, toggleDrawer } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue('');
    }
  }

  const currentHref = pathname + (typeof window !== 'undefined' ? window.location.search : '');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xl font-black tracking-tight text-zinc-900">SNKRS</span>
            <span className="text-xl font-black tracking-tight text-zinc-400">CART</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/products"
              className={`relative px-3 py-1.5 text-sm font-semibold tracking-wide transition-all duration-200 rounded-sm ${
                pathname === '/products' && !currentHref.includes('brand') && !currentHref.includes('search')
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              All Shoes
            </Link>

            <div className="w-px h-4 bg-zinc-200 mx-2" />

            {BRANDS.map((brand) => {
              const isActive =
                typeof window !== 'undefined'
                  ? window.location.href.includes(encodeURIComponent(brand.label)) ||
                    window.location.href.includes(brand.label)
                  : false;
              return (
                <BrandLink
                  key={brand.slug}
                  href={`/products?brand=${brand.label}`}
                  label={brand.label}
                  accent={brand.navAccent}
                  isActive={isActive}
                />
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 animate-slide-in-up">
                <input
                  ref={inputRef}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search sneakers..."
                  className="w-48 sm:w-64 text-sm border border-zinc-200 rounded-none px-3 py-1.5 outline-none focus:border-zinc-900 bg-white"
                  onBlur={() => { if (!searchValue) setSearchOpen(false); }}
                />
                <button type="submit" aria-label="Submit search" className="p-1.5 text-zinc-900">
                  <SearchIcon />
                </button>
                <button
                  type="button"
                  aria-label="Close search"
                  className="p-1.5 text-zinc-400 hover:text-zinc-900"
                  onClick={() => { setSearchOpen(false); setSearchValue(''); }}
                >
                  <XIcon />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            )}

            <button
              type="button"
              onClick={toggleDrawer}
              className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              aria-label={`Cart (${itemCount} items)`}
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-zinc-900 text-white text-[10px] font-bold rounded-full px-1 animate-scale-in">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

function BrandLink({
  href,
  label,
  accent,
  isActive,
}: {
  href: string;
  label: string;
  accent: string;
  isActive: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const active = isActive || hovered;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative px-2.5 py-4 flex flex-col items-center justify-center group"
    >
      <span
        className="text-sm font-semibold tracking-wide transition-colors duration-200"
        style={{ color: active ? accent : '#71717a' }}
      >
        {label}
      </span>

      {/* Animated underline — slides in from left */}
      <span
        className="absolute bottom-0 left-0 h-[2.5px] transition-all duration-200 ease-out"
        style={{
          width: active ? '100%' : '0%',
          backgroundColor: accent,
          transformOrigin: 'left',
        }}
      />
    </Link>
  );
}
