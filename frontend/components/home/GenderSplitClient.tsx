'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface GenderPanel {
  id: 'men' | 'women';
  heading: string;
  sub: string;
  count: string;
  href: string;
  image: string;
  accent: string;
  accentClass: string;
  align: 'left' | 'right';
}

function getClips(hovered: 'men' | 'women' | null) {
  if (hovered === 'men')   return { men: 'polygon(0 0, 64% 0, 50% 100%, 0 100%)', women: 'polygon(64% 0, 100% 0, 100% 100%, 50% 100%)' };
  if (hovered === 'women') return { men: 'polygon(0 0, 50% 0, 36% 100%, 0 100%)', women: 'polygon(50% 0, 100% 0, 100% 100%, 36% 100%)' };
  return { men: 'polygon(0 0, 57% 0, 43% 100%, 0 100%)', women: 'polygon(57% 0, 100% 0, 100% 100%, 43% 100%)' };
}

export default function GenderSplitClient({ panels }: { panels: GenderPanel[] }) {
  const [hovered, setHovered] = useState<'men' | 'women' | null>(null);
  const clips = getClips(hovered);

  return (
    <section className="w-full overflow-hidden border-b border-white/5">

      {/* ── Desktop ── */}
      <div className="relative hidden md:block h-[480px] bg-black">

        {panels.map((panel) => {
          const active = hovered === panel.id;
          const isRight = panel.align === 'right';

          return (
            <Link
              key={panel.id}
              href={panel.href}
              onMouseEnter={() => setHovered(panel.id)}
              onMouseLeave={() => setHovered(null)}
              className="absolute inset-0 overflow-hidden cursor-pointer group"
              style={{ clipPath: clips[panel.id], transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
              aria-label={`Shop ${panel.heading}'s sneakers`}
            >
              {/* Product image — zooms on hover */}
              <Image
                src={panel.image}
                alt={`${panel.heading} sneakers`}
                fill
                className="object-cover object-center"
                style={{
                  transform: active ? 'scale(1.08)' : 'scale(1.02)',
                  transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                  objectPosition: 'center 25%',
                }}
                sizes="50vw"
                priority
              />

              {/* Layered gradient — transparent top, heavy dark at bottom for legibility */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.92) 100%)',
              }} />

              {/* Accent color wash — intensifies on hover */}
              <div className="absolute inset-0 transition-opacity duration-700" style={{
                background: `radial-gradient(ellipse 60% 70% at ${isRight ? '15%' : '85%'} 80%, ${panel.accent}30 0%, transparent 65%)`,
                opacity: active ? 1 : 0.35,
              }} />

              {/* Top glow line — slides in on hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-500" style={{
                background: `linear-gradient(90deg, transparent 0%, ${panel.accent} 50%, transparent 100%)`,
                opacity: active ? 1 : 0,
              }} />

              {/* Subtle noise grain via SVG filter */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }} />

              {/* Vertical label on outer edge */}
              <div className={`absolute top-1/2 -translate-y-1/2 ${isRight ? 'right-4' : 'left-4'} pointer-events-none`}>
                <span
                  className="text-[10px] font-black tracking-[0.5em] uppercase transition-opacity duration-500"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: isRight ? 'rotate(180deg)' : 'none',
                    color: panel.accent,
                    opacity: active ? 0.9 : 0.3,
                  }}
                >
                  SNKRS CART
                </span>
              </div>

              {/* Main content — bottom-aligned */}
              <div className={`absolute bottom-0 left-0 right-0 flex flex-col ${isRight ? 'items-end pr-14 pl-[52%]' : 'items-start pl-14 pr-[48%]'} pb-12`}>

                {/* Count badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-6" style={{ background: panel.accent }} />
                  <span
                    className="text-[11px] font-bold tracking-[0.3em] uppercase px-2 py-0.5 border"
                    style={{ color: panel.accent, borderColor: `${panel.accent}50`, background: `${panel.accent}10` }}
                  >
                    {panel.count}
                  </span>
                </div>

                {/* Heading — Bebas Neue, massive */}
                <h2
                  className="text-white leading-none"
                  style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: 'clamp(72px, 9.5vw, 120px)',
                    letterSpacing: '0.03em',
                    transform: active ? 'scale(1.03)' : 'scale(1)',
                    transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                    transformOrigin: isRight ? 'right bottom' : 'left bottom',
                  }}
                >
                  {panel.heading}
                </h2>

                {/* Sub brands */}
                <p className="text-[11px] font-medium tracking-widest text-white/55 mt-3 mb-6">
                  {panel.sub}
                </p>

                {/* CTA pill */}
                <div
                  className="flex items-center gap-3 px-5 py-2.5 border transition-all duration-400"
                  style={{
                    borderColor: active ? panel.accent : 'rgba(255,255,255,0.2)',
                    background: active ? `${panel.accent}15` : 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.35s',
                  }}
                >
                  <span className="text-[11px] font-black tracking-[0.3em] uppercase text-white">
                    Shop Now
                  </span>
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

        {/* Centre badge */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full border border-white/15 bg-black/80 backdrop-blur-xl transition-all duration-500 shadow-2xl"
            style={{ transform: hovered ? 'scale(0.82)' : 'scale(1)' }}
          >
            <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Diagonal separator */}
        <div aria-hidden className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: '43%', width: '1px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.12) 75%, transparent 100%)',
            transform: 'skewX(-8deg) translateX(100px)',
          }} />
        </div>
      </div>

      {/* ── Mobile: stacked ── */}
      <div className="md:hidden flex flex-col">
        {panels.map((panel) => (
          <Link
            key={panel.id}
            href={panel.href}
            className="relative overflow-hidden h-56 block"
            aria-label={`Shop ${panel.heading}'s sneakers`}
          >
            <Image
              src={panel.image}
              alt={`${panel.heading} sneakers`}
              fill
              className="object-cover"
              style={{ objectPosition: 'center 25%' }}
              sizes="100vw"
            />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.88) 100%)',
            }} />
            <div className="absolute inset-0" style={{
              background: `radial-gradient(ellipse 60% 50% at 30% 80%, ${panel.accent}25 0%, transparent 60%)`,
            }} />
            <div className="absolute inset-0 flex flex-col justify-end pb-8 pl-8 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-5" style={{ background: panel.accent }} />
                <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${panel.accentClass}`}>{panel.count}</span>
              </div>
              <h2
                className="text-white leading-none mb-2"
                style={{ fontFamily: 'var(--font-bebas)', fontSize: '4rem', letterSpacing: '0.03em' }}
              >
                {panel.heading}
              </h2>
              <p className="text-[11px] font-medium tracking-widest text-white/50">{panel.sub}</p>
            </div>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
              background: `linear-gradient(90deg, ${panel.accent}, transparent)`,
            }} />
          </Link>
        ))}
      </div>

    </section>
  );
}
