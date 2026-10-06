'use client';

import { useEffect, useState, FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { sellerApi } from '@/lib/sellerApi';
import type { ProductRequest } from '@/types/seller';
import { cn } from '@/lib/utils';
import { inputClass, labelClass, btnPrimary, btnGhost, useHandleApiError } from '@/components/seller/SellerShell';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (request: ProductRequest) => void;
}

const BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Crocs', 'Other'];
const UK_SIZES = Array.from({ length: 21 }, (_, i) => String(3 + i * 0.5));
const MAX_LINKS = 5;

export default function RequestProductModal({ open, onClose, onCreated }: Props) {
  const handleError = useHandleApiError();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Nike');
  const [otherBrand, setOtherBrand] = useState('');
  const [colorway, setColorway] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [otherSizes, setOtherSizes] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setBrand('Nike');
    setOtherBrand('');
    setColorway('');
    setSizes([]);
    setOtherSizes('');
    setUrls(['']);
    setNote('');
    setError('');
    setDone(false);
    setSubmitting(false);
  }, [open]);

  function toggleSize(size: string) {
    setError('');
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  function updateUrl(index: number, value: string) {
    setError('');
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function removeUrl(index: number) {
    setUrls((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const finalBrand = brand === 'Other' ? otherBrand.trim() : brand;
    if (!name.trim() || !finalBrand) {
      setError('Product name and brand are required');
      return;
    }
    const extraSizes = otherSizes.split(',').map((s) => s.trim()).filter(Boolean);
    const allSizes = [...new Set([...UK_SIZES.filter((s) => sizes.includes(s)), ...extraSizes])];
    if (allSizes.length === 0) {
      setError('Select at least one size you can supply');
      return;
    }
    const links = urls.map((u) => u.trim()).filter(Boolean);
    if (links.length === 0) {
      setError('Add at least one supporting link (official page, StockX, GOAT, etc.)');
      return;
    }
    for (const link of links) {
      try {
        const parsed = new URL(link);
        if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad');
      } catch {
        setError(`"${link}" is not a valid link`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const created = await sellerApi.createRequest({
        name: name.trim(),
        brand: finalBrand,
        colorway: colorway.trim(),
        sizes: allSizes,
        supportingUrls: links,
        note: note.trim(),
      });
      onCreated?.(created);
      setDone(true);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !submitting) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 animate-backdrop-in" />
        <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit w-full md:max-w-xl max-h-[92vh] md:max-h-[88vh] bg-white shadow-2xl flex flex-col focus:outline-none animate-modal-up md:animate-modal-in">
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-100">
            <div>
              <Dialog.Title asChild>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">Request new product</p>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="text-sm font-bold text-zinc-900 mt-0.5 leading-tight">
                  SNKRS CART verifies and adds the product, then you can list your sizes.
                </p>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" disabled={submitting} className="p-2 -m-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {done ? (
            <div className="px-6 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-black tracking-tight text-zinc-900 mb-2">Request sent</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                SNKRS CART will review it and add the product to the catalog. You will see the result under Requests, then you can list your sizes.
              </p>
              <Dialog.Close asChild>
                <button type="button" className={`${btnPrimary} w-full`}>
                  Done
                </button>
              </Dialog.Close>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">
                <div>
                  <label htmlFor="req-name" className={labelClass}>Product name *</label>
                  <input id="req-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={150} placeholder="e.g. Air Jordan 1 Retro High OG" className={inputClass} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="req-brand" className={labelClass}>Brand *</label>
                    <select id="req-brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}>
                      {BRANDS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {brand === 'Other' ? (
                    <div>
                      <label htmlFor="req-other-brand" className={labelClass}>Brand name *</label>
                      <input id="req-other-brand" value={otherBrand} onChange={(e) => setOtherBrand(e.target.value)} maxLength={60} placeholder="Type the brand" className={inputClass} />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="req-colorway" className={labelClass}>Colorway</label>
                      <input id="req-colorway" value={colorway} onChange={(e) => setColorway(e.target.value)} maxLength={120} placeholder="e.g. Chicago Lost and Found" className={inputClass} />
                    </div>
                  )}
                </div>
                {brand === 'Other' && (
                  <div>
                    <label htmlFor="req-colorway-2" className={labelClass}>Colorway</label>
                    <input id="req-colorway-2" value={colorway} onChange={(e) => setColorway(e.target.value)} maxLength={120} placeholder="e.g. Chicago Lost and Found" className={inputClass} />
                  </div>
                )}

                <div>
                  <p className={labelClass}>Sizes you can supply *</p>
                  <div className="flex flex-wrap gap-2">
                    {UK_SIZES.map((size) => {
                      const selected = sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          aria-pressed={selected}
                          className={cn(
                            'min-w-[52px] min-h-[40px] px-2 border text-xs font-bold transition-colors',
                            selected ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-900',
                          )}
                        >
                          UK {size}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    value={otherSizes}
                    onChange={(e) => { setError(''); setOtherSizes(e.target.value); }}
                    placeholder="Other sizes, comma separated (e.g. UK 14, M, 42 EU)"
                    className={`${inputClass} mt-3`}
                  />
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <p className={labelClass}>Supporting links *</p>
                    <p className="text-[11px] text-zinc-400">{urls.length}/{MAX_LINKS}</p>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">Official page, StockX, GOAT or any page that confirms the product.</p>
                  <div className="space-y-2">
                    {urls.map((u, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="url"
                          inputMode="url"
                          value={u}
                          onChange={(e) => updateUrl(i, e.target.value)}
                          placeholder="https://"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeUrl(i)}
                          aria-label="Remove link"
                          disabled={urls.length === 1 && !u}
                          className="shrink-0 w-11 min-h-[44px] border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-300 disabled:opacity-30 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  {urls.length < MAX_LINKS && (
                    <button type="button" onClick={() => setUrls((prev) => [...prev, ''])} className={`${btnGhost} mt-2 -ml-3`}>
                      + Add another link
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor="req-note" className={labelClass}>Note</label>
                  <textarea
                    id="req-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Anything SNKRS CART should know: condition, box, release year, your price range"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-zinc-100 bg-white">
                {error && <p className="text-xs text-red-600 font-medium mb-3">{error}</p>}
                <div className="flex items-center gap-3">
                  <Dialog.Close asChild>
                    <button type="button" disabled={submitting} className={btnGhost}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button type="submit" disabled={submitting} className={`${btnPrimary} flex-1`}>
                    {submitting ? 'Sending...' : 'Send request'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
