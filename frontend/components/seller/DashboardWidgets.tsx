'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const SEGMENTS = ['bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function SegmentBar({ progress, dim = 'bg-zinc-200', marker = 'bg-zinc-900', size = 'md', className }: {
  progress: number | null;
  dim?: string;
  marker?: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const p = progress === null ? null : clamp(progress, 0, 1);
  return (
    <div className={cn('relative flex gap-1', size === 'lg' ? 'h-2.5' : 'h-2', className)}>
      {SEGMENTS.map((color, i) => {
        const fill = p === null ? 0 : clamp(p * SEGMENTS.length - i, 0, 1);
        return (
          <div key={color} className={cn('flex-1 overflow-hidden', dim)}>
            <div className={cn('h-full transition-[width] duration-500', color)} style={{ width: `${fill * 100}%` }} />
          </div>
        );
      })}
      {p !== null && (
        <span
          className={cn('absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 rounded-full', marker, size === 'lg' ? 'h-5' : 'h-4')}
          style={{ left: `${p * 100}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function ScaleBar({ label, value, display, min, max, reverse = false, ticks, hint, meta, emptyText = 'No data yet' }: {
  label: string;
  value: number | null;
  display: string;
  min: number;
  max: number;
  reverse?: boolean;
  ticks: string[];
  hint?: string;
  meta?: string;
  emptyText?: string;
}) {
  const span = max - min || 1;
  const progress = value === null ? null : reverse ? (max - clamp(value, min, max)) / span : (clamp(value, min, max) - min) / span;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-900">{label}</p>
          {hint && <p className="text-[11px] text-zinc-400 mt-0.5">{hint}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-sm font-black', value === null ? 'text-zinc-400' : 'text-zinc-900')}>{value === null ? emptyText : display}</p>
          {meta && value !== null && <p className="text-[10px] text-zinc-400">{meta}</p>}
        </div>
      </div>
      <SegmentBar progress={progress} />
      <div className="flex justify-between mt-1.5 text-[10px] text-zinc-400 tabular-nums">
        {ticks.map((t, i) => (
          <span key={`${t}-${i}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function MetricCard({ label, value, hint, href, tone = 'default' }: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: 'default' | 'amber' | 'emerald' | 'dark';
}) {
  const toneClass = {
    default: 'bg-white border-zinc-200 hover:border-zinc-400',
    amber: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    dark: 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800',
  }[tone];
  const labelClass = tone === 'dark' ? 'text-zinc-400' : 'text-zinc-500';
  const hintClass = tone === 'dark' ? 'text-zinc-400' : 'text-zinc-400';
  const body = (
    <>
      <p className={cn('text-[10px] font-bold tracking-widest uppercase', labelClass)}>{label}</p>
      <p className="text-2xl sm:text-3xl font-black tracking-tight mt-2 leading-none">{value}</p>
      {hint && <p className={cn('text-[11px] mt-2 leading-snug', hintClass)}>{hint}</p>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn('block border p-4 transition-colors', toneClass)}>
        {body}
      </Link>
    );
  }
  return <div className={cn('border p-4', toneClass)}>{body}</div>;
}

export function CountCell({ label, value, href, accent }: { label: string; value: number; href: string; accent?: boolean }) {
  return (
    <Link href={href} className="block border-b border-dashed border-zinc-200 py-3 hover:bg-zinc-50 transition-colors px-1 -mx-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn('text-2xl font-black tracking-tight mt-1 leading-none', accent && value > 0 ? 'text-amber-700' : 'text-zinc-900')}>{value}</p>
    </Link>
  );
}
