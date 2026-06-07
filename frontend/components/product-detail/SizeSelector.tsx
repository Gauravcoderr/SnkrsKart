'use client';

import { formatPrice } from '@/lib/utils';

interface ProductVariant {
  size: number | string;
  price: number;
  originalPrice: number | null;
}

interface SizeSelectorProps {
  productType?: 'shoes' | 'clothing' | 'accessories';
  sizes: number[];
  availableSizes: number[];
  stringSizes?: string[];
  availableStringSizes?: string[];
  selectedSize: number | string | null;
  onSizeSelect: (size: number | string) => void;
  showError?: boolean;
  variants?: ProductVariant[];
  onSizeGuide?: () => void;
}

export default function SizeSelector({
  productType,
  sizes,
  availableSizes,
  stringSizes,
  availableStringSizes,
  selectedSize,
  onSizeSelect,
  showError = false,
  variants,
  onSizeGuide,
}: SizeSelectorProps) {
  const isStringMode = productType !== 'shoes' && (stringSizes?.length ?? 0) > 0;
  const hasVariants = (variants?.length ?? 0) > 0;

  // Accessories with only "One Size" — auto-render as a single badge
  const isOneSize = isStringMode && stringSizes?.length === 1 && stringSizes[0] === 'One Size';

  if (isOneSize) {
    return (
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-3">Size</p>
        <div
          className="w-full py-3 border-2 border-zinc-900 bg-zinc-900 text-white text-sm font-semibold text-center cursor-default"
          onClick={() => onSizeSelect('One Size')}
        >
          One Size
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold tracking-widest uppercase text-zinc-900">
          {isStringMode ? 'Select Size' : 'Select Size (UK)'}
          {selectedSize !== null && selectedSize !== undefined && (
            <span className="ml-2 text-zinc-400 normal-case font-normal tracking-normal">
              — {isStringMode ? selectedSize : `UK ${selectedSize}`}
            </span>
          )}
        </p>
        {!isStringMode && (
          <button type="button" onClick={onSizeGuide} className="text-xs text-zinc-500 underline hover:text-zinc-900 transition-colors">
            Size Guide
          </button>
        )}
      </div>

      <div
        className={`grid gap-2 ${isStringMode ? 'grid-cols-4' : hasVariants ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-5'} ${showError ? 'ring-2 ring-red-400 ring-offset-2 p-2' : ''}`}
      >
        {isStringMode
          ? (stringSizes ?? []).map((size) => {
              const available = availableStringSizes?.includes(size) ?? true;
              const selected = selectedSize === size;
              const variant = hasVariants ? variants!.find((v) => v.size === size) : null;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => available && onSizeSelect(size)}
                  disabled={!available}
                  className={`
                    relative overflow-hidden flex flex-col items-center justify-center gap-0.5 border transition-all duration-150
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
            })
          : sizes.map((size) => {
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
                    relative overflow-hidden flex flex-col items-center justify-center gap-0.5 border transition-all duration-150
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
