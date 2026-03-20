'use client';

import { useState, FormEvent } from 'react';
import { Product } from '@/types';

interface Props {
  product: Product | null;
  onSave: (data: Partial<Product>) => Promise<void>;
  onClose: () => void;
}

const GENDERS = ['men', 'women', 'unisex', 'kids'] as const;
const CATEGORIES = ['lifestyle', 'basketball', 'running', 'skateboarding', 'casual', 'training'] as const;

export default function ProductFormModal({ product, onSave, onClose }: Props) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    slug: product?.slug || '',
    colorway: product?.colorway || '',
    gender: product?.gender || 'unisex',
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    discount: product?.discount || 0,
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
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload: Partial<Product> & Record<string, any> = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        slug: form.slug.trim() || undefined,
        colorway: form.colorway.trim(),
        gender: form.gender as Product['gender'],
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        discount: form.discount ? Number(form.discount) : null,
        description: form.description.trim(),
        category: form.category.trim(),
        sku: form.sku.trim(),
        sizes: form.sizes.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
        availableSizes: form.availableSizes.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
        colors: form.colors.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean),
        tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        images: form.imageList.map((u) => u.trim()).filter(Boolean),
        hoverImage: form.hoverImage.trim(),
        featured: form.featured,
        trending: form.trending,
        newArrival: form.newArrival,
        soldOut: form.soldOut,
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

          {/* Row: Name + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *" value={form.name} onChange={(v) => set('name', v)} required />
            <Field label="Brand *" value={form.brand} onChange={(v) => set('brand', v)} required />
          </div>

          {/* Row: Slug + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" value={form.slug} onChange={(v) => set('slug', v)} placeholder="Auto-generated if empty" />
            <Field label="SKU *" value={form.sku} onChange={(v) => set('sku', v)} required />
          </div>

          {/* Row: Colorway + Category */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Colorway" value={form.colorway} onChange={(v) => set('colorway', v)} />
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Category</label>
              <select
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

          {/* Row: Gender + Price + OriginalPrice + Discount */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>
            <Field label="Price *" type="number" value={form.price} onChange={(v) => set('price', v)} required />
            <Field label="Original Price" type="number" value={form.originalPrice} onChange={(v) => set('originalPrice', v)} />
            <Field label="Discount %" type="number" value={form.discount} onChange={(v) => set('discount', v)} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description *</label>
            <textarea
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

          {/* Colors + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Colors (comma-separated)" value={form.colors} onChange={(v) => set('colors', v)} placeholder="black, white" />
            <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => set('tags', v)} placeholder="jordan, retro" />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Image URLs *</label>
            <div className="space-y-2">
              {form.imageList.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      const updated = [...form.imageList];
                      updated[i] = e.target.value;
                      set('imageList', updated);
                    }}
                    placeholder={`Image URL ${i + 1}`}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition font-mono"
                  />
                  {form.imageList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.imageList.filter((_, idx) => idx !== i);
                        set('imageList', updated);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 rounded-lg transition text-sm shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set('imageList', [...form.imageList, ''])}
              className="mt-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
            >
              + Add Image
            </button>
          </div>

          {/* Hover Image */}
          <Field label="Hover Image URL" value={form.hoverImage} onChange={(v) => set('hoverImage', v)} placeholder="URL for hover state image" />

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Featured" checked={form.featured} onChange={(v) => set('featured', v)} />
            <Checkbox label="Trending" checked={form.trending} onChange={(v) => set('trending', v)} />
            <Checkbox label="New Arrival" checked={form.newArrival} onChange={(v) => set('newArrival', v)} />
            <Checkbox label="Sold Out" checked={form.soldOut} onChange={(v) => set('soldOut', v)} />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-5 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
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

// ─── Reusable field components ──────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
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
