'use client';

import { useState } from 'react';
import Link from 'next/link';

const PANELS = [
  {
    id: 'men' as const,
    heading: 'MEN',
    sub: 'Nike · Jordan · Adidas · New Balance',
    count: '100+ Styles',
    href: '/products?gender=men',
    accent: '#38bdf8',
    accentClass: 'text-sky-400',
    align: 'left' as const,
    decorLetter: 'M',
    bgFrom: '#060b14',
    bgTo: '#0a1a30',
    glowAt: '75% 60%',
  },
  {
    id: 'women' as const,
    heading: 'WOMEN',
    sub: 'Nike · Jordan · Adidas · Crocs',
    count: '80+ Styles',
    href: '/products?gender=women',
    accent: '#fb7185',
    accentClass: 'text-rose-400',
    align: 'right' as const,
    decorLetter: 'W',
    bgFrom: '#130408',
    bgTo: '#1e0616',
    glowAt: '25% 60%',
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
    <section className="w-full overflow-hidden border-b border-white/5">

      {/* ── Desktop ── */}
      <div className="relative hidden md:block h-[460px] bg-black">

        {PANELS.map((panel) => {
          const active = hovered === panel.id;
          const isRight = panel.align === 'right';

          return (
            <Link
              key={panel.id}
              href={panel.href}
              onMouseEnter={() => setHovered(panel.id)}
              onMouseLeave={() => setHovered(null)}
              className="absolute inset-0 overflow-hidden cursor-pointer"
              style={{ clipPath: clips[panel.id], transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
              aria-label={`Shop ${panel.heading}'s sneakers`}
            >
              {/* Base gradient */}
              <div className="absolute inset-0" style={{
                background: `linear-gradient(${isRight ? '225deg' : '135deg'}, ${panel.bgFrom} 0%, ${panel.bgTo} 100%)`,
              }} />

              {/* Radial accent glow — intensifies on hover */}
              <div className="absolute inset-0 transition-opacity duration-700" style={{
                background: `radial-gradient(ellipse 65% 80% at ${panel.glowAt}, ${panel.accent}40 0%, transparent 65%)`,
                opacity: active ? 1 : 0.45,
              }} />

              {/* Dot grid texture */}
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: `radial-gradient(${panel.accent} 1px, transparent 1px)`,
                backgroundSize: '28px 28px',
              }} />

              {/* Diagonal stripe lines — subtle */}
              <div className="absolute inset-0 opacity-[0.025]" style={{
                backgroundImage: `repeating-linear-gradient(${isRight ? '-45deg' : '45deg'}, white, white 1px, transparent 1px, transparent 32px)`,
              }} />

              {/* Giant decorative letter */}
              <div className={`absolute inset-0 flex items-center ${isRight ? 'justify-end pr-8' : 'justify-start pl-8'} pointer-events-none overflow-hidden`}>
                <span
                  className="font-black select-none leading-none transition-all duration-700"
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: 'clamp(220px, 28vw, 380px)',
                    letterSpacing: '-0.04em',
                    color: panel.accent,
                    opacity: active ? 0.12 : 0.06,
                    transform: active ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  {panel.decorLetter}
                </span>
              </div>

              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-500" style={{
                background: `linear-gradient(90deg, transparent 0%, ${panel.accent} 50%, transparent 100%)`,
                opacity: active ? 1 : 0,
              }} />

              {/* Vertical edge label */}
              <div className={`absolute top-1/2 -translate-y-1/2 ${isRight ? 'right-4' : 'left-4'} pointer-events-none`}>
                <span
                  className="text-[9px] font-black tracking-[0.55em] uppercase transition-opacity duration-500"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: isRight ? 'rotate(180deg)' : 'none',
                    color: panel.accent,
                    opacity: active ? 0.7 : 0.2,
                  }}
                >
                  SNKRS CART
                </span>
              </div>

              {/* Content */}
              <div className={`absolute bottom-0 left-0 right-0 flex flex-col ${
                isRight ? 'items-end pr-14 pl-[52%]' : 'items-start pl-14 pr-[48%]'
              } pb-12`}>

                {/* Count badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-6 transition-all duration-500"
                    style={{ background: panel.accent, width: active ? 32 : 24 }} />
                  <span
                    className="text-[10px] font-bold tracking-[0.3em] uppercase px-2 py-0.5 border"
                    style={{ color: panel.accent, borderColor: `${panel.accent}55`, background: `${panel.accent}12` }}
                  >
                    {panel.count}
                  </span>
                </div>

                {/* Heading */}
                <h2
                  className="text-white leading-none"
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: 'clamp(72px, 9.5vw, 116px)',
                    letterSpacing: '0.03em',
                    transform: active ? 'scale(1.03)' : 'scale(1)',
                    transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                    transformOrigin: isRight ? 'right bottom' : 'left bottom',
                  }}
                >
                  {panel.heading}
                </h2>

                {/* Sub brands */}
                <p className="text-[11px] font-medium tracking-widest text-white/45 mt-3 mb-6">
                  {panel.sub}
                </p>

                {/* CTA */}
                <div
                  className="flex items-center gap-3 px-5 py-2.5 border"
                  style={{
                    borderColor: active ? panel.accent : 'rgba(255,255,255,0.18)',
                    background: active ? `${panel.accent}18` : 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.35s',
                  }}
                >
                  <span className="text-[11px] font-black tracking-[0.3em] uppercase text-white">Shop Now</span>
                  <svg
                    className="w-3.5 h-3.5 text-white transition-transform duration-300"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    style={{ transform: active ? `translateX(${isRight ? '-' : ''}5px)` : 'translateX(0)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-500" style={{
                background: `linear-gradient(90deg, transparent, ${panel.accent}, transparent)`,
                opacity: active ? 1 : 0,
              }} />
            </Link>
          );
        })}

        {/* Diagonal separator */}
        <div aria-hidden className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: '43%', width: '1px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 75%, transparent 100%)',
            transform: 'skewX(-8deg) translateX(100px)',
          }} />
        </div>

        {/* Centre cart badge */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full border border-white/15 bg-black/70 backdrop-blur-xl shadow-2xl transition-all duration-500"
            style={{ transform: hovered ? 'scale(0.82)' : 'scale(1)' }}
          >
            <svg className="w-6 h-6 text-white/55" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Mobile: stacked ── */}
      <div className="md:hidden flex flex-col">
        {PANELS.map((panel) => (
          <Link
            key={panel.id}
            href={panel.href}
            className="relative overflow-hidden h-52 block"
            aria-label={`Shop ${panel.heading}'s sneakers`}
          >
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${panel.bgFrom} 0%, ${panel.bgTo} 100%)`,
            }} />
            <div className="absolute inset-0" style={{
              background: `radial-gradient(ellipse 70% 80% at 30% 60%, ${panel.accent}38 0%, transparent 65%)`,
            }} />
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: `radial-gradient(${panel.accent} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }} />
            {/* Decorative letter */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden">
              <span className="font-black select-none leading-none"
                style={{ fontFamily: 'var(--font-bebas)', fontSize: 200, color: panel.accent, opacity: 0.07 }}>
                {panel.decorLetter}
              </span>
            </div>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
              background: `linear-gradient(90deg, ${panel.accent}, transparent)`,
            }} />
            <div className="absolute inset-0 flex flex-col justify-end pb-8 pl-8 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-5" style={{ background: panel.accent }} />
                <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${panel.accentClass}`}>{panel.count}</span>
              </div>
              <h2 className="text-white leading-none mb-2"
                style={{ fontFamily: 'var(--font-bebas)', fontSize: '4rem', letterSpacing: '0.03em' }}>
                {panel.heading}
              </h2>
              <p className="text-[11px] font-medium tracking-widest text-white/45">{panel.sub}</p>
            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}
