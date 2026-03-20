'use client';

import { formatPrice } from '@/lib/utils';

interface ProductVariant {
  size: number;
  price: number;
  originalPrice: number | null;
}

interface SizeSelectorProps {
  sizes: number[];
  availableSizes: number[];
  selectedSize: number | null;
  onSizeSelect: (size: number) => void;
  showError?: boolean;
  variants?: ProductVariant[];
}

export default function SizeSelector({
  sizes,
  availableSizes,
  selectedSize,
  onSizeSelect,
  showError = false,
  variants,
}: SizeSelectorProps) {
  const hasVariants = (variants?.length ?? 0) > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold tracking-widest uppercase text-zinc-900">
          Select Size (UK)
          {selectedSize && (
            <span className="ml-2 text-zinc-400 normal-case font-normal tracking-normal">
              — UK {selectedSize}
            </span>
          )}
        </p>
        <button type="button" className="text-xs text-zinc-500 underline hover:text-zinc-900 transition-colors">
          Size Guide
        </button>
      </div>

      <div
        className={`grid gap-2 ${hasVariants ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-5'} ${showError ? 'ring-2 ring-red-400 ring-offset-2 p-2' : ''}`}
      >
        {sizes.map((size) => {
          const available = availableSizes.includes(size);
          const selected = selectedSize === size;
          const variant = hasVariants ? variants!.find((v) => v.size === size) : null;

          return (
            <button
              key={size}
              type="button"
              onClick={() => available && onSizeSelect(size)}
              disabled={!available}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 border transition-all duration-150
                ${hasVariants ? 'py-2.5 px-2' : 'h-11'}
                ${selected
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : available
                  ? 'border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                  : 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                }
              `}
            >
              <span className="text-sm font-semibold">{size}</span>
              {variant && (
                <span className={`text-[9px] font-medium leading-none ${selected ? 'text-white/70' : available ? 'text-zinc-500' : 'text-zinc-300'}`}>
                  {formatPrice(variant.price)}
                </span>
              )}
              {!available && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="absolute w-full h-px bg-zinc-200 rotate-45" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showError && (
        <p className="text-xs text-red-500 mt-2 font-medium">Please select a size to continue</p>
      )}
    </div>
  );
}
