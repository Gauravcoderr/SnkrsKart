'use client';

import { useEffect, useState } from 'react';

interface Props {
  releaseDate: string;      // ISO string, date-only precision (midnight UTC)
  size?: 'sm' | 'lg';
  className?: string;
}

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

// Live countdown to a drop's release moment (midnight UTC on release day = 05:30 IST).
export default function Countdown({ releaseDate, size = 'sm', className = '' }: Props) {
  const target = new Date(`${releaseDate.slice(0, 10)}T00:00:00Z`).getTime();
  // Server renders real values; the seconds cell may differ on hydration, so it is marked suppressHydrationWarning
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = parts(target - now);
  const released = target - now <= 0;

  const cells: [string, number][] = [
    ['Days', t.d],
    ['Hrs', t.h],
    ['Min', t.m],
    ['Sec', t.s],
  ];

  if (released) {
    return (
      <p className={`text-xs font-bold tracking-widest uppercase text-emerald-600 ${className}`}>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
        Live now
      </p>
    );
  }

  const num = size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-lg';
  const lab = size === 'lg' ? 'text-[9px]' : 'text-[8px]';

  return (
    <div className={`flex items-start gap-3 sm:gap-4 ${className}`} aria-live="off" suppressHydrationWarning>
      {cells.map(([label, value], i) => (
        <div key={label} className="flex items-start gap-3 sm:gap-4">
          <div className="text-center">
            <p className={`${num} font-black tabular-nums leading-none tracking-tight`} suppressHydrationWarning>
              {String(value).padStart(2, '0')}
            </p>
            <p className={`${lab} font-bold tracking-[0.25em] uppercase opacity-50 mt-1`}>{label}</p>
          </div>
          {i < cells.length - 1 && <span className={`${num} font-black leading-none opacity-30`}>:</span>}
        </div>
      ))}
    </div>
  );
}
