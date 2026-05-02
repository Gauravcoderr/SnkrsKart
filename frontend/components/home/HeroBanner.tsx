'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bebas_Neue } from 'next/font/google';
import { BannerSlide } from '@/types';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], display: 'swap' });

const ORANGE = '#FF5500';

export default function HeroBanner({ slides }: { slides: BannerSlide[] }) {
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning || idx === active) return;
      setTransitioning(true);
      setActive(idx);
      setAnimKey(k => k + 1);
      setTimeout(() => setTransitioning(false), 600);
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
  const accent = s.accent || ORANGE;

  return (
    <section className="w-full relative overflow-hidden select-none" style={{ background: '#080808' }}>
      <style>{`
        @keyframes snkrs-bar { from { width: 0 } to { width: 100% } }
        @keyframes snkrs-float {
          0%,100% { transform: rotate(-8deg) translateY(0px) }
          50% { transform: rotate(-8deg) translateY(-10px) }
        }
        @keyframes snkrs-stamp { from { opacity:0; transform:rotate(-20deg) scale(.7) } to { opacity:1; transform:rotate(0deg) scale(1) } }
        @keyframes snkrs-fadein { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes snkrs-scanline {
          0% { background-position: 0 0 }
          100% { background-position: 0 100px }
        }
        .snkrs-float { animation: snkrs-float 4s ease-in-out infinite }
        .snkrs-stamp { animation: snkrs-stamp .5s cubic-bezier(.34,1.56,.64,1) forwards }
        .snkrs-fadein { animation: snkrs-fadein .5s ease forwards }
      `}</style>

      {/* Scanline texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          animation: 'snkrs-scanline 4s linear infinite',
        }}
      />

      {/* Subtle noise vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
      />

      <div
        className="relative flex flex-col-reverse md:flex-row z-20"
        style={{ minHeight: 'clamp(520px, 56vw, 620px)' }}
      >
        {/* ── LEFT: text panel ── */}
        <div className="flex flex-col justify-between px-7 sm:px-12 lg:px-16 pt-8 pb-7 md:w-[54%]">

          {/* Top: collection tag */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 w-8 h-px" style={{ background: accent }} />
            <span
              className="text-[9px] font-black tracking-[0.45em] uppercase"
              style={{ color: accent }}
            >
              {s.tag}
            </span>
            <span className="shrink-0 h-px flex-1 max-w-[40px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Middle: headline + price + CTA */}
          <div className="flex flex-col gap-4 snkrs-fadein" key={active}>
            {/* Eyebrow brand label */}
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/30 font-bold">
              {s.brand}
            </span>

            {/* Main headline */}
            <h1
              className={`${bebas.className} text-white uppercase leading-none`}
              style={{
                fontSize: 'clamp(3.2rem, 6.5vw, 5.4rem)',
                letterSpacing: '0.03em',
                textShadow: `0 0 80px ${accent}22`,
              }}
            >
              {s.headline.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 max-w-[48px]" style={{ background: accent, opacity: 0.6 }} />
              <span className="text-[9px] tracking-[0.4em] uppercase text-white/20 font-bold">
                {s.sub}
              </span>
            </div>

            {/* Price tag */}
            {s.price && (
              <div className="flex items-center gap-3 self-start">
                <div
                  className="flex items-center gap-1 px-3 py-1.5"
                  style={{ background: accent }}
                >
                  <span className="text-[10px] font-black text-white/70 tracking-widest">₹</span>
                  <span className="text-sm font-black text-white tracking-wider">
                    {s.price.replace('₹', '').replace(/,/g, ',')}
                  </span>
                </div>
                <span className="text-[9px] tracking-[0.3em] uppercase text-white/25 font-bold">
                  MRP Incl. of all taxes
                </span>
              </div>
            )}

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={s.href}
                className="group inline-flex items-center gap-2.5 px-6 py-3 text-[10px] font-black tracking-[0.28em] uppercase transition-all duration-200 hover:opacity-90 hover:gap-3.5"
                style={{ background: accent, color: '#fff' }}
              >
                {s.cta}
                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.28em] uppercase text-white/25 hover:text-white/55 transition-colors"
              >
                View All
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Micro trust row */}
            <div className="flex items-center gap-4 pt-1">
              {[
                { icon: '✦', label: 'Free Shipping' },
                { icon: '✦', label: 'Easy Returns' },
                { icon: '✦', label: '100% Authentic' },
              ].map(({ icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
                  <span style={{ color: accent, fontSize: 6 }}>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom: dots + slide counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="rounded-full transition-all duration-500 cursor-pointer"
                  style={{
                    width: i === active ? 36 : 8,
                    height: 2,
                    background: i === active ? accent : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/20">
              {String(active + 1).padStart(2, '0')}&nbsp;—&nbsp;{String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* ── RIGHT: image panel ── */}
        <div
          className="relative flex items-center justify-center md:w-[46%] overflow-hidden"
          style={{ minHeight: 280 }}
        >
          {/* Per-slide radial glow */}
          {slides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
              style={{
                opacity: i === active ? 1 : 0,
                background: `radial-gradient(ellipse 70% 60% at 55% 55%, ${slide.accent || ORANGE}28, transparent 70%)`,
              }}
            />
          ))}

          {/* Corner accent marks */}
          {[
            'top-3 left-3 border-t border-l',
            'top-3 right-20 border-t border-r',
            'bottom-10 left-3 border-b border-l',
            'bottom-10 right-20 border-b border-r',
          ].map((cls, i) => (
            <span
              key={i}
              className={`absolute w-4 h-4 pointer-events-none ${cls}`}
              style={{ borderColor: `${accent}30` }}
            />
          ))}

          {/* Sneaker images */}
          {slides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-600"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <div
                className={i === active ? 'snkrs-float' : ''}
                style={{
                  width: '76%',
                  height: '70%',
                  position: 'relative',
                  filter: `drop-shadow(0 28px 72px rgba(0,0,0,0.9)) drop-shadow(0 0 40px ${slide.accent || ORANGE}18)`,
                }}
              >
                <Image
                  src={slide.image}
                  alt={slide.brand}
                  fill
                  priority={i === 0}
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 46vw"
                />
              </div>
            </div>
          ))}

          {/* Circular authenticity stamp — top right */}
          <div
            className="absolute top-4 right-4 z-30 snkrs-stamp pointer-events-none"
            key={`stamp-${active}`}
          >
            <svg
              viewBox="0 0 110 110"
              className="w-[76px] h-[76px] md:w-[94px] md:h-[94px]"
              aria-label="100% Authentic — SNKRSCART Verified"
            >
              <defs>
                <path id="sc-arc" d="M55,55 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              {/* Outer ring */}
              <circle cx="55" cy="55" r="50" fill="rgba(0,0,0,0.55)" stroke={ORANGE} strokeWidth="1" opacity="0.5" />
              {/* Inner dashed ring */}
              <circle cx="55" cy="55" r="42" fill="none" stroke={ORANGE} strokeWidth="0.8" strokeDasharray="3 4" opacity="0.5" />
              {/* Arc text */}
              <text fontSize="8" fontWeight="800" fill={ORANGE} letterSpacing="2.4" opacity="0.95">
                <textPath href="#sc-arc" startOffset="1%">100% AUTHENTIC · SNKRSCART VERIFIED ·</textPath>
              </text>
              {/* Star separators overlay */}
              <text x="55" y="51" textAnchor="middle" fontSize="15" fontWeight="900" fill={ORANGE} opacity="0.95">✓</text>
              <text x="55" y="62" textAnchor="middle" fontSize="5.5" fontWeight="800" fill={ORANGE} letterSpacing="1.5" opacity="0.6">CERTIFIED</text>
            </svg>
          </div>

          {/* Secure Packing badge — bottom right */}
          <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 pointer-events-none">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 border"
              style={{ borderColor: `${ORANGE}40`, background: 'rgba(0,0,0,0.5)' }}
            >
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth={2.5}>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-[8.5px] font-black tracking-[0.28em] uppercase" style={{ color: ORANGE }}>
                Secure Packing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] z-30" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          key={animKey}
          className="h-full"
          style={{
            background: `linear-gradient(90deg, ${accent}aa, ${accent})`,
            animation: 'snkrs-bar 5s linear forwards',
          }}
        />
      </div>
    </section>
  );
}
