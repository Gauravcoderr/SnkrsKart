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
    bgGrad: 'linear-gradient(135deg, #09090b 0%, #0c1525 100%)',
    glow: 'radial-gradient(ellipse 70% 75% at 75% 55%, rgba(56,189,248,0.28) 0%, transparent 70%)',
    accent: '#38bdf8',
    accentClass: 'text-sky-400',
    align: 'left',
    decorLetter: 'M',
  },
  {
    id: 'women' as const,
    eyebrow: 'Shop for',
    heading: 'WOMEN',
    sub: 'Nike · Jordan · Adidas · Crocs',
    href: '/products?gender=women',
    bgGrad: 'linear-gradient(225deg, #09090b 0%, #1e0a10 100%)',
    glow: 'radial-gradient(ellipse 70% 75% at 25% 55%, rgba(251,113,133,0.28) 0%, transparent 70%)',
    accent: '#fb7185',
    accentClass: 'text-rose-400',
    align: 'right',
    decorLetter: 'W',
  },
] as const;

function getClips(hovered: 'men' | 'women' | null) {
  if (hovered === 'men')   return { men: 'polygon(0 0, 64% 0, 50% 100%, 0 100%)', women: 'polygon(64% 0, 100% 0, 100% 100%, 50% 100%)' };
  if (hovered === 'women') return { men: 'polygon(0 0, 50% 0, 36% 100%, 0 100%)', women: 'polygon(50% 0, 100% 0, 100% 100%, 36% 100%)' };
  return { men: 'polygon(0 0, 57% 0, 43% 100%, 0 100%)', women: 'polygon(57% 0, 100% 0, 100% 100%, 43% 100%)' };
}

export default function GenderSplit() {
  const [hovered, setHovered] = useState<'men' | 'women' | null>(null);
  const clips = getClips(hovered);

  return (
    <section className="w-full overflow-hidden">

      {/* ── Desktop: diagonal clip-path ── */}
      <div className="relative hidden md:block h-[420px]" style={{ background: '#09090b' }}>

        {/* diagonal separator line visible on dark bg */}
        <div aria-hidden="true" className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: '43%', width: '1px',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)',
            transform: 'skewX(-8deg) translateX(100px)',
          }} />
        </div>

        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="text-[9px] font-black tracking-[0.5em] uppercase text-white/30">SNKRS CART</span>
        </div>

        {PANELS.map((panel) => {
          const isHovered = hovered === panel.id;
          const isRight = panel.align === 'right';
          return (
            <Link
              key={panel.id}
              href={panel.href}
              onMouseEnter={() => setHovered(panel.id)}
              onMouseLeave={() => setHovered(null)}
              className="absolute inset-0 overflow-hidden cursor-pointer"
              style={{
                clipPath: clips[panel.id],
                transition: 'clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
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

              {/* Decorative letter */}
              <div className={`absolute inset-0 flex items-center ${isRight ? 'justify-end pr-6' : 'justify-start pl-6'} pointer-events-none overflow-hidden`}>
                <span className="font-black text-white select-none"
                  style={{
                    fontSize: 'clamp(160px, 20vw, 280px)',
                    opacity: isHovered ? 0.12 : 0.07,
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
              <div className={`absolute bottom-10 flex flex-col ${
                isRight
                  ? 'right-10 sm:right-14 left-[52%] items-end text-right'
                  : 'left-10 sm:left-14 right-[48%] items-start'
              }`}>
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
                  <p className="text-[11px] font-medium tracking-wider text-white/50 truncate"
                    style={{ opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.4s' }}>
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

        {/* Center badge */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex items-center justify-center w-14 h-14 rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all duration-500"
            style={{ transform: hovered ? 'scale(0.85)' : 'scale(1)' }}>
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Mobile: stacked ── */}
      <div className="md:hidden flex flex-col">
        {PANELS.map((panel) => (
          <Link key={panel.id} href={panel.href}
            className="relative overflow-hidden h-52 block"
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
