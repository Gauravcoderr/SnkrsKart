'use client';

import { useState } from 'react';
import { FilterState } from '@/types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: unknown) => void;
}

const ALL_BRANDS = ['Jordan', 'Nike', 'Adidas', 'New Balance', 'Crocs'];
const ALL_SIZES = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12];
const ALL_GENDERS = ['men', 'women', 'unisex'];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-zinc-100 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left mb-3"
      >
        <span className="text-xs font-bold tracking-widest uppercase text-zinc-900">{title}</span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onFilterChange('brands', next);
  };

  const toggleSize = (size: number) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange('sizes', next);
  };

  const toggleGender = (gender: string) => {
    const next = filters.gender.includes(gender)
      ? filters.gender.filter((g) => g !== gender)
      : [...filters.gender, gender];
    onFilterChange('gender', next);
  };

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-900">Filter</h2>
      </div>

      {/* Brand */}
      <FilterSection title="Brand">
        <div className="space-y-2">
          {ALL_BRANDS.map((brand) => (
            <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="w-4 h-4 rounded-none border-zinc-300 accent-zinc-900 cursor-pointer"
              />
              <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender">
        <div className="space-y-2">
          {ALL_GENDERS.map((gender) => (
            <label key={gender} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.gender.includes(gender)}
                onChange={() => toggleGender(gender)}
                className="w-4 h-4 rounded-none border-zinc-300 accent-zinc-900 cursor-pointer"
              />
              <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors capitalize">
                {gender}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size (UK)">
        <div className="grid grid-cols-4 gap-1.5">
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`h-9 text-xs font-semibold border transition-all duration-150 ${
                filters.sizes.includes(size)
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Min (₹)</label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange('minPrice', Number(e.target.value) || 0)}
                placeholder="0"
                min={0}
                className="w-full mt-0.5 border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
            <span className="text-zinc-400 mt-4">–</span>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Max (₹)</label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange('maxPrice', Number(e.target.value) || 0)}
                placeholder="30000"
                min={0}
                className="w-full mt-0.5 border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-400">₹4,995 – ₹28,995</p>
        </div>
      </FilterSection>
    </aside>
  );
}
