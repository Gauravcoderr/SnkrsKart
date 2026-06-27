'use client';

import { useState } from 'react';
import { ScrapedProduct, Gender, API } from './types';

interface EditModalProps {
  item: ScrapedProduct;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  getToken: () => string;
}

export default function EditModal({ item, onClose, onSuccess, getToken }: EditModalProps) {
  const [editItem, setEditItem] = useState<ScrapedProduct>(item);

  async function handleSave() {
    const token = getToken();
    const res = await fetch(`${API}/admin/scraped-products/${editItem._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editItem.name,
        brand: editItem.brand,
        price: editItem.price,
        originalPrice: editItem.originalPrice,
        colorway: editItem.colorway,
        sku: editItem.sku,
        description: editItem.description,
        gender: editItem.gender,
        sizes: editItem.sizes,
        tags: editItem.tags,
      }),
    });
    if (res.ok) {
      onSuccess('Saved');
      onClose();
    } else {
      onSuccess('Save failed');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold text-white">Edit Draft</h2>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Name', key: 'name' as const, type: 'text' },
            { label: 'Colorway', key: 'colorway' as const, type: 'text' },
            { label: 'Price (₹)', key: 'price' as const, type: 'number' },
            { label: 'Original Price (₹)', key: 'originalPrice' as const, type: 'number' },
            { label: 'SKU', key: 'sku' as const, type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key} className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">{label}</label>
              <input
                type={type}
                aria-label={label}
                value={(editItem[key] as string | number) ?? ''}
                onChange={(e) => setEditItem({ ...editItem, [key]: type === 'number' ? parseFloat(e.target.value) || undefined : e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Brand</label>
            <select
              aria-label="Brand"
              value={editItem.brand}
              onChange={(e) => setEditItem({ ...editItem, brand: e.target.value as 'Nike' | 'Jordan' })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="Nike">Nike</option>
              <option value="Jordan">Jordan</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Gender</label>
            <select
              aria-label="Gender"
              value={editItem.gender}
              onChange={(e) => setEditItem({ ...editItem, gender: e.target.value as Gender })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              {(['men', 'women', 'unisex', 'kids'] as Gender[]).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Sizes (comma separated)</label>
            <input
              type="text"
              aria-label="Sizes"
              value={editItem.sizes.join(', ')}
              onChange={(e) => setEditItem({ ...editItem, sizes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Description</label>
            <textarea
              aria-label="Description"
              rows={3}
              value={editItem.description ?? ''}
              onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-xs font-semibold text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
