'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { sellerApi } from '@/lib/sellerApi';
import type { SellerOrder } from '@/types/seller';
import { formatPrice, cn } from '@/lib/utils';
import {
  useHandleApiError,
  Panel,
  PageHeader,
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
  StatusPill,
  VerificationPill,
  PayoutPill,
  shipByInfo,
  AvailabilityBadge,
  ProductThumb,
  needsAction,
  actionLabel,
  formatDate,
  sizeLabel,
  btnSecondary,
} from '@/components/seller/SellerShell';

type Tab = 'all' | 'action' | 'review' | 'shipped' | 'delivered' | 'cancelled';

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'action', label: 'Action needed' },
  { value: 'review', label: 'Awaiting review' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function matchesTab(order: SellerOrder, tab: Tab): boolean {
  switch (tab) {
    case 'all': return true;
    case 'action': return needsAction(order) !== null;
    case 'review': return order.status === 'confirmed' && order.verification.status === 'pending';
    case 'shipped': return order.status === 'shipped';
    case 'delivered': return order.status === 'delivered';
    case 'cancelled': return order.status === 'cancelled';
  }
}

function isTab(v: string | null): v is Tab {
  return TABS.some((t) => t.value === v);
}

function OrdersInner() {
  const router = useRouter();
  const params = useSearchParams();
  const handleError = useHandleApiError();
  const tabParam = params.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'all';
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await sellerApi.orders());
    } catch (err) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.value] = orders.filter((o) => matchesTab(o, t.value)).length;
    return c;
  }, [orders]);

  const visible = useMemo(() => orders.filter((o) => matchesTab(o, tab)), [orders, tab]);

  function setTab(next: Tab) {
    router.replace(next === 'all' ? '/sellers/orders' : `/sellers/orders?tab=${next}`, { scroll: false });
  }

  return (
    <div>
      <PageHeader eyebrow="Fulfilment" title="Orders" description="Confirm each pair with live photos, then add tracking once SNKRS CART approves them." />

      {loading && <LoadingBlock label="Loading orders" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1 mb-4">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={cn(
                  'shrink-0 min-h-[40px] px-3.5 border text-[11px] font-bold tracking-widest uppercase transition-colors',
                  tab === t.value ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-900',
                  t.value === 'action' && tab !== 'action' && counts.action > 0 && 'border-amber-300 text-amber-800 bg-amber-50',
                )}
              >
                {t.label} <span className="text-zinc-400">{counts[t.value]}</span>
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <EmptyBlock
              title="No orders yet"
              body="When a customer buys one of your listings it shows up here with the steps to ship it."
              action={<Link href="/sellers/listings" className={btnSecondary}>Manage listings</Link>}
            />
          ) : visible.length === 0 ? (
            <EmptyBlock title={`Nothing under "${TABS.find((t) => t.value === tab)?.label}"`} body="Switch tabs to see your other orders." />
          ) : (
            <div className="space-y-3">
              {visible.map((order) => {
                const todo = actionLabel(order);
                return (
                  <Panel key={order._id} className={cn(todo && 'border-amber-300')}>
                    <Link href={`/sellers/orders/${order._id}`} className="block hover:bg-zinc-50 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-zinc-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-zinc-900">{order.orderNumber}</p>
                          <StatusPill status={order.status} />
                          {order.status === 'confirmed' && <VerificationPill status={order.verification.status} />}
                          {order.status === 'delivered' && <PayoutPill status={order.payout?.status ?? 'due'} />}
                        </div>
                        <p className="text-[11px] text-zinc-400">{formatDate(order.createdAt)}</p>
                      </div>

                      <ul className="divide-y divide-zinc-50">
                        {order.items.map((item, i) => (
                          <li key={`${item.listingId}-${i}`} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                            <ProductThumb src={item.image} alt={item.name} className="w-14 h-14" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{item.brand}</p>
                              <p className="text-sm font-bold text-zinc-900 leading-tight truncate">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs font-black text-zinc-900">{sizeLabel(item.size)}</span>
                                <span className="text-xs text-zinc-500">x{item.qty}</span>
                                <AvailabilityBadge availability={item.availability} />
                              </div>
                            </div>
                            <p className="text-sm font-bold text-zinc-700 shrink-0">{formatPrice(item.sellerPrice * item.qty)}</p>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-zinc-100 bg-zinc-50/60">
                        <div className="text-xs text-zinc-500 space-y-0.5">
                          {(order.deliveryCity || order.deliveryState) && (
                            <p>Ships to {[order.deliveryCity, order.deliveryState].filter(Boolean).join(', ')}</p>
                          )}
                          {order.trackingNumber && (
                            <p>
                              {order.deliveryService || 'Courier'} <span className="font-mono font-bold text-zinc-700">{order.trackingNumber}</span>
                            </p>
                          )}
                          {todo && <p className="font-bold text-amber-700">{todo}</p>}
                          {(() => { const info = shipByInfo(order); return info && order.status === 'confirmed' ? <p className={info.overdue ? 'font-bold text-red-600' : info.dueSoon ? 'font-semibold text-amber-700' : ''}>{info.text} · ship by {formatDate(order.shipBy, true)}</p> : null; })()}
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400">Your payout</p>
                          <p className="text-base font-black text-zinc-900">{formatPrice(order.sellerTotal)}</p>
                        </div>
                      </div>
                    </Link>
                  </Panel>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading orders" />}>
      <OrdersInner />
    </Suspense>
  );
}
