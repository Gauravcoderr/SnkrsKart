import { useState, useEffect } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  hasDate: boolean;
}

function calcTimeLeft(target: Date): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  };
}

export function useCountdown(targetDate: string | undefined): CountdownResult {
  const [state, setState] = useState<Omit<CountdownResult, 'hasDate'>>(() => {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false };
    return calcTimeLeft(new Date(targetDate));
  });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate);

    const tick = () => {
      const next = calcTimeLeft(target);
      setState(next);
      if (next.expired) clearInterval(id);
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return { ...state, hasDate: !!targetDate };
}
