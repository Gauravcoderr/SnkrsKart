'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { sellerApi } from '@/lib/sellerApi';
import type { SellerDashboard, SellerOrder } from '@/types/seller';
import { formatPrice } from '@/lib/utils';
import { SegmentBar, ScaleBar, MetricCard, CountCell } from '@/components/seller/DashboardWidgets';
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

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function days(n: number | null) {
  if (n === null) return '';
  return `${n} day${n === 1 ? '' : 's'}`;
}

function pctText(n: number | null) {
  return n === null ? '' : `${n}%`;
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
  const monthName = new Date().toLocaleString('en-IN', { month: 'long' });

  return (
    <div>
      <PageHeader eyebrow="Dashboard" title={`Hi ${firstName}`} description="Here is where your listings, orders and reputation stand today." />
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

      {!loading && !error && data && (() => {
        const { profile, health, inventory, sales, orders, earnings } = data;
        const rank = profile.rank;
        const remaining = Math.max(0, profile.ratingMinOrders - profile.shippedOrders);
        const lowest = health.lowestOffers;
        const lowestPct = lowest.lowest === null || lowest.total === 0 ? null : Math.round((lowest.lowest / lowest.total) * 100);
        const actionCount = orders.needsVerification + orders.needsTracking;

        return (
          <div className="space-y-6">
            <section className="bg-zinc-900 text-white p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">Welcome back</p>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight mt-1 truncate">{profile.displayName || seller.name}</p>
                  <SegmentBar progress={profile.score === null ? null : profile.score / 5} dim="bg-white/10" marker="bg-white" size="lg" className="mt-5" />
                  <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Fulfilment score</p>
                      {profile.score !== null ? (
                        <p className="mt-1 flex items-baseline gap-3">
                          <span className="text-4xl font-black tracking-tight text-lime-400 leading-none">{profile.score.toFixed(1)}</span>
                          <span className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-300">{profile.scoreLabel}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-300 mt-1">
                          Ship {plural(remaining, 'more order')} to unlock your score
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">On-time shipping</p>
                      <p className="text-xl font-black mt-1 leading-none">{health.onTimeRate === null ? <span className="text-zinc-500">No shipments yet</span> : `${health.onTimeRate}%`}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Lowest offers</p>
                      <p className="text-xl font-black mt-1 leading-none">
                        {lowestPct === null ? <span className="text-zinc-500">No live listings</span> : `${lowestPct}%`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="lg:text-right shrink-0">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Rank in {monthName}</p>
                  {rank.position ? (
                    <>
                      <p className="text-4xl font-black tracking-tight mt-1 leading-none">#{rank.position}</p>
                      <p className="text-xs text-zinc-400 mt-2">of {plural(rank.ranked, 'seller')} with sales this month</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-black tracking-tight mt-1 leading-none text-zinc-300">Unranked</p>
                      <p className="text-xs text-zinc-400 mt-2">Your first sale this month puts you on the board.</p>
                    </>
                  )}
                  <p className="text-xs text-zinc-400 mt-1">{formatPrice(rank.monthSales)} across {plural(rank.monthOrders, 'order')}</p>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-5 border-t border-white/10 pt-3">
                Score weights: 50% shipped before the ship-by date, 30% low cancellations, 20% photos approved on the first try. Rank compares your confirmed sales with every active seller this month.
              </p>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Needs your action" value={actionCount} hint={orders.overdue > 0 ? `${plural(orders.overdue, 'order')} past the ship-by date` : 'Photos or tracking due'} href="/sellers/orders?tab=action" tone={actionCount > 0 ? 'dark' : 'default'} />
              <MetricCard label="Awaiting review" value={orders.awaitingReview} hint="SNKRS CART is checking photos" href="/sellers/orders?tab=review" />
              <MetricCard label="In transit" value={orders.shipped} hint="On the way to customers" href="/sellers/orders?tab=shipped" />
              <MetricCard label="Payout due" value={orders.payoutDue} hint={earnings.due > 0 ? `${formatPrice(earnings.due)}${earnings.nextPayoutAt ? `, next around ${formatDate(earnings.nextPayoutAt)}` : ''}` : 'Delivered orders waiting on payout'} href="/sellers/orders?tab=delivered" tone={orders.payoutDue > 0 ? 'amber' : 'default'} />
            </div>

            <Panel>
              <div className="px-5 py-4 border-b border-zinc-100">
                <p className="text-base font-black tracking-tight text-zinc-900">Profile health</p>
                <p className="text-xs text-zinc-500 mt-0.5">Shipping speed and reliability against SNKRS CART targets. Bars fill toward green as you improve.</p>
              </div>
              <div className="px-5 py-5 grid md:grid-cols-2 gap-x-10 gap-y-7">
                <ScaleBar
                  label="Avg ship time, instant"
                  hint={`Target: ships within ${days(health.tat.instant.targetDays)}`}
                  value={health.tat.instant.avgDays}
                  display={days(health.tat.instant.avgDays)}
                  meta={plural(health.tat.instant.samples, 'order')}
                  min={0}
                  max={4}
                  reverse
                  ticks={['4d', '3d', '2d', '1d', '0']}
                  emptyText="No instant orders shipped"
                />
                <ScaleBar
                  label="Avg ship time, in hand"
                  hint={`Target: ships within ${days(health.tat.inhand.targetDays)}`}
                  value={health.tat.inhand.avgDays}
                  display={days(health.tat.inhand.avgDays)}
                  meta={plural(health.tat.inhand.samples, 'order')}
                  min={0}
                  max={8}
                  reverse
                  ticks={['8d', '6d', '4d', '2d', '0']}
                  emptyText="No in-hand orders shipped"
                />
                <ScaleBar
                  label="Avg ship time, ETA"
                  hint={`Target: ships within ${days(health.tat.eta.targetDays)}`}
                  value={health.tat.eta.avgDays}
                  display={days(health.tat.eta.avgDays)}
                  meta={plural(health.tat.eta.samples, 'order')}
                  min={0}
                  max={28}
                  reverse
                  ticks={['28d', '21d', '14d', '7d', '0']}
                  emptyText="No ETA orders shipped"
                />
                <ScaleBar
                  label="On-time shipping"
                  hint="Orders shipped before their ship-by date"
                  value={health.onTimeRate}
                  display={pctText(health.onTimeRate)}
                  min={0}
                  max={100}
                  ticks={['0', '25%', '50%', '75%', '100%']}
                  emptyText="No shipments yet"
                />
                <ScaleBar
                  label="Cancellation rate"
                  hint="Keep it under 5%. Cancelled orders hurt your score."
                  value={health.cancellationRate}
                  display={pctText(health.cancellationRate)}
                  min={0}
                  max={25}
                  reverse
                  ticks={['25%', '20%', '15%', '10%', '0']}
                  emptyText="No orders yet"
                />
                <ScaleBar
                  label="Photos approved first time"
                  hint="Clear, well-lit photos get approved without a retake"
                  value={health.photoApprovalRate}
                  display={pctText(health.photoApprovalRate)}
                  min={0}
                  max={100}
                  ticks={['0', '25%', '50%', '75%', '100%']}
                  emptyText="No photos reviewed yet"
                />
                <ScaleBar
                  label="Lowest offers"
                  hint="Share of your live listings that are the top offer for their size"
                  value={lowestPct}
                  display={lowest.lowest === null ? '' : `${lowest.lowest} of ${lowest.total}`}
                  meta={lowestPct === null ? undefined : `${lowestPct}%`}
                  min={0}
                  max={100}
                  ticks={['0', '25%', '50%', '75%', '100%']}
                  emptyText="No live listings"
                />
              </div>
            </Panel>

            <div className="grid sm:grid-cols-3 gap-3">
              <MetricCard label="Listing value" value={formatPrice(inventory.listingValue)} hint="Your payout if every live unit sells" href="/sellers/listings" />
              <MetricCard label="Active listings" value={inventory.activeListings} hint={`${inventory.pausedListings} paused, ${inventory.soldOutListings} sold out`} href="/sellers/listings" />
              <MetricCard label="Units listed" value={inventory.units} hint={lowest.lowest === null ? 'Across all live sizes' : `${lowest.lowest} of ${lowest.total} listings are the lowest offer`} href="/sellers/listings" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Total sales" value={formatPrice(sales.allTime)} hint={`${plural(sales.orders, 'order')}${sales.orders ? `, avg ${formatPrice(sales.avgOrder)}` : ''}`} />
              <MetricCard label="Last 7 days" value={formatPrice(sales.last7Days)} hint={`${formatPrice(sales.last30Days)} in the last 30 days`} />
              <MetricCard label="Paid out" value={formatPrice(earnings.paid)} hint={`${formatPrice(earnings.thisMonth)} this month`} tone="emerald" />
              <MetricCard label="In progress" value={formatPrice(earnings.inProgress)} hint="Confirmed orders not yet delivered" />
            </div>

            <Panel>
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Orders</p>
                <Link href="/sellers/orders" className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 underline underline-offset-4">
                  View all
                </Link>
              </div>
              <div className="px-5 pb-2 grid grid-cols-2 md:grid-cols-4 gap-x-6">
                <CountCell label="Pending payment" value={orders.pendingPayment} href="/sellers/orders" />
                <CountCell label="Needs photos" value={orders.needsVerification} href="/sellers/orders?tab=action" accent />
                <CountCell label="Awaiting review" value={orders.awaitingReview} href="/sellers/orders?tab=review" />
                <CountCell label="Ready to ship" value={orders.needsTracking} href="/sellers/orders?tab=action" accent />
                <CountCell label="In transit" value={orders.shipped} href="/sellers/orders?tab=shipped" />
                <CountCell label="Delivered" value={orders.delivered} href="/sellers/orders?tab=delivered" />
                <CountCell label="Payout due" value={orders.payoutDue} href="/sellers/orders?tab=delivered" accent />
                <CountCell label="Cancelled" value={orders.cancelled} href="/sellers/orders?tab=cancelled" />
              </div>
              <p className="text-[11px] text-zinc-400 px-5 py-3 border-t border-zinc-100">
                You are paid exactly your listed price. Payouts are released about {earnings.payoutDelayDays} days after delivery to your UPI ID{seller.upiId ? ` (${seller.upiId})` : ', add it in Settings'}. You get an email with the payment screenshot each time.
              </p>
            </Panel>

            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <Panel>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Action needed</p>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{plural(data.actionItems.length, 'order')}</span>
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
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">How to climb</p>
                  <ul className="space-y-2.5 text-sm text-zinc-600">
                    <li className="flex gap-2"><span className="text-zinc-900 font-black">1.</span> Ship before the ship-by date on every order. It is half your score.</li>
                    <li className="flex gap-2"><span className="text-zinc-900 font-black">2.</span> Only list pairs you can actually send. Cancellations cost the most.</li>
                    <li className="flex gap-2"><span className="text-zinc-900 font-black">3.</span> Shoot photos in daylight with the size tag sharp, so they pass first time.</li>
                    <li className="flex gap-2"><span className="text-zinc-900 font-black">4.</span> Watch the Not lowest tags on your listings. Lowest offers get the sale.</li>
                  </ul>
                  <Link href="/sellers/listings" className={`${btnSecondary} w-full mt-4`}>
                    Manage listings
                  </Link>
                </Panel>
              </div>
            </div>

            {orders.total === 0 && inventory.activeListings === 0 && (
              <EmptyBlock
                title="Start by adding your first listing"
                body="Pick a product from the SNKRS CART catalog, choose your sizes and price, and it goes live for customers."
                action={<Link href="/sellers/listings" className={btnSecondary}>Go to listings</Link>}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
}
