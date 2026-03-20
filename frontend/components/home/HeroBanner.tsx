'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SLIDES = [
  {
    brand: 'JORDAN',
    tag: 'Nike Jordan',
    headline: 'FLY\nHIGHER.',
    sub: 'Air Jordan 1 Retro · AJKO Chicago',
    cta: 'Shop Jordans',
    href: '/products?brand=Nike',
    image: 'https://cdn.shopify.com/s/files/1/0360/6491/9692/files/1_7c1d02fd-72f7-480e-923c-6d71b8a9f988.png?v=1755094202',
    accent: '#C8102E',
    bg: '#0a0a0a',
    imgBg: '#f5f5f0',
  },
  {
    brand: 'NEW BALANCE',
    tag: 'New Balance',
    headline: 'BUILT\nDIFFERENT.',
    sub: 'BB550 · Oyster White / Olive',
    cta: 'Shop New Balance',
    href: '/products?brand=New+Balance',
    image: 'https://images.vegnonveg.com/resized/1400X1146/13820/new-balance-bb550-oyster-whiteolive-68a83c48d7350.jpg?format=webp',
    accent: '#CF8B00',
    bg: '#0f0f0f',
    imgBg: '#f0ede8',
  },
  {
    brand: 'ADIDAS',
    tag: 'Adidas',
    headline: 'NOTHING\nIS\nIMPOSSIBLE.',
    sub: 'Samba Wales Bonner · Collegiate Navy',
    cta: 'Shop Adidas',
    href: '/products?brand=Adidas',
    image: 'https://cdn.shopify.com/s/files/1/0360/6491/9692/files/adidasSambaWalesBonnerCollegiateNavy.png?v=1749203390',
    accent: '#ffffff',
    bg: '#111111',
    imgBg: '#e8eaf0',
  },
  {
    brand: 'CROCS',
    tag: 'Crocs',
    headline: 'COME\nAS\nYOU ARE.',
    sub: 'Classic Clog · Iconic Comfort',
    cta: 'Shop Crocs',
    href: '/products?brand=Crocs',
    image: 'https://images.vegnonveg.com/resized/1400X1146/7946/crocs-classic-lnd-clg-black-639bf1cac2dfc.jpg?format=webp',
    accent: '#FFD700',
    bg: '#0d0d0d',
    imgBg: '#f5f0e8',
  },
];

export default function HeroBanner() {
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning || idx === active) return;
      setTransitioning(true);
      setActive(idx);
      setTimeout(() => setTransitioning(false), 600);
    },
    [active, transitioning]
  );

  useEffect(() => {
    const t = setInterval(() => goTo((active + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [active, goTo]);

  const slide = SLIDES[active];

  return (
    <section
      className="relative w-full flex flex-col md:flex-row overflow-hidden"
      style={{ minHeight: 'calc(100vh - 64px)', background: slide.bg, transition: 'background 0.6s ease' }}
    >
      {/* Left: Text */}
      <div className="flex flex-col justify-between px-8 sm:px-12 lg:px-20 py-12 md:py-16 md:w-[52%] z-10">

        {/* Top tag */}
        <div className="flex items-center gap-3">
          <span className="w-6 h-px" style={{ background: slide.accent }} />
          <span className="text-[11px] font-bold tracking-[0.4em] uppercase" style={{ color: slide.accent }}>
            {slide.tag}
          </span>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-5 my-auto py-10">
          <h1
            className="font-black uppercase leading-[0.85] tracking-tighter text-white"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
          >
            {slide.headline.split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <p className="text-sm text-white/40 tracking-widest uppercase font-medium">
            {slide.sub}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <Link
              href={slide.href}
              className="inline-flex items-center gap-3 px-7 py-4 text-[11px] font-bold tracking-[0.25em] uppercase transition-opacity hover:opacity-80"
              style={{
                background: slide.accent,
                color: slide.accent === '#ffffff' ? '#000' : slide.accent === '#FFD700' ? '#000' : '#fff',
              }}
            >
              {slide.cta}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/products"
              className="text-[11px] font-bold tracking-[0.25em] uppercase text-white/30 hover:text-white transition-colors"
            >
              All Products
            </Link>
          </div>
        </div>

        {/* Bottom: slide dots + counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className="relative h-px overflow-hidden transition-all duration-500"
                style={{
                  width: i === active ? 40 : 16,
                  background: i === active ? slide.accent : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono text-white/20 tracking-widest">
            0{active + 1} / 0{SLIDES.length}
          </span>
        </div>
      </div>

      {/* Right: Product image */}
      <div
        className="relative md:w-[48%] h-72 md:h-auto"
        style={{
          background: slide.imgBg,
          transition: 'background 0.6s ease',
        }}
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-600"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            <Image
              src={s.image}
              alt={s.brand}
              fill
              priority={i === 0}
              className="object-contain p-8"
              sizes="(max-width: 768px) 100vw, 48vw"
            />
          </div>
        ))}

        {/* Brand watermark */}
        <div className="absolute bottom-6 right-6 z-10">
          <span
            className="text-[10px] font-black tracking-[0.4em] uppercase opacity-20"
            style={{ color: '#000' }}
          >
            {slide.brand}
          </span>
        </div>
      </div>
    </section>
  );
}
