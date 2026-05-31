'use client';

import { useState } from 'react';
import { FilterState } from '@/types';
import { BRANDS, SHOE_SIZES, GENDERS, CLOTHING_SIZES, ACCESSORY_SIZES, PRODUCT_TYPES } from '@/lib/constants';
import { ChevronDownIcon } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Elements';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: unknown) => void;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-zinc-100 py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left mb-3"
      >
        <span className="text-xs font-bold tracking-widest uppercase text-zinc-900">{title}</span>
        <ChevronDownIcon
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
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

  const toggleStringSize = (size: string) => {
    const next = filters.stringSizes.includes(size)
      ? filters.stringSizes.filter((s) => s !== size)
      : [...filters.stringSizes, size];
    onFilterChange('stringSizes', next);
  };

  const toggleGender = (gender: string) => {
    const next = filters.gender.includes(gender)
      ? filters.gender.filter((g) => g !== gender)
      : [...filters.gender, gender];
    onFilterChange('gender', next);
  };

  const toggleProductType = (type: string) => {
    const next = filters.productTypes.includes(type)
      ? filters.productTypes.filter((t) => t !== type)
      : [...filters.productTypes, type];
    onFilterChange('productTypes', next);
  };

  // Determine which size sections to show based on active productType filters
  const showShoesSizes = filters.productTypes.length === 0 || filters.productTypes.includes('shoes');
  const showClothingSizes = filters.productTypes.length === 0 || filters.productTypes.includes('clothing');
  const showAccessorySizes = filters.productTypes.length === 0 || filters.productTypes.includes('accessories');
  const sizeTitle = filters.productTypes.length === 1
    ? filters.productTypes[0] === 'shoes' ? 'Size (UK)' : 'Size'
    : 'Size';

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-900">Filter</h2>
      </div>

      {/* Product Type */}
      <FilterSection title="Category">
        <div className="space-y-2">
          {PRODUCT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.productTypes.includes(type)}
                onChange={() => toggleProductType(type)}
                className="w-4 h-4 rounded-none border-zinc-300 accent-zinc-900 cursor-pointer"
              />
              <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors capitalize">
                {type}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Brand */}
      <FilterSection title="Brand">
        <div className="space-y-2">
          {BRANDS.map((brand) => (
            <label key={brand.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand.label)}
                onChange={() => toggleBrand(brand.label)}
                className="w-4 h-4 rounded-none border-zinc-300 accent-zinc-900 cursor-pointer"
              />
              <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                {brand.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender">
        <div className="space-y-2">
          {GENDERS.map((gender) => (
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

      {/* Size — context-aware */}
      <FilterSection title={sizeTitle}>
        <div className="space-y-3">
          {showShoesSizes && (
            <div>
              {(showClothingSizes || showAccessorySizes) && (
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">Shoes (UK)</p>
              )}
              <div className="grid grid-cols-4 gap-1.5">
                {SHOE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
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
            </div>
          )}

          {showClothingSizes && (
            <div>
              {(showShoesSizes || showAccessorySizes) && (
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">Clothing</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {CLOTHING_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleStringSize(size)}
                    className={`h-9 px-3 text-xs font-semibold border transition-all duration-150 ${
                      filters.stringSizes.includes(size)
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAccessorySizes && (
            <div>
              {(showShoesSizes || showClothingSizes) && (
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">Accessories</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {ACCESSORY_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleStringSize(size)}
                    className={`h-9 px-3 text-xs font-semibold border transition-all duration-150 ${
                      filters.stringSizes.includes(size)
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Min (₹)</label>
              <Input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange('minPrice', Number(e.target.value) || 0)}
                placeholder="0"
                min={0}
                className="mt-0.5"
              />
            </div>
            <span className="text-zinc-400 mt-4">–</span>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Max (₹)</label>
              <Input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange('maxPrice', Number(e.target.value) || 0)}
                placeholder="30000"
                min={0}
                className="mt-0.5"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-400">₹4,995 – ₹28,995</p>
        </div>
      </FilterSection>
    </aside>
  );
}
