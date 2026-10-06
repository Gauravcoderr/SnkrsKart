'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import ImageLightbox from '@/components/ui/ImageLightbox';

interface Props {
  images: string[];
  name: string;
  brand: string;
  overlay?: ReactNode;
}

export default function DropGallery({ images, name, brand, overlay }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const multi = images.length > 1;

  const prev = useCallback(() => setActive((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setActive((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    if (!multi || lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (!stageRef.current?.contains(document.activeElement)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [multi, lightbox, prev, next]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (multi && Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] bg-zinc-50 border border-zinc-100 rounded-sm flex items-center justify-center">
        <p className="text-zinc-300 text-xs font-bold tracking-widest uppercase">{brand}</p>
        {overlay}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stageRef}
        tabIndex={multi ? 0 : -1}
        aria-roledescription={multi ? 'carousel' : undefined}
        aria-label={multi ? `${name} images` : undefined}
        className="relative aspect-[4/3] bg-zinc-50 border border-zinc-100 rounded-sm overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open full-size image"
          className="absolute inset-0 w-full h-full cursor-zoom-in"
        >
          {images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={multi ? `${name} view ${i + 1}` : name}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              aria-hidden={i !== active}
              className={`object-contain p-3 sm:p-5 transition-opacity duration-300 ${i === active ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </button>

        {overlay}

        {multi && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-700 hover:bg-white hover:text-zinc-900 transition-all opacity-70 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-700 hover:bg-white hover:text-zinc-900 transition-all opacity-70 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-0.5 text-[11px] font-semibold text-zinc-600 rounded-sm pointer-events-none">
              {active + 1} / {images.length}
            </div>
          </>
        )}

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 text-[11px] font-medium text-zinc-500 rounded-sm flex items-center gap-1 pointer-events-none">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          Tap to zoom
        </div>
      </div>

      {multi && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Choose image">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Image ${i + 1}`}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-zinc-50 rounded-sm overflow-hidden border-2 transition-colors ${
                active === i ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={images}
          currentIndex={active}
          onIndexChange={setActive}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  );
}
