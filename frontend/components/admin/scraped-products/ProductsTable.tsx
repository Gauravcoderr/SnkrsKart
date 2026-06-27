'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { ScrapedProduct, Status, SITE_COLORS, FLAG_STYLES, ProductFlag } from './types';

const BulkDeleteModal = dynamic(() => import('./BulkDeleteModal'), { ssr: false });

interface ProductsTableProps {
  items: ScrapedProduct[];
  loading: boolean;
  status: Status;
  onEdit: (item: ScrapedProduct) => void;
  onPublish: (item: ScrapedProduct) => void;
  onReject: (id: string) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
}

export default function ProductsTable({ items, loading, status, onEdit, onPublish, onReject, onBulkDelete }: ProductsTableProps) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const allSelected = items.length > 0 && items.every((i) => selected.has(i._id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i._id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      await onBulkDelete(Array.from(selected));
      setSelected(new Set());
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-600 text-sm">
        No {status} products found.{status === 'draft' && ' Run the scraper to populate drafts.'}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded accent-white cursor-pointer"
                  aria-label="Select all"
                />
              </th>
              <th className="pb-2 pr-3 font-medium w-14">Img</th>
              <th className="pb-2 pr-3 font-medium">Name</th>
              <th className="pb-2 pr-3 font-medium">Brand</th>
              <th className="pb-2 pr-3 font-medium">Site</th>
              <th className="pb-2 pr-3 font-medium">Price</th>
              <th className="pb-2 pr-3 font-medium">Sizes</th>
              <th className="pb-2 pr-3 font-medium">Scraped</th>
              <th className="pb-2 pr-3 font-medium">Listed On Site</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {items.map((item) => (
              <tr key={item._id} className={`group transition-colors ${selected.has(item._id) ? 'bg-zinc-800/60' : 'hover:bg-zinc-900/40'}`}>
                <td className="py-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(item._id)}
                    onChange={() => toggleOne(item._id)}
                    className="w-3.5 h-3.5 rounded accent-white cursor-pointer"
                    aria-label={`Select ${item.name}`}
                  />
                </td>
                <td className="py-3 pr-3">
                  {item.images[0] ? (
                    <button type="button" onClick={() => setLightbox({ images: item.images, index: 0 })} className="focus:outline-none">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg bg-zinc-800 cursor-zoom-in hover:opacity-80 transition-opacity"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">—</div>
                  )}
                </td>
                <td className="py-3 pr-3 max-w-[200px]">
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-white font-medium hover:underline line-clamp-2 text-xs leading-5">
                    {item.name}
                  </a>
                  {item.colorway && <p className="text-zinc-500 text-[10px] mt-0.5">{item.colorway}</p>}
                  {item.flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.flags.map((f) => (
                        <span key={f} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${FLAG_STYLES[f as ProductFlag] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-3 text-zinc-300 text-xs">{item.brand}</td>
                <td className="py-3 pr-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SITE_COLORS[item.sourceSite]}`}>
                    {item.sourceSite}
                  </span>
                </td>
                <td className="py-3 pr-3 text-zinc-300 text-xs whitespace-nowrap">
                  {item.price ? `₹${item.price.toLocaleString('en-IN')}` : '—'}
                  {item.originalPrice && item.originalPrice > (item.price ?? 0) && (
                    <span className="text-zinc-600 line-through ml-1">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-zinc-500 text-xs">
                  {item.sizes.length > 0 ? `${item.sizes.length} sizes` : '—'}
                </td>
                <td className="py-3 pr-3 text-zinc-500 text-xs whitespace-nowrap">
                  {new Date(item.scrapedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                </td>
                <td className="py-3 pr-3 text-zinc-500 text-xs whitespace-nowrap">
                  {item.sourceListedAt
                    ? new Date(item.sourceListedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                    : '—'}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onEdit(item)}
                      className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                      Edit
                    </button>
                    {item.status === 'draft' && (
                      <>
                        <button type="button" onClick={() => onPublish(item)}
                          className="text-xs px-2 py-1 rounded bg-white text-zinc-900 hover:bg-zinc-100 font-semibold transition-colors">
                          Publish
                        </button>
                        <button type="button" onClick={() => onReject(item._id)}
                          className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors">
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating bulk action bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 shadow-2xl">
          <span className="text-sm text-zinc-300 font-medium">{selected.size} selected</span>
          <button type="button" onClick={() => setSelected(new Set())}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Clear
          </button>
          <button type="button" onClick={() => setShowConfirm(true)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors">
            Delete {selected.size}
          </button>
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onIndexChange={(i) => setLightbox({ ...lightbox, index: i })}
          onClose={() => setLightbox(null)}
        />
      )}

      {showConfirm && (
        <BulkDeleteModal
          count={selected.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowConfirm(false)}
          deleting={deleting}
        />
      )}
    </>
  );
}
