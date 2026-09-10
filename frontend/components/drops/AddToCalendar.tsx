'use client';

import { useEffect, useRef, useState } from 'react';
import { Drop } from '@/types';
import { googleCalendarUrl, downloadIcs } from '@/lib/calendar';

type DropLite = Pick<Drop, 'name' | 'brand' | 'colorway' | 'where' | 'slug' | 'releaseDate'>;

interface Props {
  drop: DropLite;
  variant?: 'button' | 'compact';
}

const CalIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function AddToCalendar({ drop, variant = 'button' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const trigger = variant === 'compact'
    ? 'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold tracking-widest uppercase text-zinc-600 border border-zinc-200 hover:border-zinc-900 hover:text-zinc-900 transition-colors rounded-sm'
    : 'w-full py-3.5 border-2 border-zinc-200 text-sm font-bold tracking-widest uppercase text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-colors duration-200 flex items-center justify-center gap-2 rounded-sm';

  return (
    <div ref={ref} className={`relative ${variant === 'button' ? 'w-full' : ''}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={trigger} aria-haspopup="menu" aria-expanded={open}>
        <CalIcon className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {variant === 'compact' ? 'Calendar' : 'Add to calendar'}
      </button>
      {open && (
        <div role="menu" className="absolute z-30 mt-1.5 left-0 min-w-[190px] bg-white border border-zinc-200 shadow-lg rounded-sm py-1 animate-scale-in origin-top-left">
          <a
            role="menuitem"
            href={googleCalendarUrl(drop)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Google Calendar
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={() => { downloadIcs(drop); setOpen(false); }}
            className="block w-full text-left px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Apple / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
