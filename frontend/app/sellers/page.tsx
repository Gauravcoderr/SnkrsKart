'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { sellerApi } from '@/lib/sellerApi';
import type { SellerDashboard, SellerOrder } from '@/types/seller';
import { formatPrice } from '@/lib/utils';
import {
  useSeller,
  useHandleApiError,
  Panel,
  PageHeader,
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
  StatusPill,
  VerificationPill,
  ProductThumb,
  actionLabel,
  formatDate,
  sizeLabel,
  btnSecondary,
} from '@/components/seller/SellerShell';

function orderSummary(order: SellerOrder): string {
  const first = order.items[0];
  if (!first) return 'No items';
  const base = `${first.brand} ${first.name} ${sizeLabel(first.size)} x${first.qty}`.trim();
  const extra = order.items.length - 1;
  return extra > 0 ? `${base} +${extra} more` : base;
}

function StatTile({ label, value, hint, href, highlight }: { label: string; value: number; hint?: string; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`block border p-4 transition-colors ${highlight && value > 0 ? 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:border-zinc-400'}`}>
      <p className={`text-[10px] font-bold tracking-widest uppercase ${highlight && value > 0 ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</p>
      <p className="text-3xl font-black tracking-tight mt-2 leading-none">{value}</p>
      {hint && <p className={`text-[11px] mt-2 ${highlight && value > 0 ? 'text-zinc-400' : 'text-zinc-400'}`}>{hint}</p>}
    </Link>
  );
}

export default function SellerDashboardPage() {
  const { seller } = useSeller();
  const handleError = useHandleApiError();
  const [data, setData] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await sellerApi.dashboard());
    } catch (err) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = seller.name.trim().split(/\s+/)[0] || 'there';

  return (
    <div>
      <PageHeader eyebrow="Dashboard" title={`Hi ${firstName}`} description="Here is where your listings and orders stand today." />
      {(!seller.addressLine || !seller.pincode) && (
        <Link href="/sellers/settings" className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 mb-6 hover:border-amber-400 transition-colors">
          <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-amber-800">Add your shipping address</span>
            <span className="block text-[11px] text-amber-700 mt-0.5">SNKRS CART needs the address you ship from before your pairs can be picked up or returned.</span>
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-800 shrink-0">Settings</span>
        </Link>
      )}

      {loading && <LoadingBlock label="Loading your dashboard" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Active listings" value={data.listings.active} hint={`${data.listings.units} unit${data.listings.units === 1 ? '' : 's'} available`} href="/sellers/listings" />
            <StatTile label="Orders needing action" value={data.orders.needsVerification + data.orders.needsTracking} hint={data.orders.overdue > 0 ? `${data.orders.overdue} past the ship-by deadline` : 'Photos or tracking due'} href="/sellers/orders?tab=action" highlight />
            <StatTile label="Awaiting review" value={data.orders.awaitingReview} hint="SNKRS CART is checking photos" href="/sellers/orders?tab=review" />
            <StatTile label="Shipped" value={data.orders.shipped} hint="On the way to customers" href="/sellers/orders?tab=shipped" />
          </div>

          <Panel className="p-5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-4">Earnings</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">In progress</p>
                <p className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 mt-1">{formatPrice(data.earnings.inProgress)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Payout due</p>
                <p className="text-xl sm:text-2xl font-black tracking-tight text-amber-700 mt-1">{formatPrice(data.earnings.due)}</p>
                {data.earnings.nextPayoutAt && data.earnings.due > 0 && (
                  <p className="text-[10px] text-zinc-400 mt-1">Next around {formatDate(data.earnings.nextPayoutAt)}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Paid out</p>
                <p className="text-xl sm:text-2xl font-black tracking-tight text-emerald-700 mt-1">{formatPrice(data.earnings.paid)}</p>
                <p className="text-[10px] text-zinc-400 mt-1">{formatPrice(data.earnings.thisMonth)} this month</p>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-4 border-t border-zinc-100 pt-3">
              Paid at your listed price, SNKRS CART adds 10% on top for the customer. Payouts are released about {data.earnings.payoutDelayDays} days after delivery to your UPI ID{seller.upiId ? ` (${seller.upiId})` : ', add it in Settings'}. You get an email with the payment screenshot each time.
            </p>
          </Panel>

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Panel>
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Action needed</p>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{data.actionItems.length} order{data.actionItems.length === 1 ? '' : 's'}</span>
                </div>
                {data.actionItems.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm font-bold text-zinc-900">You are all caught up</p>
                    <p className="text-sm text-zinc-500 mt-1">New orders that need photos or tracking will show here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {data.actionItems.map((order) => {
                      const first = order.items[0];
                      const todo = actionLabel(order);
                      return (
                        <li key={order._id}>
                          <Link href={`/sellers/orders/${order._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
                            <ProductThumb src={first?.image ?? ''} alt={first?.name ?? 'Item'} className="w-14 h-14" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{order.orderNumber}</p>
                              <p className="text-sm font-bold text-zinc-900 truncate">{orderSummary(order)}</p>
                              <p className="text-xs font-bold text-amber-700 mt-1">{todo}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-zinc-900">{formatPrice(order.sellerTotal)}</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{formatDate(order.createdAt)}</p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>

              <Panel>
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Recent orders</p>
                  <Link href="/sellers/orders" className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 underline underline-offset-4">
                    View all
                  </Link>
                </div>
                {data.recentOrders.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm font-bold text-zinc-900">No orders yet</p>
                    <p className="text-sm text-zinc-500 mt-1">Add listings and your first order will appear here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {data.recentOrders.map((order) => (
                      <li key={order._id}>
                        <Link href={`/sellers/orders/${order._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold text-zinc-900">{order.orderNumber}</p>
                              <StatusPill status={order.status} />
                              {order.status === 'confirmed' && <VerificationPill status={order.verification.status} />}
                            </div>
                            <p className="text-sm text-zinc-600 truncate mt-1">{orderSummary(order)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-zinc-900">{formatPrice(order.sellerTotal)}</p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{formatDate(order.createdAt)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Panel className="p-5">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Product requests</p>
                <p className="text-3xl font-black tracking-tight text-zinc-900 leading-none">{data.requestsPending}</p>
                <p className="text-sm text-zinc-500 mt-2">
                  {data.requestsPending === 0 ? 'No requests waiting on SNKRS CART.' : `Request${data.requestsPending === 1 ? '' : 's'} waiting for SNKRS CART to review.`}
                </p>
                <Link href="/sellers/requests" className={`${btnSecondary} w-full mt-4`}>
                  View requests
                </Link>
              </Panel>

              <Panel className="p-5">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Listings</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-zinc-500">Active</dt><dd className="font-bold text-zinc-900">{data.listings.active}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-500">Paused</dt><dd className="font-bold text-zinc-900">{data.listings.paused}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-500">Sold out</dt><dd className="font-bold text-zinc-900">{data.listings.sold_out}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-500">Delivered orders</dt><dd className="font-bold text-zinc-900">{data.orders.delivered}</dd></div>
                </dl>
                <Link href="/sellers/listings" className={`${btnSecondary} w-full mt-4`}>
                  Manage listings
                </Link>
              </Panel>
            </div>
          </div>

          {data.orders.total === 0 && data.listings.active === 0 && (
            <EmptyBlock
              title="Start by adding your first listing"
              body="Pick a product from the SNKRS CART catalog, choose your sizes and price, and it goes live for customers."
              action={<Link href="/sellers/listings" className={btnSecondary}>Go to listings</Link>}
            />
          )}
        </div>
      )}
    </div>
  );
}
