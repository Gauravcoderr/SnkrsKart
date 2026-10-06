'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export interface ActionItem {
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  tone?: 'default' | 'primary' | 'success' | 'danger';
  disabled?: boolean;
  hidden?: boolean;
}

const TONE: Record<NonNullable<ActionItem['tone']>, string> = {
  default: 'text-zinc-200 hover:bg-zinc-800',
  primary: 'text-white font-semibold hover:bg-zinc-800',
  success: 'text-emerald-400 hover:bg-emerald-950/40',
  danger: 'text-red-400 hover:bg-red-950/40',
};

export default function ActionsMenu({ items, label = 'Actions', busy = false }: { items: ActionItem[]; label?: string; busy?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const width = 200;
    const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
    const estimatedHeight = visible.length * 38 + 12;
    const top = r.bottom + estimatedHeight > window.innerHeight - 8 ? r.top - estimatedHeight - 6 : r.bottom + 6;
    setPos({ top, left });
  }, [open, visible.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  if (visible.length === 0) return null;

  const itemClass = (i: ActionItem) =>
    `w-full text-left px-3 py-2 text-sm rounded-md transition ${TONE[i.tone ?? 'default']} ${i.disabled ? 'opacity-40 pointer-events-none' : ''}`;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition ${open ? 'bg-zinc-800 border-zinc-600 text-white' : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'} disabled:opacity-40`}
      >
        {busy ? (
          <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          </svg>
        )}
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 200 }}
          className="z-[70] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 animate-scale-in origin-top-right"
        >
          {visible.map((i) =>
            i.href ? (
              i.external ? (
                <a key={i.label} role="menuitem" href={i.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={`block ${itemClass(i)}`}>{i.label}</a>
              ) : (
                <Link key={i.label} role="menuitem" href={i.href} onClick={() => setOpen(false)} className={`block ${itemClass(i)}`}>{i.label}</Link>
              )
            ) : (
              <button key={i.label} role="menuitem" type="button" disabled={i.disabled} onClick={() => { setOpen(false); i.onClick?.(); }} className={itemClass(i)}>{i.label}</button>
            ),
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
