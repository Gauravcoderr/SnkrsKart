'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { Product } from '@/types';
import { compressImage } from '@/lib/compressImage';
import { uploadImage } from '@/lib/uploadImage';

interface Props {
  product: Product | null;
  onSave: (data: Partial<Product>) => Promise<void>;
  onClose: () => void;
}

const GENDERS = ['men', 'women', 'unisex', 'kids'] as const;
const CATEGORIES = ['lifestyle', 'basketball', 'running', 'skateboarding', 'casual', 'training'] as const;

function parseSizes(str: string): number[] {
  return str.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
}

export default function ProductFormModal({ product, onSave, onClose }: Props) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    slug: product?.slug || '',
    colorway: product?.colorway || '',
    gender: product?.gender || 'unisex',
    description: product?.description || '',
    category: product?.category || 'lifestyle',
    sku: product?.sku || '',
    sizes: product?.sizes?.join(', ') || '',
    availableSizes: product?.availableSizes?.join(', ') || '',
    colors: product?.colors?.join(', ') || '',
    tags: product?.tags?.join(', ') || '',
    imageList: product?.images?.length ? [...product.images] : [''],
    hoverImage: product?.hoverImage || '',
    featured: product?.featured || false,
    trending: product?.trending || false,
    newArrival: product?.newArrival || false,
    soldOut: product?.soldOut || false,
    comingSoon: product?.comingSoon || false,
  });

  // ── Pricing state ────────────────────────────────────────────────────────
  const [samePriceForAll, setSamePriceForAll] = useState(
    !product?.variants?.length
  );
  const [uniformPrice, setUniformPrice] = useState(
    String(product?.price || '')
  );
  const [uniformOriginal, setUniformOriginal] = useState(
    String(product?.originalPrice || '')
  );
  const [uniformMaxQty, setUniformMaxQty] = useState(
    String(product?.variants?.[0]?.maxQty ?? 1)
  );
  // per-size prices keyed by size number
  const [variantPrices, setVariantPrices] = useState<Record<number, { price: string; originalPrice: string; maxQty: string }>>(() => {
    const map: Record<number, { price: string; originalPrice: string; maxQty: string }> = {};
    if (product?.variants?.length) {
      for (const v of product.variants) {
        map[v.size] = { price: String(v.price), originalPrice: String(v.originalPrice ?? ''), maxQty: String(v.maxQty ?? 1) };
      }
    }
    return map;
  });

  // When sizes field changes, keep variantPrices in sync (preserve existing, add new)
  const parsedSizes = parseSizes(form.sizes);

  useEffect(() => {
    setVariantPrices((prev) => {
      const next: Record<number, { price: string; originalPrice: string; maxQty: string }> = {};
      for (const size of parsedSizes) {
        next[size] = prev[size] ?? { price: uniformPrice, originalPrice: uniformOriginal, maxQty: uniformMaxQty };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sizes]);

  // When "same price" is toggled on, pre-fill all sizes with uniform values
  function handleSamePriceToggle(checked: boolean) {
    setSamePriceForAll(checked);
    if (checked) {
      setVariantPrices((prev) => {
        const next = { ...prev };
        for (const size of parsedSizes) {
          next[size] = { price: uniformPrice, originalPrice: uniformOriginal, maxQty: uniformMaxQty };
        }
        return next;
      });
    }
  }

  // When uniform price changes, push to all variants
  function handleUniformPriceChange(price: string) {
    setUniformPrice(price);
    if (samePriceForAll) {
      setVariantPrices((prev) => {
        const next = { ...prev };
        for (const size of parsedSizes) {
          next[size] = { ...next[size], price };
        }
        return next;
      });
    }
  }

  function handleUniformOriginalChange(orig: string) {
    setUniformOriginal(orig);
    if (samePriceForAll) {
      setVariantPrices((prev) => {
        const next = { ...prev };
        for (const size of parsedSizes) {
          next[size] = { ...next[size], originalPrice: orig };
        }
        return next;
      });
    }
  }

  function handleUniformMaxQtyChange(qty: string) {
    setUniformMaxQty(qty);
    if (samePriceForAll) {
      setVariantPrices((prev) => {
        const next = { ...prev };
        for (const size of parsedSizes) {
          next[size] = { ...next[size], maxQty: qty };
        }
        return next;
      });
    }
  }

  function setVariantField(size: number, field: 'price' | 'originalPrice' | 'maxQty', value: string) {
    setVariantPrices((prev) => ({
      ...prev,
      [size]: { ...prev[size], [field]: value },
    }));
  }

  // ── Form helpers ─────────────────────────────────────────────────────────
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | 'hover' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [removeBgEnabled, setRemoveBgEnabled] = useState(true);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hoverFileRef = useRef<HTMLInputElement | null>(null);

  async function applyBgRemoval(file: File): Promise<File> {
    if (!removeBgEnabled) return file;
    setUploadStatus('Removing background…');
    try {
      const res = await fetch('/api/remove-bg', { method: 'POST', body: file });
      if (!res.ok) return file; // fall back silently
      const blob = await res.blob();
      return new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
    } catch {
      return file;
    }
  }

  async function handleImageFileChange(file: File, index: number) {
    setUploadingIdx(index);
    setUploadError('');
    setUploadStatus('');
    try {
      const bgRemoved = await applyBgRemoval(file);
      setUploadStatus('Uploading…');
      const compressed = await compressImage(bgRemoved);
      const url = await uploadImage(compressed, 'products');
      const updated = [...form.imageList];
      updated[index] = url;
      set('imageList', updated);
    } catch (e: any) {
      setUploadError(`Image ${index + 1}: ${e.message}`);
    } finally {
      setUploadingIdx(null);
      setUploadStatus('');
    }
  }

  async function handleHoverFileChange(file: File) {
    setUploadingIdx('hover');
    setUploadError('');
    setUploadStatus('');
    try {
      const bgRemoved = await applyBgRemoval(file);
      setUploadStatus('Uploading…');
      const compressed = await compressImage(bgRemoved);
      const url = await uploadImage(compressed, 'products');
      set('hoverImage', url);
    } catch (e: any) {
      setUploadError(`Hover image: ${e.message}`);
    } finally {
      setUploadingIdx(null);
      setUploadStatus('');
    }
  }

  function set(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const sizes = parsedSizes;

      // Build variants array
      const variants = sizes.map((size) => {
        const entry = variantPrices[size] ?? { price: uniformPrice, originalPrice: uniformOriginal, maxQty: uniformMaxQty };
        const price = Number(entry.price);
        const originalPrice = entry.originalPrice ? Number(entry.originalPrice) : null;
        const maxQty = Math.max(1, Number(entry.maxQty) || 1);
        return { size, price, originalPrice, maxQty };
      });

      // Base price = min of variant prices (or uniform)
      const basePrice = variants.length
        ? Math.min(...variants.map((v) => v.price))
        : Number(uniformPrice);

      const baseOriginal = variants.length
        ? (() => {
            const origs = variants.map((v) => v.originalPrice).filter((v): v is number => v !== null);
            return origs.length ? Math.min(...origs) : null;
          })()
        : (uniformOriginal ? Number(uniformOriginal) : null);

      const discount = baseOriginal && baseOriginal > basePrice
        ? Math.round(((baseOriginal - basePrice) / baseOriginal) * 100)
        : null;

      const payload: Partial<Product> & Record<string, any> = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        slug: form.slug.trim() || undefined,
        colorway: form.colorway.trim(),
        gender: form.gender as Product['gender'],
        price: basePrice,
        originalPrice: baseOriginal,
        discount,
        description: form.description.trim(),
        category: form.category.trim(),
        sku: form.sku.trim(),
        sizes,
        availableSizes: form.availableSizes.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
        colors: form.colors.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean),
        tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        images: form.imageList.map((u) => u.trim()).filter(Boolean),
        hoverImage: form.hoverImage.trim(),
        variants,
        featured: form.featured,
        trending: form.trending,
        newArrival: form.newArrival,
        soldOut: form.soldOut,
        comingSoon: form.comingSoon,
      };

      await onSave(payload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          {/* Name + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *" value={form.name} onChange={(v) => set('name', v)} required />
            <Field label="Brand *" value={form.brand} onChange={(v) => set('brand', v)} required />
          </div>

          {/* Slug + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" value={form.slug} onChange={(v) => set('slug', v)} placeholder="Auto-generated if empty" />
            <Field label="SKU *" value={form.sku} onChange={(v) => set('sku', v)} required />
          </div>

          {/* Colorway + Category */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Colorway" value={form.colorway} onChange={(v) => set('colorway', v)} />
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Category</label>
              <select aria-label="Category"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Gender</label>
              <select aria-label="Gender"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description *</label>
            <textarea aria-label="Description" placeholder="Enter product description..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
            />
          </div>

          {/* Sizes + Available Sizes */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sizes (comma-separated)" value={form.sizes} onChange={(v) => set('sizes', v)} placeholder="6, 7, 8, 9, 10" />
            <Field label="Available Sizes" value={form.availableSizes} onChange={(v) => set('availableSizes', v)} placeholder="6, 7, 8" />
          </div>

          {/* ── Pricing per size ─────────────────────────────────────────── */}
          <div className="border border-zinc-700 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Pricing per Size</span>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={samePriceForAll}
                  onChange={(e) => handleSamePriceToggle(e.target.checked)}
                  className="w-4 h-4 rounded accent-white"
                />
                Same price for all sizes
              </label>
            </div>

            {samePriceForAll ? (
              /* Uniform price inputs */
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    value={uniformPrice}
                    onChange={(e) => handleUniformPriceChange(e.target.value)}
                    required
                    placeholder="e.g. 12000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Original Price (₹)</label>
                  <input
                    type="number"
                    value={uniformOriginal}
                    onChange={(e) => handleUniformOriginalChange(e.target.value)}
                    placeholder="e.g. 14000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Max Qty *</label>
                  <input
                    type="number"
                    min={1}
                    value={uniformMaxQty}
                    onChange={(e) => handleUniformMaxQtyChange(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>
            ) : (
              /* Per-size pricing grid */
              <div className="space-y-2">
                {parsedSizes.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Enter sizes above to set per-size prices.</p>
                ) : (
                  <>
                    {/* Header row */}
                    <div className="grid grid-cols-[70px_1fr_1fr_80px] gap-3 text-xs font-medium text-zinc-500 pb-1 border-b border-zinc-800">
                      <span>UK Size</span>
                      <span>Price (₹) *</span>
                      <span>Original (₹)</span>
                      <span>Max Qty</span>
                    </div>
                    {parsedSizes.map((size) => (
                      <div key={size} className="grid grid-cols-[70px_1fr_1fr_80px] gap-3 items-center">
                        <span className="text-sm font-semibold text-zinc-300">UK {size}</span>
                        <input
                          type="number"
                          value={variantPrices[size]?.price ?? ''}
                          onChange={(e) => setVariantField(size, 'price', e.target.value)}
                          placeholder="Price"
                          required
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                        <input
                          type="number"
                          value={variantPrices[size]?.originalPrice ?? ''}
                          onChange={(e) => setVariantField(size, 'originalPrice', e.target.value)}
                          placeholder="Optional"
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                        <input
                          type="number"
                          min={1}
                          value={variantPrices[size]?.maxQty ?? '1'}
                          onChange={(e) => setVariantField(size, 'maxQty', e.target.value)}
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
          {/* ───────────────────────────────────────────────────────────────── */}

          {/* Colors + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Colors (comma-separated)" value={form.colors} onChange={(v) => set('colors', v)} placeholder="black, white" />
            <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => set('tags', v)} placeholder="jordan, retro" />
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-zinc-400">Image URLs *</label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={removeBgEnabled}
                  onChange={(e) => setRemoveBgEnabled(e.target.checked)}
                  className="accent-indigo-400 w-3.5 h-3.5"
                />
                <span className="text-xs text-zinc-400">Auto remove background</span>
              </label>
            </div>
            {uploadStatus && (
              <p className="text-xs text-indigo-400 mb-1.5 animate-pulse">{uploadStatus}</p>
            )}
            <div className="space-y-2">
              {form.imageList.map((url, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const updated = [...form.imageList];
                        updated[i] = e.target.value;
                        set('imageList', updated);
                      }}
                      placeholder={`Image URL ${i + 1} or upload →`}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono"
                    />
                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      aria-label={`Upload image ${i + 1}`}
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[i] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileChange(file, i);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      title="Upload image"
                      onClick={() => fileInputRefs.current[i]?.click()}
                      disabled={uploadingIdx !== null}
                      className="shrink-0 px-2.5 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:border-indigo-400 hover:text-indigo-300 transition disabled:opacity-40"
                    >
                      {uploadingIdx === i ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      )}
                    </button>
                    {form.imageList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => set('imageList', form.imageList.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 rounded-lg transition text-sm shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {url.trim() && (
                    <ImagePreview url={url.trim()} label={`Image ${i + 1}`} />
                  )}
                </div>
              ))}
            </div>
            {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
            <button
              type="button"
              onClick={() => set('imageList', [...form.imageList, ''])}
              className="mt-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
            >
              + Add Image
            </button>
          </div>

          {/* Hover Image */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Hover Image URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={form.hoverImage}
                onChange={(e) => set('hoverImage', e.target.value)}
                placeholder="URL for hover state image or upload →"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono"
              />
              <input
                type="file"
                accept="image/*"
                aria-label="Upload hover image"
                className="hidden"
                ref={hoverFileRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleHoverFileChange(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                title="Upload hover image"
                onClick={() => hoverFileRef.current?.click()}
                disabled={uploadingIdx !== null}
                className="shrink-0 px-2.5 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:border-indigo-400 hover:text-indigo-300 transition disabled:opacity-40"
              >
                {uploadingIdx === 'hover' ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                )}
              </button>
            </div>
            {form.hoverImage.trim() && (
              <div className="mt-1.5">
                <ImagePreview url={form.hoverImage.trim()} label="Hover Image" />
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Featured" checked={form.featured} onChange={(v) => set('featured', v)} />
            <Checkbox label="Trending" checked={form.trending} onChange={(v) => set('trending', v)} />
            <Checkbox label="New Arrival" checked={form.newArrival} onChange={(v) => set('newArrival', v)} />
            <Checkbox label="Sold Out" checked={form.soldOut} onChange={(v) => set('soldOut', v)} />
            <Checkbox label="Coming Soon" checked={form.comingSoon} onChange={(v) => set('comingSoon', v)} />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm px-5 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-6 py-2.5 rounded-lg bg-white text-zinc-900 font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reusable field components ───────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
      />
    </div>
  );
}

function ImagePreview({ url, label }: { url: string; label: string }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  // Reset when URL changes
  useEffect(() => { setStatus('loading'); }, [url]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-14 h-14 rounded-lg border border-zinc-700 overflow-hidden bg-zinc-800 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className={`w-full h-full object-cover transition-opacity duration-200 ${status === 'ok' ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setStatus('ok')}
          onError={() => setStatus('error')}
        />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-4 h-4 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
      <span className={`text-xs font-medium ${status === 'ok' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-zinc-500'}`}>
        {status === 'ok' ? '✓ Loaded' : status === 'error' ? '✗ Failed to load' : 'Checking…'}
      </span>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-white focus:ring-white/20 accent-white"
      />
      {label}
    </label>
  );
}
