'use client';

import { useState } from 'react';
import Link from 'next/link';

const PANELS = [
  {
    id: 'men' as const,
    eyebrow: 'Shop for',
    heading: 'MEN',
    sub: 'Nike · Jordan · Adidas · New Balance',
    href: '/products?gender=men',
    bgGrad: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #0ea5e9 100%)',
    glow: 'radial-gradient(ellipse 60% 70% at 80% 50%, rgba(14,165,233,0.35) 0%, transparent 70%)',
    accent: '#7dd3fc',
    accentClass: 'text-sky-300',
    decorLetter: 'M',
    contentSide: 'left' as const,
  },
  {
    id: 'women' as const,
    eyebrow: 'Shop for',
    heading: 'WOMEN',
    sub: 'New Balance · Vans · Puma · Asics',
    href: '/products?gender=women',
    bgGrad: 'linear-gradient(225deg, #9d174d 0%, #ec4899 50%, #f97316 100%)',
    glow: 'radial-gradient(ellipse 60% 70% at 20% 50%, rgba(249,115,22,0.35) 0%, transparent 70%)',
    accent: '#fda4af',
    accentClass: 'text-rose-300',
    decorLetter: 'W',
    contentSide: 'right' as const,
  },
] as const;

export default function GenderSplit() {
  const [hovered, setHovered] = useState<'men' | 'women' | null>(null);

  return (
    <section className="w-full overflow-hidden">

      {/* ── Desktop: 50/50 side-by-side ── */}
      <div className="relative hidden md:flex flex-row h-[480px]">

        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="text-[9px] font-black tracking-[0.5em] uppercase text-white/30">SNKRS CART</span>
        </div>

        {PANELS.map((panel, idx) => {
          const isHovered = hovered === panel.id;
          const isRight = panel.contentSide === 'right';
          return (
            <Link
              key={panel.id}
              href={panel.href}
              onMouseEnter={() => setHovered(panel.id)}
              onMouseLeave={() => setHovered(null)}
              className="relative flex-1 overflow-hidden cursor-pointer"
              aria-label={`Shop for ${panel.heading}`}
            >
              <div className="absolute inset-0" style={{ background: panel.bgGrad }} />
              <div className="absolute inset-0 transition-opacity duration-500"
                style={{ background: panel.glow, opacity: isHovered ? 1 : 0.4 }} />
              <div className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }} />

              {idx === 0 && <div className="absolute top-0 right-0 w-px h-full bg-white/10 z-10" />}

              {/* Decorative letter */}
              <div className={`absolute inset-0 flex items-center ${isRight ? 'justify-end pr-6' : 'justify-start pl-6'} pointer-events-none overflow-hidden`}>
                <span className="font-black text-white select-none"
                  style={{
                    fontSize: 'clamp(160px, 20vw, 280px)',
                    opacity: isHovered ? 0.06 : 0.04,
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    lineHeight: 1,
                  }}>
                  {panel.decorLetter}
                </span>
              </div>

              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: `linear-gradient(90deg, transparent, ${panel.accent}, transparent)` }} />

              {/* Content */}
              <div className={`absolute bottom-10 flex flex-col ${isRight ? 'right-10 sm:right-14 items-end text-right' : 'left-10 sm:left-14 items-start'}`}>
                <p className={`text-[10px] font-bold tracking-[0.35em] uppercase mb-1 ${panel.accentClass}`}
                  style={{ transform: isHovered ? 'translateY(0)' : 'translateY(4px)', opacity: isHovered ? 1 : 0.7, transition: 'all 0.4s' }}>
                  {panel.eyebrow}
                </p>
                <h2 className="font-black text-white leading-none mb-3 tracking-tight"
                  style={{
                    fontSize: 'clamp(40px, 5vw, 68px)',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                    transformOrigin: isRight ? 'right bottom' : 'left bottom',
                  }}>
                  {panel.heading}
                </h2>
                <div className={`flex items-center gap-3 mb-4 ${isRight ? 'flex-row-reverse' : ''}`}>
                  <div className="h-px flex-shrink-0 transition-all duration-500"
                    style={{ width: isHovered ? 32 : 16, background: panel.accent }} />
                  <p className="text-[11px] font-medium tracking-wider text-white/50">
                    {panel.sub}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${isRight ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[11px] font-black tracking-[0.25em] uppercase text-white transition-all duration-300"
                    style={{ opacity: isHovered ? 1 : 0.45 }}>
                    Explore Now
                  </span>
                  <svg className="w-4 h-4 text-white transition-all duration-300"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    style={{ transform: isHovered ? `translateX(${isRight ? '-' : ''}4px)` : 'translateX(0)', opacity: isHovered ? 1 : 0.45 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Bottom accent border */}
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: `linear-gradient(90deg, transparent, ${panel.accent}80, transparent)` }} />
            </Link>
          );
        })}
      </div>

      {/* ── Mobile: stacked ── */}
      <div className="md:hidden flex flex-col">
        {PANELS.map((panel) => (
          <Link key={panel.id} href={panel.href}
            className="relative overflow-hidden h-64 block"
            aria-label={`Shop for ${panel.heading}`}>
            <div className="absolute inset-0" style={{ background: panel.bgGrad }} />
            <div className="absolute inset-0" style={{ background: panel.glow, opacity: 0.5 }} />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
            <div className="absolute inset-0 flex items-center justify-start pl-6 pointer-events-none overflow-hidden">
              <span className="font-black text-white select-none" style={{ fontSize: 180, opacity: 0.04, lineHeight: 1 }}>
                {panel.decorLetter}
              </span>
            </div>
            <div className="absolute inset-0 flex flex-col justify-end pb-8 pl-8 pr-8">
              <p className={`text-[10px] font-bold tracking-[0.35em] uppercase mb-1 ${panel.accentClass}`}>{panel.eyebrow}</p>
              <h2 className="font-black text-white leading-none mb-2 tracking-tight" style={{ fontSize: '2.5rem' }}>
                {panel.heading}
              </h2>
              <div className="flex items-center gap-3">
                <div className="h-px w-4 shrink-0" style={{ background: panel.accent }} />
                <p className="text-[11px] font-medium tracking-wider text-white/50 truncate">{panel.sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}
