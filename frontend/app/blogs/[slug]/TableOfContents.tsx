'use client';

import { useState } from 'react';
import type { Heading } from './headings';

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(true);
  const items = headings.filter((h) => h.text);

  if (items.length < 2) return null;

  return (
    <nav className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 mb-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-xs font-bold tracking-widest uppercase text-zinc-500">
          Table of Contents
        </span>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ol className="mt-3 space-y-1.5">
          {items.map((h) => (
            <li key={h.id} className={h.level === 3 ? 'ml-4' : ''}>
              <a
                href={`#${h.id}`}
                className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors leading-snug block py-0.5"
              >
                {h.level === 2 ? (
                  <span className="font-semibold">{h.text}</span>
                ) : (
                  <span className="text-zinc-500">{h.text}</span>
                )}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
