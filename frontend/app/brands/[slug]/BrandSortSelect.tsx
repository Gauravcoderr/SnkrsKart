'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'discount', label: 'Biggest Discount' },
];

export default function BrandSortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('sort') || 'popular';

  return (
    <select
      value={current}
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        p.set('sort', e.target.value);
        router.push(`?${p.toString()}`);
      }}
      className="border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold tracking-wide px-3 py-2 focus:outline-none focus:border-zinc-900 cursor-pointer"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
