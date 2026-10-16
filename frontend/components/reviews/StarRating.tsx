'use client';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };

function Star({ filled, size }: { filled: boolean; size: 'sm' | 'md' | 'lg' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`${sizeMap[size]} ${filled ? 'text-amber-400' : 'text-zinc-200'} transition-colors`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function StarRating({ value, max = 5, size = 'md', interactive = false, onChange }: StarRatingProps) {
  if (!interactive) {
    return (
      <div className="flex gap-0.5" role="img" aria-label={`Rated ${value} out of ${max}`}>
        {Array.from({ length: max }).map((_, i) => (
          <Star key={i} filled={i < value} size={size} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className="cursor-pointer hover:scale-110 transition-transform focus:outline-none"
          aria-label={`Rate ${i + 1} star${i !== 0 ? 's' : ''}`}
        >
          <Star filled={i < value} size={size} />
        </button>
      ))}
    </div>
  );
}
