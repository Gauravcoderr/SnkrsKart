'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { sellerApi } from '@/lib/sellerApi';
import type { ProductRequest, ProductRequestStatus, SellerListing } from '@/types/seller';
import { cn } from '@/lib/utils';
import AddListingModal from '@/components/seller/AddListingModal';
import RequestProductModal from '@/components/seller/RequestProductModal';
import {
  useHandleApiError,
  useToast,
  Toast,
  Panel,
  PageHeader,
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
  ProductThumb,
  formatDate,
  btnPrimary,
  btnSecondary,
} from '@/components/seller/SellerShell';

const REQUEST_STATUS: Record<ProductRequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
};

function RequestPill({ status }: { status: ProductRequestStatus }) {
  const meta = REQUEST_STATUS[status] ?? REQUEST_STATUS.pending;
  return <span className={cn('inline-flex items-center border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap', meta.className)}>{meta.label}</span>;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function SellerRequestsPage() {
  const handleError = useHandleApiError();
  const { toast, show } = useToast();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [listProductId, setListProductId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await sellerApi.requests());
    } catch (err) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreatedRequest(req: ProductRequest) {
    setRequests((prev) => [req, ...prev]);
  }

  function handleCreatedListings(listings: SellerListing[]) {
    show(`${listings.length} listing${listings.length === 1 ? '' : 's'} saved and live`);
  }

  const pending = requests.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Product requests"
        description="Ask SNKRS CART to add a product that is not in the catalog yet. Once approved you can list your sizes."
        actions={<button type="button" onClick={() => setRequestOpen(true)} className={btnPrimary}>+ New request</button>}
      />

      {loading && <LoadingBlock label="Loading requests" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        requests.length === 0 ? (
          <EmptyBlock
            title="No requests yet"
            body="Can't find a product in the catalog? Send a request with a link that confirms it, and SNKRS CART will add it for you."
            action={<button type="button" onClick={() => setRequestOpen(true)} className={btnPrimary}>+ New request</button>}
          />
        ) : (
          <>
            {pending > 0 && (
              <p className="text-xs text-zinc-500 mb-3">{pending} request{pending === 1 ? '' : 's'} waiting for review. You can have up to 10 pending at a time.</p>
            )}
            <div className="space-y-3">
              {requests.map((req) => (
                <Panel key={req._id} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {req.product?.images?.[0] && <ProductThumb src={req.product.images[0]} alt={req.product.name} className="w-16 h-16" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{req.brand}</p>
                        <RequestPill status={req.status} />
                      </div>
                      <p className="text-base font-black tracking-tight text-zinc-900 leading-tight mt-0.5">{req.name}</p>
                      {req.colorway && <p className="text-sm text-zinc-500">{req.colorway}</p>}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {req.sizes.map((s) => (
                          <span key={s} className="border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                            {Number.isFinite(Number(s)) ? `UK ${s}` : s}
                          </span>
                        ))}
                      </div>

                      {req.supportingUrls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                          {req.supportingUrls.map((u) => (
                            <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-900 break-all min-h-[32px] inline-flex items-center">
                              {hostOf(u)}
                            </a>
                          ))}
                        </div>
                      )}

                      {req.note && <p className="mt-3 text-sm text-zinc-600 whitespace-pre-line">{req.note}</p>}

                      {req.adminNote && (
                        <div className={cn('mt-3 border px-3 py-2.5 text-sm', req.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700')}>
                          <p className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-1">Note from SNKRS CART</p>
                          <p className="whitespace-pre-line">{req.adminNote}</p>
                        </div>
                      )}

                      <p className="mt-3 text-[11px] text-zinc-400">
                        Requested {formatDate(req.createdAt)}
                        {req.reviewedAt && <>, reviewed {formatDate(req.reviewedAt)}</>}
                      </p>
                    </div>

                    {req.status === 'approved' && req.product && (
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button type="button" onClick={() => setListProductId(req.product!._id)} className={`${btnPrimary} flex-1 sm:flex-none`}>
                          List it now
                        </button>
                        <Link href={`/products/${req.product.slug}`} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} flex-1 sm:flex-none`}>
                          View product
                        </Link>
                      </div>
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          </>
        )
      )}

      <RequestProductModal open={requestOpen} onClose={() => setRequestOpen(false)} onCreated={handleCreatedRequest} />
      <AddListingModal
        open={listProductId !== null}
        initialProductId={listProductId ?? undefined}
        onClose={() => setListProductId(null)}
        onCreated={handleCreatedListings}
        onRequestProduct={() => setRequestOpen(true)}
      />
      <Toast toast={toast} />
    </div>
  );
}
