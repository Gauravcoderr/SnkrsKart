'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <div className="flex flex-col-reverse sm:flex-row gap-4">
        {/* Thumbnail strip */}
        <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto hide-scrollbar sm:max-h-[600px] shrink-0">
          {images.map((src, i) => (
            <button
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition-all duration-150 ${
                activeIndex === i ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <Image
                src={src}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className="flex-1 relative">
          <div
            className={`relative aspect-square bg-zinc-100 overflow-hidden cursor-zoom-in ${zoomed ? 'cursor-zoom-out' : ''}`}
            onClick={() => setZoomed(true)}
          >
            <Image
              src={images[activeIndex]}
              alt={productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              className={`object-cover transition-transform duration-500 ${zoomed ? 'scale-125' : 'hover:scale-105'}`}
            />
            {/* Image counter */}
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              {activeIndex + 1} / {images.length}
            </div>
          </div>

          {/* Mobile prev/next */}
          <div className="flex sm:hidden items-center justify-center gap-3 mt-3">
            <button
              onClick={() => setActiveIndex((p) => Math.max(0, p - 1))}
              disabled={activeIndex === 0}
              className="p-2 disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-zinc-900 w-4' : 'bg-zinc-300'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveIndex((p) => Math.min(images.length - 1, p + 1))}
              disabled={activeIndex === images.length - 1}
              className="p-2 disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Zoom lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-4xl w-full aspect-square">
            <Image
              src={images[activeIndex]}
              alt={productName}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 900px"
            />
          </div>
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
