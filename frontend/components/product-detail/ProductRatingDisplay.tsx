'use client';

import { useEffect, useState } from 'react';

interface ProductRatingDisplayProps {
  initialRating: number;
  initialCount: number;
}

export default function ProductRatingDisplay({ initialRating, initialCount }: ProductRatingDisplayProps) {
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const handler = (e: Event) => {
      const { newRating, newCount } = (e as CustomEvent).detail;
      setRating(newRating);
      setCount(newCount);
    };
    window.addEventListener('snkrs:review-added', handler);
    return () => window.removeEventListener('snkrs:review-added', handler);
  }, []);

  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-zinc-900' : 'text-zinc-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-zinc-700">{count > 0 ? rating.toFixed(1) : '0'}</span>
      <span className="text-xs text-zinc-400">({count.toLocaleString()} {count === 1 ? 'review' : 'reviews'})</span>
    </div>
  );
}
