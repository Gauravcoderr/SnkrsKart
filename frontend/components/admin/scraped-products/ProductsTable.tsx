'use client';

import { useState } from 'react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { ScrapedProduct, Status, SITE_COLORS } from './types';

interface ProductsTableProps {
  items: ScrapedProduct[];
  loading: boolean;
  status: Status;
  onEdit: (item: ScrapedProduct) => void;
  onPublish: (item: ScrapedProduct) => void;
  onReject: (id: string) => void;
}

export default function ProductsTable({ items, loading, status, onEdit, onPublish, onReject }: ProductsTableProps) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

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
              <th className="pb-2 pr-3 font-medium w-14">Img</th>
              <th className="pb-2 pr-3 font-medium">Name</th>
              <th className="pb-2 pr-3 font-medium">Brand</th>
              <th className="pb-2 pr-3 font-medium">Site</th>
              <th className="pb-2 pr-3 font-medium">Price</th>
              <th className="pb-2 pr-3 font-medium">Sizes</th>
              <th className="pb-2 pr-3 font-medium">Scraped</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {items.map((item) => (
              <tr key={item._id} className="group hover:bg-zinc-900/40 transition-colors">
                <td className="py-3 pr-3">
                  {item.images[0] ? (
                    <button
                      type="button"
                      onClick={() => setLightbox({ images: item.images, index: 0 })}
                      className="focus:outline-none"
                    >
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
                <td className="py-3 pr-3 max-w-[220px]">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium hover:underline line-clamp-2 text-xs leading-5"
                  >
                    {item.name}
                  </a>
                  {item.colorway && (
                    <p className="text-zinc-500 text-[10px] mt-0.5">{item.colorway}</p>
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
                  {new Date(item.scrapedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      Edit
                    </button>
                    {item.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onPublish(item)}
                          className="text-xs px-2 py-1 rounded bg-white text-zinc-900 hover:bg-zinc-100 font-semibold transition-colors"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(item._id)}
                          className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors"
                        >
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

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onIndexChange={(i) => setLightbox({ ...lightbox, index: i })}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
