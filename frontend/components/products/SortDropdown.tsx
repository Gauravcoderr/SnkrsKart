'use client';

import { SortOption } from '@/types';
import { SORT_OPTIONS } from '@/lib/constants';
import { Select } from '@/components/ui/Elements';

interface SortDropdownProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
  total: number;
}

export default function SortDropdown({ value, onChange, total }: SortDropdownProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-zinc-500 shrink-0">
        <span className="font-semibold text-zinc-900">{total}</span> products
      </p>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="font-medium pr-8"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
