'use client';

import { SortOption } from '@/types';

interface SortDropdownProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
  total: number;
}

const options: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function SortDropdown({ value, onChange, total }: SortDropdownProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-zinc-500 shrink-0">
        <span className="font-semibold text-zinc-900">{total}</span> products
      </p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className="appearance-none bg-white border border-zinc-200 text-sm font-medium text-zinc-900 px-4 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-900 hover:border-zinc-400 transition-colors"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
