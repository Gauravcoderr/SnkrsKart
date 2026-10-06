'use client';

import { formatPrice } from '@/lib/utils';
import { Offer } from '@/types';
import { AVAILABILITY_META, AVAILABILITY_ORDER } from '@/lib/availability';

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
  offers?: Offer[];
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
  offers,
  onSizeGuide,
}: SizeSelectorProps) {
  const isStringMode = productType !== 'shoes' && (stringSizes?.length ?? 0) > 0;
  const hasVariants = (variants?.length ?? 0) > 0;
  const hasOffers = (offers?.length ?? 0) > 0;
  const showPrices = hasVariants || hasOffers;

  const offerFor = (size: number | string) => offers?.find((o) => String(o.size) === String(size));
  const priceFor = (size: number | string): number | null => {
    const offer = offerFor(size);
    if (offer) return offer.price;
    const variant = hasVariants ? variants!.find((v) => String(v.size) === String(size)) : null;
    return variant ? variant.price : null;
  };

  const usedAvailabilities = AVAILABILITY_ORDER.filter((a) => offers?.some((o) => o.availability === a));
  const showLegend = usedAvailabilities.length > 1 || usedAvailabilities.some((a) => a !== 'inhand');

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

  const renderTile = (size: number | string, available: boolean) => {
    const selected = String(selectedSize) === String(size) && selectedSize !== null;
    const price = showPrices ? priceFor(size) : null;
    const offer = offerFor(size);
    const meta = offer ? AVAILABILITY_META[offer.availability] : null;

    return (
      <button
        key={String(size)}
        type="button"
        onClick={() => available && onSizeSelect(size)}
        disabled={!available}
        className={`
          relative overflow-hidden flex flex-col items-center justify-center gap-0.5 border transition-all duration-150
          ${showPrices ? 'py-2.5 px-2' : 'h-11'}
          ${selected
            ? 'bg-zinc-900 text-white border-zinc-900'
            : available
            ? 'border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
            : 'border-zinc-100 text-zinc-300 cursor-not-allowed'
          }
        `}
      >
        <span className="text-sm font-semibold">{size}</span>
        {price !== null && available && (
          <span className={`text-[9px] font-medium leading-none ${selected ? 'text-white/70' : 'text-zinc-500'}`}>
            {formatPrice(price)}
          </span>
        )}
        {meta && available && showLegend && (
          <span className={`flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider leading-none mt-0.5 ${selected ? 'text-white/60' : 'text-zinc-400'}`}>
            <span className={`w-1 h-1 rounded-full ${selected ? 'bg-white/70' : meta.dotClass}`} />
            {meta.short}
          </span>
        )}
        {!available && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="absolute w-full h-px bg-zinc-200 rotate-45" />
          </span>
        )}
      </button>
    );
  };

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
        className={`grid gap-2 ${isStringMode ? 'grid-cols-4' : showPrices ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-5'} ${showError ? 'ring-2 ring-red-400 ring-offset-2 p-2' : ''}`}
      >
        {isStringMode
          ? (stringSizes ?? []).map((size) => renderTile(size, availableStringSizes?.includes(size) ?? true))
          : sizes.map((size) => renderTile(size, availableSizes.includes(size)))}
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
          {usedAvailabilities.map((a) => (
            <span key={a} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className={`w-1.5 h-1.5 rounded-full ${AVAILABILITY_META[a].dotClass}`} />
              <span className="font-semibold text-zinc-700">{AVAILABILITY_META[a].short}</span>
              {AVAILABILITY_META[a].description.toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {showError && (
        <p className="text-xs text-red-500 mt-2 font-medium">Please select a size to continue</p>
      )}
    </div>
  );
}
