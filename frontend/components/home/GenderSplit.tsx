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
    // diagonal clip: right edge angles in
    clipDesktop: 'polygon(0 0, 100% 0, 86% 100%, 0 100%)',
    bgGrad: 'linear-gradient(135deg, #0a0a0a 0%, #18181b 40%, #1e1b4b 100%)',
    glow: 'radial-gradient(ellipse 60% 70% at 80% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)',
    accent: '#818cf8',
    accentClass: 'text-indigo-400',
    borderAccent: 'border-indigo-500/40',
    align: 'left',
    decorLetter: 'M',
  },
  {
    id: 'women' as const,
    eyebrow: 'Shop for',
    heading: 'WOMEN',
    sub: 'New Balance · Vans · Puma · Asics',
    href: '/products?gender=women',
    // diagonal clip: left edge angles out
    clipDesktop: 'polygon(14% 0, 100% 0, 100% 100%, 0 100%)',
    bgGrad: 'linear-gradient(225deg, #0a0a0a 0%, #18181b 40%, #3b0d1e 100%)',
    glow: 'radial-gradient(ellipse 60% 70% at 20% 50%, rgba(244,63,94,0.18) 0%, transparent 70%)',
    accent: '#fb7185',
    accentClass: 'text-rose-400',
    borderAccent: 'border-rose-500/40',
    align: 'right',
    decorLetter: 'W',
  },
] as const;

export default function GenderSplit() {
  const [hovered, setHovered] = useState<'men' | 'women' | null>(null);

  return (
    <section className="relative w-full bg-black overflow-hidden">
      {/* SNKRS CART top label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span className="text-[9px] font-black tracking-[0.5em] uppercase text-white/30">
          SNKRS CART
        </span>
      </div>

      {/* Split panels — stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col md:flex-row h-auto md:h-[540px]">
        {PANELS.map((panel) => {
          const isHovered = hovered === panel.id;
          const otherHovered = hovered !== null && !isHovered;

          return (
            <Link
              key={panel.id}
              href={panel.href}
              onMouseEnter={() => setHovered(panel.id)}
              onMouseLeave={() => setHovered(null)}
              className="relative overflow-hidden flex-shrink-0 h-64 md:h-auto cursor-pointer block"
              style={{
                flex: otherHovered ? '0 0 36%' : isHovered ? '0 0 64%' : '0 0 50%',
                transition: 'flex 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                clipPath: panel.clipDesktop,
              }}
              aria-label={`Shop for ${panel.heading}`}
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0"
                style={{ background: panel.bgGrad }}
              />

              {/* Glow overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: panel.glow,
                  opacity: isHovered ? 1 : 0.4,
                }}
              />

              {/* Grid texture */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Giant decorative letter */}
              <div
                className={`absolute inset-0 flex items-center ${panel.align === 'right' ? 'justify-end pr-6' : 'justify-start pl-6'} pointer-events-none overflow-hidden`}
              >
                <span
                  className="font-black text-white select-none leading-none"
                  style={{
                    fontSize: 'clamp(160px, 20vw, 280px)',
                    opacity: isHovered ? 0.06 : 0.04,
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    lineHeight: 1,
                  }}
                >
                  {panel.decorLetter}
                </span>
              </div>

              {/* Horizontal accent line */}
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: `linear-gradient(90deg, transparent, ${panel.accent}, transparent)` }}
              />

              {/* Content */}
              <div
                className={`absolute inset-0 flex flex-col justify-end pb-10 ${panel.align === 'left' ? 'pl-10 sm:pl-14 pr-14 sm:pr-20' : 'pr-10 sm:pr-14 pl-14 sm:pl-20'}`}
              >
                {/* Eyebrow */}
                <p
                  className={`text-[10px] font-bold tracking-[0.35em] uppercase mb-1 transition-all duration-400 ${panel.accentClass}`}
                  style={{
                    transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                    opacity: isHovered ? 1 : 0.7,
                  }}
                >
                  {panel.eyebrow}
                </p>

                {/* Main heading */}
                <h2
                  className="font-black text-white leading-none mb-3 tracking-tight"
                  style={{
                    fontSize: 'clamp(40px, 5vw, 68px)',
                    transform: isHovered ? 'translateY(0) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
                    transformOrigin: panel.align === 'left' ? 'left bottom' : 'right bottom',
                  }}
                >
                  {panel.heading}
                </h2>

                {/* Accent bar + sub text */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-px flex-shrink-0 transition-all duration-500"
                    style={{
                      width: isHovered ? 32 : 16,
                      background: panel.accent,
                    }}
                  />
                  <p
                    className="text-[11px] font-medium tracking-wider text-white/50 truncate transition-all duration-400"
                    style={{ opacity: isHovered ? 1 : 0.5 }}
                  >
                    {panel.sub}
                  </p>
                </div>

                {/* CTA row */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-black tracking-[0.25em] uppercase text-white transition-all duration-300"
                    style={{ opacity: isHovered ? 1 : 0.45 }}
                  >
                    Explore Now
                  </span>
                  <svg
                    className="w-4 h-4 text-white transition-all duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    style={{
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                      opacity: isHovered ? 1 : 0.45,
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Bottom accent border */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: `linear-gradient(90deg, transparent, ${panel.accent}80, transparent)` }}
              />
            </Link>
          );
        })}
      </div>

      {/* Center badge — desktop only */}
      <div className="absolute inset-0 hidden md:flex items-center justify-center z-10 pointer-events-none">
        <div
          className="relative flex items-center justify-center w-14 h-14 rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all duration-500"
          style={{ transform: hovered ? 'scale(0.85)' : 'scale(1)' }}
        >
          <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
    </section>
  );
}
