'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SLIDES = [
  {
    brand: 'JORDAN',
    tag: 'Nike',
    headline: 'FLY\nHIGHER.',
    sub: 'Air Jordan Collection',
    cta: 'Shop Jordans',
    href: '/products?brand=Nike',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961a28d?w=1600&q=90',
    accent: '#C8102E',
    bg: '#0a0a0a',
  },
  {
    brand: 'NEW BALANCE',
    tag: 'New Balance',
    headline: 'BUILT\nDIFFERENT.',
    sub: 'Crafted for the streets',
    cta: 'Shop New Balance',
    href: '/products?brand=New+Balance',
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1600&q=90',
    accent: '#CF8B00',
    bg: '#0f0f0f',
  },
  {
    brand: 'ADIDAS',
    tag: 'Adidas',
    headline: 'NOTHING\nIS\nIMPOSSIBLE.',
    sub: 'Originals & Performance',
    cta: 'Shop Adidas',
    href: '/products?brand=Adidas',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1600&q=90',
    accent: '#ffffff',
    bg: '#111111',
  },
  {
    brand: 'CROCS',
    tag: 'Crocs',
    headline: 'COME\nAS\nYOU ARE.',
    sub: 'Iconic Clogs & Slides',
    cta: 'Shop Crocs',
    href: '/products?brand=Crocs',
    image: 'https://images.unsplash.com/photo-1643185540617-a9c698f6b81f?w=1600&q=90',
    accent: '#FFD700',
    bg: '#0d0d0d',
  },
];

export default function HeroBanner() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning || idx === active) return;
      setPrev(active);
      setActive(idx);
      setTransitioning(true);
      setTimeout(() => {
        setPrev(null);
        setTransitioning(false);
      }, 700);
    },
    [active, transitioning]
  );

  useEffect(() => {
    const t = setInterval(() => {
      goTo((active + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, [active, goTo]);

  const slide = SLIDES[active];

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden select-none" style={{ background: slide.bg }}>

      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === active ? 1 : i === prev ? 0 : 0, zIndex: i === active ? 1 : i === prev ? 0 : -1 }}
        >
          <Image
            src={s.image}
            alt={s.brand}
            fill
            priority={i === 0}
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-10 lg:py-16">

        {/* Top: brand tag */}
        <div className="flex items-center gap-3">
          <span className="w-8 h-px" style={{ background: slide.accent }} />
          <span className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: slide.accent }}>
            {slide.tag}
          </span>
        </div>

        {/* Middle: headline */}
        <div className="flex flex-col gap-6 max-w-2xl">
          <h1
            className="font-black uppercase leading-[0.88] tracking-tighter text-white"
            style={{ fontSize: 'clamp(4rem, 12vw, 10rem)' }}
          >
            {slide.headline.split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-white/50">
            {slide.sub}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link
              href={slide.href}
              className="inline-flex items-center gap-3 px-8 py-4 text-xs font-bold tracking-[0.25em] uppercase text-black transition-opacity hover:opacity-80"
              style={{ background: slide.accent === '#ffffff' ? '#ffffff' : slide.accent }}
            >
              {slide.cta}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/products"
              className="text-xs font-bold tracking-[0.25em] uppercase text-white/50 hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Bottom: slide controls */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative h-px overflow-hidden transition-all duration-300"
                style={{ width: i === active ? 48 : 20, background: 'rgba(255,255,255,0.2)' }}
                aria-label={`Go to slide ${i + 1}`}
              >
                {i === active && (
                  <span
                    className="absolute inset-0 origin-left"
                    style={{
                      background: slide.accent,
                      animation: 'progress 5s linear forwards',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Slide counter */}
          <p className="text-xs font-mono text-white/30 tracking-widest">
            0{active + 1} / 0{SLIDES.length}
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 right-10 z-10 flex flex-col items-center gap-2 text-white/20 hidden lg:flex">
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-white/20" />
        <span className="text-[10px] tracking-[0.3em] uppercase rotate-90 origin-center translate-y-4">Scroll</span>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}
