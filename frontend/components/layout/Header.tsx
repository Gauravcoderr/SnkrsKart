'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { label: 'Shop', href: '/products' },
  { label: 'Brands', href: '/products?sort=popular' },
  { label: 'New In', href: '/products?sort=newest' },
  { label: 'Sale', href: '/products?minPrice=0&maxPrice=8000' },
];

const brands = ['Nike', 'Adidas', 'New Balance', 'Jordan', 'Crocs'];

export default function Header() {
  const { itemCount, toggleDrawer } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandsMenuOpen, setBrandsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center">
              <Image
                src="/logo.jpg"
                alt="SNKRS CART"
                width={52}
                height={52}
                className="object-contain"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.label === 'Brands' ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setBrandsMenuOpen(true)}
                    onMouseLeave={() => setBrandsMenuOpen(false)}
                  >
                    <button className="text-sm font-semibold tracking-widest uppercase text-zinc-600 hover:text-zinc-900 transition-colors relative group py-1">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-zinc-900 group-hover:w-full transition-all duration-300" />
                    </button>
                    {/* Brands mega-dropdown */}
                    {brandsMenuOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-zinc-100 shadow-2xl p-4 animate-slide-in-up">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-3">
                          Shop by Brand
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {brands.map((brand) => (
                            <Link
                              key={brand}
                              href={`/products?brand=${brand.toLowerCase().replace(' ', '-')}`}
                              className="px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                            >
                              {brand}
                            </Link>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-zinc-100">
                          <Link
                            href="/products"
                            className="text-xs font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-600"
                          >
                            View All Brands →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm font-semibold tracking-widest uppercase text-zinc-600 hover:text-zinc-900 transition-colors relative group py-1"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-zinc-900 group-hover:w-full transition-all duration-300" />
                  </Link>
                )
              )}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-4">
              {/* Cart icon */}
              <button
                onClick={toggleDrawer}
                className="relative p-1 text-zinc-700 hover:text-zinc-900 transition-colors"
                aria-label="Open cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-1 text-zinc-700 hover:text-zinc-900 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-zinc-100 shadow-xl animate-slide-in-up">
            <nav className="p-6 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-semibold tracking-widest uppercase text-zinc-900 hover:text-zinc-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Brands</p>
                <div className="grid grid-cols-2 gap-2">
                  {brands.map((brand) => (
                    <Link
                      key={brand}
                      href={`/products?brand=${brand.toLowerCase().replace(' ', '-')}`}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                    >
                      {brand}
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
