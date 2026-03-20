'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const BRAND_LINKS = [
  { href: '/products?brand=Jordan',      label: 'Jordan',      accent: '#C8102E' },
  { href: '/products?brand=Nike',        label: 'Nike',        accent: '#111111' },
  { href: '/products?brand=Adidas',      label: 'Adidas',      accent: '#0052CC' },
  { href: '/products?brand=New Balance', label: 'New Balance', accent: '#E47911' },
  { href: '/products?brand=Crocs',       label: 'Crocs',       accent: '#179A3A' },
];

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

            {/* All Shoes pill */}
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

            {/* Divider */}
            <div className="w-px h-4 bg-zinc-200 mx-2" />

            {/* Brand links */}
            {BRAND_LINKS.map((link) => {
              const isActive = typeof window !== 'undefined'
                ? window.location.href.includes(encodeURIComponent(link.label)) || window.location.href.includes(link.label)
                : false;

              return (
                <BrandLink key={link.href} link={link} isActive={isActive} />
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
                <button type="submit" className="p-1.5 text-zinc-900">
                  <SearchIcon />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-zinc-400 hover:text-zinc-900"
                  onClick={() => { setSearchOpen(false); setSearchValue(''); }}
                >
                  <XIcon />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            )}

            <button
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

function BrandLink({ link, isActive }: { link: typeof BRAND_LINKS[0]; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);
  const active = isActive || hovered;

  return (
    <Link
      href={link.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative px-2.5 py-4 flex flex-col items-center justify-center group"
      style={{ color: active ? link.accent : undefined }}
    >
      <span
        className="text-sm font-semibold tracking-wide transition-colors duration-200"
        style={{ color: active ? link.accent : '#71717a' }}
      >
        {link.label}
      </span>

      {/* Animated underline — slides in from left */}
      <span
        className="absolute bottom-0 left-0 h-[2.5px] transition-all duration-200 ease-out"
        style={{
          width: hovered || isActive ? '100%' : '0%',
          backgroundColor: link.accent,
          transformOrigin: 'left',
        }}
      />
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
