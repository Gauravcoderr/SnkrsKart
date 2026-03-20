'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const navLinks = [
  { label: 'Shop', href: '/products' },
  { label: 'Brands', href: '#' },
  { label: 'New In', href: '/products?sort=newest' },
  { label: 'Sale', href: '/products?minPrice=0&maxPrice=8000' },
];

const BRANDS = [
  { name: 'Nike', slug: 'Nike', accent: '#111', desc: 'Just Do It' },
  { name: 'Jordan', slug: 'Jordan', accent: '#C8102E', desc: 'Jumpman Legacy' },
  { name: 'Adidas', slug: 'Adidas', accent: '#000', desc: 'Impossible Is Nothing' },
  { name: 'New Balance', slug: 'New Balance', accent: '#CF4520', desc: 'Fearlessly Independent' },
  { name: 'Crocs', slug: 'Crocs', accent: '#179A3A', desc: 'Come As You Are' },
];

const POPULAR_SEARCHES = [
  'Air Jordan 4',
  'Nike Dunk Low',
  'New Balance 530',
  'Adidas Samba',
  'Air Force 1',
  'Crocs Classic',
];

export default function Header() {
  const { itemCount, toggleDrawer } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const brandsTimeout = useRef<NodeJS.Timeout>();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Lock body scroll when search is open
  useEffect(() => {
    document.body.style.overflow = searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Fetch recommended products on open
      if (recommended.length === 0) {
        fetch(`${API}/products/trending`)
          .then((r) => r.ok ? r.json() : [])
          .then((data) => setRecommended(Array.isArray(data) ? data.slice(0, 4) : []))
          .catch(() => {});
      }
    }
  }, [searchOpen, recommended.length]);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API}/products?search=${encodeURIComponent(q.trim())}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      }
    } catch { /* ignore */ }
    setSearching(false);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(val), 300);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }

  function goToProduct(slug: string) {
    closeSearch();
    router.push(`/products/${slug}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  }

  function searchFor(term: string) {
    closeSearch();
    router.push(`/products?search=${encodeURIComponent(term)}`);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center">
              <Image src="/logo.jpg" alt="SNKRS CART" width={52} height={52} className="object-contain" priority />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) =>
                link.label === 'Brands' ? (
                  <div
                    key="brands"
                    className="relative"
                    onMouseEnter={() => { clearTimeout(brandsTimeout.current); setBrandsOpen(true); }}
                    onMouseLeave={() => { brandsTimeout.current = setTimeout(() => setBrandsOpen(false), 150); }}
                  >
                    <button type="button" className="px-3 py-1.5 text-sm font-semibold tracking-widest uppercase text-zinc-600 hover:text-zinc-900 transition-colors relative group">
                      Brands
                      <svg className={`inline-block ml-1 w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-transform ${brandsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {brandsOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-2">
                        <div className="w-[420px] bg-white rounded-xl border border-zinc-100 shadow-2xl shadow-black/8 overflow-hidden">
                          <div className="px-5 pt-4 pb-2">
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">Shop by Brand</p>
                          </div>
                          <div className="px-3 pb-2">
                            {BRANDS.map((brand) => (
                              <Link
                                key={brand.name}
                                href={`/products?brand=${brand.slug}`}
                                onClick={() => setBrandsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors group/item"
                              >
                                <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: brand.accent }}>
                                  {brand.name.charAt(0)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-zinc-900 group-hover/item:text-zinc-700">{brand.name}</p>
                                  <p className="text-[11px] text-zinc-400">{brand.desc}</p>
                                </div>
                                <svg className="w-4 h-4 text-zinc-300 group-hover/item:text-zinc-500 group-hover/item:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                              </Link>
                            ))}
                          </div>
                          <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100">
                            <Link href="/products" onClick={() => setBrandsOpen(false)} className="text-xs font-semibold tracking-widest uppercase text-zinc-600 hover:text-zinc-900 transition-colors">
                              View All Products →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-3 py-1.5 text-sm font-semibold tracking-widest uppercase text-zinc-600 hover:text-zinc-900 transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-zinc-900 group-hover:w-full transition-all duration-300" />
                  </Link>
                )
              )}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Search trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                aria-label="Search"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              </button>

              {/* Cart */}
              <button
                onClick={toggleDrawer}
                className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                aria-label="Open cart"
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-zinc-900 text-white text-[10px] font-bold rounded-full px-1">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-zinc-700 hover:text-zinc-900 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Search Overlay (Superkicks-style) ────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeSearch} />

          {/* Panel */}
          <div className="relative bg-white w-full animate-slide-down">
            {/* Search bar row */}
            <div className="border-b border-zinc-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <form onSubmit={handleSearchSubmit} className="flex items-center h-14 gap-3">
                  <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Search Sneakers"
                    className="flex-1 text-base outline-none bg-transparent placeholder-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    aria-label="Close search"
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 transition"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </form>
              </div>
            </div>

            {/* Content area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 max-h-[calc(100vh-56px)] overflow-y-auto">
              {hasQuery ? (
                /* ── Search results ────────────────────────────────────── */
                <div>
                  {searching && results.length === 0 && (
                    <div className="py-12 text-center text-sm text-zinc-400">Searching...</div>
                  )}
                  {!searching && results.length === 0 && query.length > 1 && (
                    <div className="py-12 text-center">
                      <p className="text-zinc-400 text-sm">No results found for &quot;{query}&quot;</p>
                      <p className="text-zinc-300 text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                  {results.length > 0 && (
                    <>
                      <p className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 mb-4">
                        Results
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {results.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => goToProduct(p.slug)}
                            className="text-left group rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all bg-white overflow-hidden"
                          >
                            <div className="aspect-square bg-zinc-50 p-3 flex items-center justify-center">
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div className="p-3">
                              <p className="text-xs text-zinc-500">{p.brand}</p>
                              <p className="text-sm font-semibold text-zinc-900 truncate mt-0.5">{p.name}</p>
                              <p className="text-xs text-zinc-400 truncate">{p.colorway}</p>
                              <p className="text-sm font-bold text-zinc-900 mt-1.5">{'\u20B9'}{p.price.toLocaleString('en-IN')}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-6 text-center">
                        <button
                          type="button"
                          onClick={() => { closeSearch(); router.push(`/products?search=${encodeURIComponent(query.trim())}`); }}
                          className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 underline underline-offset-4 transition"
                        >
                          View all results for &quot;{query}&quot;
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ── Default state: popular searches + recommended ──── */
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
                  {/* Left: Popular searches */}
                  <div>
                    <p className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 mb-3">
                      Popular Searches
                    </p>
                    <div className="space-y-1">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => searchFor(term)}
                          className="block w-full text-left px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Recommended products */}
                  <div>
                    <p className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400 mb-4">
                      Recommended For You
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {recommended.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => goToProduct(p.slug)}
                          className="text-left group rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all bg-white overflow-hidden"
                        >
                          <div className="aspect-square bg-zinc-50 p-3 flex items-center justify-center">
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-zinc-500">{p.brand}</p>
                            <p className="text-sm font-semibold text-zinc-900 truncate mt-0.5">{p.name}</p>
                            <p className="text-xs text-zinc-400 truncate">{p.colorway}</p>
                            <p className="text-sm font-bold text-zinc-900 mt-1.5">{'\u20B9'}{p.price.toLocaleString('en-IN')}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Menu ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-zinc-100 shadow-xl">
            <nav className="p-6 flex flex-col gap-4">
              <Link href="/products" onClick={() => setMobileOpen(false)} className="text-lg font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-500 transition-colors">
                Shop
              </Link>
              <Link href="/products?sort=newest" onClick={() => setMobileOpen(false)} className="text-lg font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-500 transition-colors">
                New In
              </Link>
              <Link href="/products?minPrice=0&maxPrice=8000" onClick={() => setMobileOpen(false)} className="text-lg font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-500 transition-colors">
                Sale
              </Link>

              <div className="pt-4 border-t border-zinc-100">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-400 mb-3">Brands</p>
                <div className="space-y-1">
                  {BRANDS.map((brand) => (
                    <Link
                      key={brand.name}
                      href={`/products?brand=${brand.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-50 transition"
                    >
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: brand.accent }}>
                        {brand.name.charAt(0)}
                      </span>
                      <span className="text-sm font-medium text-zinc-700">{brand.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
