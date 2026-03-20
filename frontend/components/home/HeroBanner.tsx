'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BannerSlide } from '@/types';

export default function HeroBanner({ slides }: { slides: BannerSlide[] }) {
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning || idx === active) return;
      setTransitioning(true);
      setActive(idx);
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

  return (
    <section className="w-full overflow-hidden" style={{ background: s.bg, transition: 'background 0.5s ease' }}>
      <div className="flex flex-col md:flex-row" style={{ minHeight: 'min(90vh, 700px)' }}>

        {/* ── Left: text panel ── */}
        <div className="flex flex-col justify-between gap-6 px-6 sm:px-10 lg:px-16 pt-10 pb-8 md:w-[52%]">

          {/* Brand tag */}
          <div className="flex items-center gap-2">
            <span className="h-px w-6 shrink-0" style={{ background: s.accent }} />
            <span className="text-[10px] font-bold tracking-[0.35em] uppercase" style={{ color: s.accent }}>
              {s.tag}
            </span>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-4">
            <h1 className="font-black uppercase leading-[0.88] tracking-tighter text-white break-words"
              style={{ fontSize: 'clamp(3rem, 9vw, 8.5rem)' }}>
              {s.headline.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="text-xs text-white/40 tracking-[0.25em] uppercase">{s.sub}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={s.href}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
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
              <Link href="/products" className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 hover:text-white transition-colors">
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
                  className="h-[2px] rounded-full transition-all duration-500"
                  style={{
                    width: i === active ? 36 : 14,
                    background: i === active ? s.accent : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-white/25 tracking-widest">
              0{active + 1} / 0{slides.length}
            </span>
          </div>
        </div>

        {/* ── Right: product image ── */}
        <div
          className="relative md:w-[48%] overflow-hidden"
          style={{ minHeight: 320, background: s.imgBg, transition: 'background 0.5s ease' }}
        >
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
                className="object-contain p-6 md:p-10"
                sizes="(max-width: 768px) 100vw, 48vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
