'use client';

import { useEffect, useState } from 'react';
import { SHOE_SIZES, CLOTHING_SIZES, ACCESSORY_SIZES } from '@/lib/constants';
import { ScrapedProduct, PublishProductType, API } from './types';

interface PublishModalProps {
  item: ScrapedProduct;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  getToken: () => string;
}

export default function PublishModal({ item, onClose, onSuccess, getToken }: PublishModalProps) {
  const [publishing, setPublishing] = useState(false);
  const [publishProductType, setPublishProductType] = useState<PublishProductType>('shoes');
  const [publishSelectedSizes, setPublishSelectedSizes] = useState<Set<number>>(new Set());
  const [publishAvailableSizes, setPublishAvailableSizes] = useState<Set<number>>(new Set());
  const [publishSelectedStringSizes, setPublishSelectedStringSizes] = useState<Set<string>>(new Set());
  const [publishAvailableStringSizes, setPublishAvailableStringSizes] = useState<Set<string>>(new Set());
  const [publishSamePriceForAll, setPublishSamePriceForAll] = useState(true);
  const [publishUniformPrice, setPublishUniformPrice] = useState('');
  const [publishUniformOriginal, setPublishUniformOriginal] = useState('');
  const [publishUniformMaxQty, setPublishUniformMaxQty] = useState('1');
  const [publishVariantPrices, setPublishVariantPrices] = useState<Record<string, { price: string; originalPrice: string; maxQty: string }>>({});

  const publishActiveSizeKeys: string[] = publishProductType === 'shoes'
    ? Array.from(publishSelectedSizes).sort((a, b) => a - b).map(String)
    : Array.from(publishSelectedStringSizes);

  // Pre-populate from item on mount
  useEffect(() => {
    const parsedSizes = item.sizes
      .map((s) => parseFloat(s.replace(/[^0-9.]/g, '')))
      .filter((n) => !isNaN(n));
    const price = String(item.price ?? '');
    const original = String(item.originalPrice ?? '');
    setPublishProductType('shoes');
    setPublishSelectedSizes(new Set(parsedSizes));
    setPublishAvailableSizes(new Set(parsedSizes));
    setPublishSelectedStringSizes(new Set());
    setPublishAvailableStringSizes(new Set());
    setPublishSamePriceForAll(true);
    setPublishUniformPrice(price);
    setPublishUniformOriginal(original);
    setPublishUniformMaxQty('1');
    const init: Record<string, { price: string; originalPrice: string; maxQty: string }> = {};
    for (const s of parsedSizes) {
      init[String(s)] = { price, originalPrice: original, maxQty: '1' };
    }
    setPublishVariantPrices(init);
  }, [item]);

  // Sync variant price keys when selected sizes change
  useEffect(() => {
    setPublishVariantPrices((prev) => {
      const next: Record<string, { price: string; originalPrice: string; maxQty: string }> = {};
      for (const key of publishActiveSizeKeys) {
        next[key] = prev[key] ?? { price: publishUniformPrice, originalPrice: publishUniformOriginal, maxQty: publishUniformMaxQty };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishSelectedSizes, publishSelectedStringSizes, publishProductType]);

  function togglePublishNumericSize(size: number) {
    setPublishSelectedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) {
        next.delete(size);
        setPublishAvailableSizes((a) => { const na = new Set(a); na.delete(size); return na; });
      } else {
        next.add(size);
      }
      return next;
    });
  }

  function togglePublishNumericAvailable(size: number) {
    if (!publishSelectedSizes.has(size)) return;
    setPublishAvailableSizes((prev) => {
      const next = new Set(prev);
      next.has(size) ? next.delete(size) : next.add(size);
      return next;
    });
  }

  function togglePublishStringSize(size: string) {
    setPublishSelectedStringSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) {
        next.delete(size);
        setPublishAvailableStringSizes((a) => { const na = new Set(a); na.delete(size); return na; });
      } else {
        next.add(size);
      }
      return next;
    });
  }

  function togglePublishStringAvailable(size: string) {
    if (!publishSelectedStringSizes.has(size)) return;
    setPublishAvailableStringSizes((prev) => {
      const next = new Set(prev);
      next.has(size) ? next.delete(size) : next.add(size);
      return next;
    });
  }

  function handlePublishSamePriceToggle(checked: boolean) {
    setPublishSamePriceForAll(checked);
    if (checked) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) {
          next[key] = { price: publishUniformPrice, originalPrice: publishUniformOriginal, maxQty: publishUniformMaxQty };
        }
        return next;
      });
    }
  }

  function handlePublishUniformPriceChange(price: string) {
    setPublishUniformPrice(price);
    if (publishSamePriceForAll) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) next[key] = { ...next[key], price };
        return next;
      });
    }
  }

  function handlePublishUniformOriginalChange(orig: string) {
    setPublishUniformOriginal(orig);
    if (publishSamePriceForAll) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) next[key] = { ...next[key], originalPrice: orig };
        return next;
      });
    }
  }

  function handlePublishUniformMaxQtyChange(qty: string) {
    setPublishUniformMaxQty(qty);
    if (publishSamePriceForAll) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) next[key] = { ...next[key], maxQty: qty };
        return next;
      });
    }
  }

  function setPublishVariantField(key: string, field: 'price' | 'originalPrice' | 'maxQty', value: string) {
    setPublishVariantPrices((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const token = getToken();
      const isShoes = publishProductType === 'shoes';
      const numericSizes = Array.from(publishSelectedSizes).sort((a, b) => a - b);
      const strSizes = Array.from(publishSelectedStringSizes);
      const strAvailable = Array.from(publishAvailableStringSizes);

      const variantKeys = isShoes ? numericSizes.map(String) : strSizes;
      const variants = variantKeys.map((key) => {
        const entry = publishVariantPrices[key] ?? { price: publishUniformPrice, originalPrice: publishUniformOriginal, maxQty: publishUniformMaxQty };
        return {
          size: isShoes ? Number(key) : key,
          price: Number(entry.price),
          originalPrice: entry.originalPrice ? Number(entry.originalPrice) : null,
          maxQty: Math.max(1, Number(entry.maxQty) || 1),
        };
      });

      const basePrice = variants.length ? Math.min(...variants.map((v) => v.price)) : Number(publishUniformPrice);
      const baseOriginal = variants.length
        ? (() => {
            const origs = variants.map((v) => v.originalPrice).filter((v): v is number => v !== null);
            return origs.length ? Math.min(...origs) : null;
          })()
        : (publishUniformOriginal ? Number(publishUniformOriginal) : null);

      const res = await fetch(`${API}/admin/scraped-products/${item._id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: publishProductType,
          sizes: isShoes ? numericSizes : [],
          availableSizes: isShoes ? Array.from(publishAvailableSizes).sort((a, b) => a - b) : [],
          stringSizes: isShoes ? [] : strSizes,
          availableStringSizes: isShoes ? [] : strAvailable,
          variants,
          price: basePrice,
          originalPrice: baseOriginal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Publish failed');
      onSuccess(`Published: ${data.product?.name}`);
      onClose();
    } catch (err) {
      onSuccess((err as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-8 pb-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">Configure & Publish</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Product preview */}
          <div className="flex gap-3 items-center bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
            {item.images[0] && (
              <img
                src={item.images[0]}
                alt=""
                className="w-14 h-14 object-cover rounded-lg bg-zinc-800 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{item.name}</p>
              <p className="text-zinc-400 text-xs mt-0.5">
                {item.brand} ·{' '}
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {item.sourceSite}
                </a>
              </p>
              {item.colorway && <p className="text-zinc-500 text-[10px] mt-0.5">{item.colorway}</p>}
            </div>
          </div>

          {/* Product type */}
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-2">Product Type</p>
            <div className="grid grid-cols-3 gap-2">
              {(['shoes', 'clothing', 'accessories'] as PublishProductType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setPublishProductType(type);
                    setPublishSelectedSizes(new Set());
                    setPublishAvailableSizes(new Set());
                    setPublishSelectedStringSizes(new Set());
                    setPublishAvailableStringSizes(new Set());
                  }}
                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                    publishProductType === type
                      ? 'bg-white text-zinc-900 border-white'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="border border-zinc-700 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-white">
              {publishProductType === 'shoes' ? 'Sizes (UK)' : 'Sizes'}
              <span className="ml-2 text-xs font-normal text-zinc-400">click to select · bottom row = in-stock</span>
            </p>

            {publishProductType === 'shoes' ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {SHOE_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => togglePublishNumericSize(size)}
                      className={`px-2.5 py-1.5 text-xs font-semibold border rounded transition-all ${
                        publishSelectedSizes.has(size)
                          ? 'bg-white text-zinc-900 border-white'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {publishSelectedSizes.size > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">In Stock (Available)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(publishSelectedSizes).sort((a, b) => a - b).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => togglePublishNumericAvailable(size)}
                          className={`px-2.5 py-1.5 text-xs font-semibold border rounded transition-all ${
                            publishAvailableSizes.has(size)
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-600 hover:border-zinc-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {(publishProductType === 'clothing' ? [...CLOTHING_SIZES] : [...ACCESSORY_SIZES]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => togglePublishStringSize(size)}
                      className={`px-3 py-1.5 text-xs font-semibold border rounded transition-all ${
                        publishSelectedStringSizes.has(size)
                          ? 'bg-white text-zinc-900 border-white'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {publishSelectedStringSizes.size > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">In Stock (Available)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(publishSelectedStringSizes).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => togglePublishStringAvailable(size)}
                          className={`px-3 py-1.5 text-xs font-semibold border rounded transition-all ${
                            publishAvailableStringSizes.has(size)
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-600 hover:border-zinc-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border border-zinc-700 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Pricing per Size</span>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={publishSamePriceForAll}
                  onChange={(e) => handlePublishSamePriceToggle(e.target.checked)}
                  className="w-4 h-4 rounded accent-white"
                />
                Same price for all sizes
              </label>
            </div>

            {publishSamePriceForAll ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    value={publishUniformPrice}
                    onChange={(e) => handlePublishUniformPriceChange(e.target.value)}
                    placeholder="e.g. 12000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Original Price (₹)</label>
                  <input
                    type="number"
                    value={publishUniformOriginal}
                    onChange={(e) => handlePublishUniformOriginalChange(e.target.value)}
                    placeholder="e.g. 14000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Max Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={publishUniformMaxQty}
                    onChange={(e) => handlePublishUniformMaxQtyChange(e.target.value)}
                    placeholder="1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {publishActiveSizeKeys.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Select sizes above to set per-size prices.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-[80px_1fr_1fr_80px] gap-3 text-xs font-medium text-zinc-500 pb-1 border-b border-zinc-800">
                      <span>{publishProductType === 'shoes' ? 'UK Size' : 'Size'}</span>
                      <span>Price (₹) *</span>
                      <span>Original (₹)</span>
                      <span>Max Qty</span>
                    </div>
                    {publishActiveSizeKeys.map((key) => (
                      <div key={key} className="grid grid-cols-[80px_1fr_1fr_80px] gap-3 items-center">
                        <span className="text-sm font-semibold text-zinc-300">
                          {publishProductType === 'shoes' ? `UK ${key}` : key}
                        </span>
                        <input
                          type="number"
                          value={publishVariantPrices[key]?.price ?? ''}
                          onChange={(e) => setPublishVariantField(key, 'price', e.target.value)}
                          placeholder="Price"
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                        <input
                          type="number"
                          value={publishVariantPrices[key]?.originalPrice ?? ''}
                          onChange={(e) => setPublishVariantField(key, 'originalPrice', e.target.value)}
                          placeholder="Optional"
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                        <input
                          type="number"
                          min={1}
                          value={publishVariantPrices[key]?.maxQty ?? '1'}
                          onChange={(e) => setPublishVariantField(key, 'maxQty', e.target.value)}
                          placeholder="1"
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={publishing}
              className="flex-1 px-4 py-2.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 px-4 py-2.5 text-xs font-semibold text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {publishing && <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />}
              {publishing ? 'Publishing...' : 'Confirm Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
