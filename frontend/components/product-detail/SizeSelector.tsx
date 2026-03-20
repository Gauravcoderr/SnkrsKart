'use client';

interface SizeSelectorProps {
  sizes: number[];
  availableSizes: number[];
  selectedSize: number | null;
  onSizeSelect: (size: number) => void;
  showError?: boolean;
}

export default function SizeSelector({
  sizes,
  availableSizes,
  selectedSize,
  onSizeSelect,
  showError = false,
}: SizeSelectorProps) {
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
        <button className="text-xs text-zinc-500 underline hover:text-zinc-900 transition-colors">
          Size Guide
        </button>
      </div>

      <div
        className={`grid grid-cols-5 gap-2 ${showError ? 'ring-2 ring-red-400 ring-offset-2 p-2' : ''}`}
      >
        {sizes.map((size) => {
          const available = availableSizes.includes(size);
          const selected = selectedSize === size;
          return (
            <button
              key={size}
              onClick={() => available && onSizeSelect(size)}
              disabled={!available}
              className={`
                relative h-11 text-sm font-semibold border transition-all duration-150
                ${selected
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : available
                  ? 'border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                  : 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                }
              `}
            >
              {size}
              {/* Diagonal line for unavailable */}
              {!available && (
                <span className="absolute inset-0 flex items-center justify-center">
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

      {selectedSize && !availableSizes.includes(selectedSize) && (
        <p className="text-xs text-zinc-400 mt-2">This size is currently unavailable</p>
      )}
    </div>
  );
}
