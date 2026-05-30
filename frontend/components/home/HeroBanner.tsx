'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BannerSlide } from '@/types';

const FLAT_BG = '#09090b';

export default function HeroBanner({ slides }: { slides: BannerSlide[] }) {
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [textKey, setTextKey] = useState(0);

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning || idx === active) return;
      setTransitioning(true);
      setActive(idx);
      setTextKey((k) => k + 1);
      setTimeout(() => setTransitioning(false), 500);
    },
    [active, transitioning]
  );

  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => goTo((active + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [active, goTo, slides.length]);

  if (!slides.length) return null;

  const s = slides[active];
  const slideNum = String(active + 1).padStart(2, '0');

  return (
    <section
      className="w-full overflow-hidden"
      style={{ background: FLAT_BG }}
    >
      <div className="flex flex-col-reverse md:flex-row" style={{ minHeight: 'min(90vh, 700px)' }}>

        {/* ── Left: text panel ── */}
        <div className="relative flex flex-col justify-center gap-8 px-6 sm:px-10 lg:px-16 pt-10 pb-8 md:w-[52%] overflow-hidden">

          {/* Faint large slide number */}
          <span
            aria-hidden="true"
            className="absolute bottom-2 right-4 font-black text-white select-none pointer-events-none leading-none"
            style={{ fontSize: 'clamp(100px, 16vw, 180px)', opacity: 0.04, letterSpacing: '-0.04em' }}
          >
            {slideNum}
          </span>

          <div key={textKey} className="animate-hero-text-in flex flex-col gap-6">
            {/* Brand tag */}
            <div className="flex items-center gap-2">
              <span className="h-px w-6 shrink-0" style={{ background: s.accent }} />
              <span className="text-[10px] font-bold tracking-[0.35em] uppercase" style={{ color: s.accent }}>
                {s.tag}
              </span>
            </div>

            {/* Headline + sub */}
            <div className="flex flex-col gap-3">
              <h1
                className="font-black uppercase leading-[0.88] tracking-tighter text-white break-words"
                style={{ fontSize: 'clamp(2.4rem, 7vw, 6.5rem)' }}
              >
                {s.headline.map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </h1>
              <p className="text-xs text-white/50 tracking-[0.25em] uppercase">{s.sub}</p>
            </div>

            {/* Price */}
            {s.price && (
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">From</span>
                <span className="text-2xl font-black text-white tracking-tight">₹{s.price.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={s.href}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase rounded-full transition-opacity hover:opacity-80 shadow-lg"
                style={{
                  background: s.accent,
                  color: ['#ffffff', '#FFD700'].includes(s.accent) ? '#000' : '#fff',
                }}
              >
                {s.cta}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase rounded-full border transition-colors hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}
              >
                View All
              </Link>
            </div>
          </div>

          {/* Dots + counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="h-[3px] rounded-full transition-all duration-500"
                  style={{
                    width: i === active ? 36 : 14,
                    background: i === active ? s.accent : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-white/30 tracking-widest">
              {slideNum} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* ── Right: shoe image ── */}
        <div className="relative md:w-[48%] overflow-hidden isolate" style={{ minHeight: 320 }}>

          {/* Accent glow — shoe lit from behind, softer than before */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 70% 70% at 60% 60%, ${s.accent}18 0%, transparent 70%)`,
              transition: 'background 0.5s ease',
            }}
          />

          {slides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <Image
                src={slide.image}
                alt={slide.brand}
                fill
                priority={i === 0}
                className="object-contain object-bottom drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, 48vw"
              />
            </div>
          ))}

          {/* Mobile: fade shoe into text panel */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none z-10 md:hidden"
            style={{ background: `linear-gradient(to top, ${FLAT_BG}, transparent)` }}
          />
        </div>
      </div>
    </section>
  );
}
