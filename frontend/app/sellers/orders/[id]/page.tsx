'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { sellerApi } from '@/lib/sellerApi';
import { AVAILABILITY_META } from '@/lib/availability';
import { shipmentHeadline, shipmentTone, formatCheckpointTime } from '@/lib/tracking';
import type { SellerOrder } from '@/types/seller';
import { DELIVERY_SERVICES } from '@/lib/couriers';
import { formatPrice, cn } from '@/lib/utils';
import VerificationCapture from '@/components/seller/VerificationCapture';
import {
  useSeller,
  useHandleApiError,
  useToast,
  Toast,
  Panel,
  LoadingBlock,
  ErrorBlock,
  StatusPill,
  PayoutPill,
  shipByInfo,
  DEFAULT_PENALTY_TEXT,
  VerificationPill,
  AvailabilityBadge,
  ProductThumb,
  formatDate,
  sizeLabel,
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnGhost,
  WHATSAPP_NUMBER,
} from '@/components/seller/SellerShell';

const STEPS = ['Confirmed', 'Photos verified', 'Shipped', 'Delivered'];

function stepIndex(order: SellerOrder): number {
  if (order.status === 'delivered') return 4;
  if (order.status === 'shipped') return 3;
  if (order.status === 'confirmed') return order.verification.status === 'approved' ? 2 : 1;
  return 0;
}

function Timeline({ order }: { order: SellerOrder }) {
  const cancelled = order.status === 'cancelled';
  const done = cancelled ? 0 : stepIndex(order);
  return (
    <ol className="grid grid-cols-4 gap-1">
      {STEPS.map((label, i) => {
        const complete = i < done;
        const current = i === done && !cancelled;
        return (
          <li key={label} className="flex flex-col gap-2">
            <div className={cn('h-1.5', cancelled ? 'bg-red-200' : complete ? 'bg-emerald-500' : current ? 'bg-zinc-900' : 'bg-zinc-200')} />
            <p className={cn('text-[9px] sm:text-[10px] font-bold tracking-widest uppercase leading-tight', cancelled ? 'text-red-400' : complete ? 'text-emerald-700' : current ? 'text-zinc-900' : 'text-zinc-400')}>
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TrackingForm({ order, onSaved }: { order: SellerOrder; onSaved: (order: SellerOrder) => void }) {
  const handleError = useHandleApiError();
  const [courier, setCourier] = useState('');
  const [number, setNumber] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cleanNumber = number.trim().replace(/\s+/g, '');
  const courierLabel = DELIVERY_SERVICES.find((s) => s.value === courier)?.label ?? courier;

  function review(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!courier) {
      setError('Pick the courier you shipped with');
      return;
    }
    if (cleanNumber.length < 5) {
      setError('Enter the full tracking number from your courier receipt');
      return;
    }
    setConfirming(true);
  }

  async function submit() {
    setSaving(true);
    setError('');
    try {
      const updated = await sellerApi.addTracking(order._id, courier, cleanNumber);
      onSaved(updated);
    } catch (err) {
      setError(handleError(err));
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  }

  if (confirming) {
    return (
      <div className="px-4 sm:px-5 py-5">
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-2">Confirm tracking</p>
        <div className="border border-zinc-200 bg-zinc-50 px-4 py-3 mb-4">
          <p className="text-xs text-zinc-500">{courierLabel}</p>
          <p className="text-lg font-black font-mono tracking-wide text-zinc-900 break-all">{cleanNumber}</p>
        </div>
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-4">
          Tracking can be entered only once. After saving, only SNKRS CART can change it. Double check the number before you confirm.
        </div>
        {error && <p className="text-xs text-red-600 font-medium mb-3">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={() => setConfirming(false)} disabled={saving} className={`${btnSecondary} sm:flex-1`}>
            Go back and edit
          </button>
          <button type="button" onClick={submit} disabled={saving} className={`${btnPrimary} sm:flex-1`}>
            {saving ? 'Saving...' : 'Yes, save tracking'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={review} className="px-4 sm:px-5 py-5 space-y-4">
      <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-bold">Tracking can be entered only once.</span> After saving, only SNKRS CART can change it.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="courier" className={labelClass}>Courier *</label>
          <select id="courier" value={courier} onChange={(e) => { setError(''); setCourier(e.target.value); }} className={inputClass}>
            {DELIVERY_SERVICES.map((s) => (
              <option key={s.value || 'none'} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tracking" className={labelClass}>Tracking number *</label>
          <input
            id="tracking"
            value={number}
            onChange={(e) => { setError(''); setNumber(e.target.value); }}
            placeholder="From your courier receipt"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={60}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <button type="submit" className={`${btnPrimary} w-full`}>
        Review and save tracking
      </button>
    </form>
  );
}

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { seller } = useSeller();
  const handleError = useHandleApiError();
  const { toast, show } = useToast();
  const [order, setOrder] = useState<SellerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setOrder(await sellerApi.order(id));
    } catch (err) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  }, [id, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingBlock label="Loading order" />;
  if (error || !order) {
    return (
      <div>
        <Link href="/sellers/orders" className={`${btnGhost} -ml-3 mb-4`}>
          &larr; Back to orders
        </Link>
        <ErrorBlock message={error || 'Order not found'} onRetry={load} />
      </div>
    );
  }

  const v = order.verification;
  const cancelled = order.status === 'cancelled';
  const showCapture = order.status === 'confirmed' && (v.status === 'none' || v.status === 'rejected');
  const showReview = order.status === 'confirmed' && v.status === 'pending';
  const showTracking = order.status === 'confirmed' && v.status === 'approved' && !order.trackingNumber;
  const shipsTo = [order.deliveryCity, order.deliveryState].filter(Boolean).join(', ');

  const itemsText = order.items.map((i) => `${i.brand} ${i.name} ${sizeLabel(i.size)} x${i.qty}`.trim()).join(', ');
  const waText = encodeURIComponent(`Hi SNKRS CART, please share the shipping details for order ${order.orderNumber}: ${itemsText}. Seller: ${seller.name}`);
  const waChange = encodeURIComponent(`Hi SNKRS CART, I need to change the tracking for order ${order.orderNumber}. Seller: ${seller.name}`);

  return (
    <div>
      <Link href="/sellers/orders" className={`${btnGhost} -ml-3 mb-3`}>
        &larr; Back to orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1.5">Order</p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900">{order.orderNumber}</h1>
          <p className="text-sm text-zinc-500 mt-1">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status={order.status} />
          {order.status !== 'pending_payment' && !cancelled && <VerificationPill status={v.status} />}
        </div>
      </div>

      <Panel className="px-4 sm:px-5 py-4 mb-4">
        <Timeline order={order} />
        {(() => {
          const info = shipByInfo(order);
          if (!info || cancelled) return null;
          const live = order.status === 'confirmed' && !order.trackingNumber;
          const cls = info.overdue ? 'border-red-200 bg-red-50' : info.dueSoon ? 'border-amber-300 bg-amber-50' : 'border-zinc-200 bg-zinc-50';
          return (
            <div className={`mt-4 border px-4 py-3 ${cls}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Fulfilment timeline</p>
                <span className={`text-xs font-black ${info.overdue ? 'text-red-700' : info.dueSoon ? 'text-amber-700' : 'text-zinc-900'}`}>{info.text}</span>
              </div>
              <p className="text-sm font-bold text-zinc-900 mt-1">Ship by {formatDate(order.shipBy, true)}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Based on the availability you listed ({order.items.map((it) => AVAILABILITY_META[it.availability].description.toLowerCase()).filter((v, i, a) => a.indexOf(v) === i).join(', ')}), counted from payment confirmation{order.confirmedAt ? ` on ${formatDate(order.confirmedAt)}` : ''}. Tracking added counts as shipped.
              </p>
              {live && <p className={`text-[11px] mt-2 ${info.overdue ? 'text-red-700 font-semibold' : 'text-zinc-500'}`}>{DEFAULT_PENALTY_TEXT}</p>}
            </div>
          );
        })()}
        {cancelled && (
          <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-red-600 mb-1">Order cancelled</p>
            <p className="text-sm text-red-800">{order.cancelReason || 'This order was cancelled. Do not ship it.'}</p>
          </div>
        )}
      </Panel>

      <div className="grid lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 space-y-4">
          {order.status === 'pending_payment' && (
            <Panel className="px-4 sm:px-5 py-4 border-amber-300 bg-amber-50">
              <p className="text-[10px] font-bold tracking-widest uppercase text-amber-700 mb-1">Hold on</p>
              <p className="text-sm font-bold text-amber-900">Waiting for customer payment confirmation</p>
              <p className="text-sm text-amber-800 mt-1">Do not ship yet. This order unlocks the photo step as soon as SNKRS CART confirms payment.</p>
            </Panel>
          )}

          {showCapture && (
            <VerificationCapture
              orderId={order._id}
              rejectedNote={v.status === 'rejected' ? v.adminNote : undefined}
              onSubmitted={(updated) => {
                setOrder(updated);
                show('Photos submitted. SNKRS CART will review them shortly.');
              }}
            />
          )}

          {showReview && (
            <Panel>
              <div className="px-4 sm:px-5 py-4 border-b border-zinc-100">
                <p className="text-[10px] font-bold tracking-widest uppercase text-amber-700">In review</p>
                <h2 className="text-lg font-black tracking-tight text-zinc-900 mt-0.5">Photos submitted, SNKRS CART is reviewing</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Submitted {formatDate(v.submittedAt, true)}. You will be able to add tracking once the photos are approved.
                </p>
              </div>
              <div className="px-4 sm:px-5 py-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {v.photos.map((p) => (
                  <a key={p.angle} href={p.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-zinc-100 overflow-hidden border border-zinc-200 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.angle} className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold tracking-widest uppercase px-1.5 py-1 truncate">{p.angle.replace(/-/g, ' ')}</span>
                  </a>
                ))}
              </div>
            </Panel>
          )}

          {showTracking && (
            <>
              <Panel className="px-4 sm:px-5 py-4 border-emerald-300">
                <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-700 mb-1">Photos approved</p>
                <h2 className="text-lg font-black tracking-tight text-zinc-900">Ready to ship</h2>
                <p className="text-sm text-zinc-500 mt-1">Get the customer&apos;s shipping details from SNKRS CART, ship the pair, then save the tracking below.</p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 bg-[#25D366] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#1fb857] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Request customer shipping details
                </a>
              </Panel>
              <Panel>
                <div className="px-4 sm:px-5 py-4 border-b border-zinc-100">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Step 2 of 2</p>
                  <h2 className="text-lg font-black tracking-tight text-zinc-900 mt-0.5">Add tracking</h2>
                </div>
                <TrackingForm
                  order={order}
                  onSaved={(updated) => {
                    setOrder(updated);
                    show('Tracking saved. The order is now marked as shipped.');
                  }}
                />
              </Panel>
            </>
          )}

          {order.trackingNumber && (
            <Panel className="px-4 sm:px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Tracking</p>
                  <p className="text-xs text-zinc-500">{order.deliveryService || 'Courier'}</p>
                  <p className="text-lg font-black font-mono tracking-wide text-zinc-900 break-all">{order.trackingNumber}</p>
                  {order.trackingAddedAt && <p className="text-[11px] text-zinc-400 mt-1">Added {formatDate(order.trackingAddedAt, true)}</p>}
                  {order.shipment?.tag && (
                    <div className={`mt-3 border px-3 py-2 ${shipmentTone(order.shipment.tag) === 'ok' ? 'border-emerald-200 bg-emerald-50' : shipmentTone(order.shipment.tag) === 'warn' ? 'border-red-200 bg-red-50' : 'border-sky-200 bg-sky-50'}`}>
                      <p className="text-xs font-bold text-zinc-900">{shipmentHeadline(order.shipment)}</p>
                      {order.shipment.lastCheckpoint && (
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          {order.shipment.lastCheckpoint.message}
                          {order.shipment.lastCheckpoint.location ? ` · ${order.shipment.lastCheckpoint.location}` : ''}
                          {order.shipment.lastCheckpoint.at ? ` · ${formatCheckpointTime(order.shipment.lastCheckpoint.at)}` : ''}
                        </p>
                      )}
                      {order.shipment.expectedDelivery && order.shipment.tag !== 'Delivered' && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">Courier estimate: {formatDate(order.shipment.expectedDelivery)}</p>
                      )}
                      <p className="text-[10px] text-zinc-400 mt-1">Live via AfterShip. Delivery marks this order delivered automatically.</p>
                    </div>
                  )}
                </div>
                <div className="w-9 h-9 border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 shrink-0" aria-label="Locked">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="5" y="11" width="14" height="10" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                </div>
              </div>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waChange}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-zinc-600 hover:text-zinc-900 underline underline-offset-4 min-h-[40px]"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                Contact SNKRS CART on WhatsApp to change
              </a>
            </Panel>
          )}

          {v.status === 'approved' && order.status !== 'confirmed' && v.photos.length > 0 && (
            <Panel>
              <div className="px-4 sm:px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Verification photos</p>
                <VerificationPill status={v.status} />
              </div>
              <div className="px-4 sm:px-5 py-4 grid grid-cols-4 sm:grid-cols-6 gap-2">
                {v.photos.map((p) => (
                  <a key={p.angle} href={p.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-zinc-100 overflow-hidden border border-zinc-200 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.angle} className="absolute inset-0 w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Panel>
            <div className="px-4 sm:px-5 py-3 border-b border-zinc-100">
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Items</p>
            </div>
            <ul className="divide-y divide-zinc-100">
              {order.items.map((item, i) => (
                <li key={`${item.listingId}-${i}`} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                  <ProductThumb src={item.image} alt={item.name} className="w-16 h-16" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{item.brand}</p>
                    <p className="text-sm font-bold text-zinc-900 leading-tight">{item.name}</p>
                    {item.colorway && <p className="text-xs text-zinc-500 truncate">{item.colorway}</p>}
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
            <div className="px-4 sm:px-5 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Your payout</p>
                <p className="text-[11px] text-zinc-400">Sent to your UPI after delivery</p>
              </div>
              <p className="text-xl font-black text-zinc-900">{formatPrice(order.sellerTotal)}</p>
            </div>
          </Panel>

          {order.status === 'delivered' && (
            <Panel className={`px-4 sm:px-5 py-4 ${order.payout?.status === 'paid' ? 'border-emerald-300' : 'border-amber-300'}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Payout</p>
                <PayoutPill status={order.payout?.status ?? 'due'} />
              </div>
              {order.payout?.status === 'paid' ? (
                <>
                  <p className="text-xl font-black text-emerald-700">{formatPrice(order.payout.amount || order.sellerTotal)}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Paid {formatDate(order.payout.paidAt)}{order.payout.reference ? ` · Ref ${order.payout.reference}` : ''}
                  </p>
                  {order.payout.note && <p className="text-xs text-zinc-600 mt-2 border-l-2 border-zinc-200 pl-3">{order.payout.note}</p>}
                  {order.payout.screenshotUrl && (
                    <a href={order.payout.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-[10px] font-bold tracking-widest uppercase underline underline-offset-4 text-zinc-900 hover:text-zinc-600">
                      View payment screenshot
                    </a>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xl font-black text-zinc-900">{formatPrice(order.sellerTotal)}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Delivered {formatDate(order.deliveredAt)}. SNKRS CART releases payouts about 7 days after delivery{order.payout?.dueAt ? `, around ${formatDate(order.payout.dueAt)}` : ''}. You will get an email with the payment screenshot.
                  </p>
                <p className="text-[11px] text-zinc-400 mt-2">Sent to your UPI ID{seller.upiId ? ` ${seller.upiId}` : ''}.{seller.upiId ? '' : ' Add it in Settings.'}</p>
                </>
              )}
            </Panel>
          )}

          <Panel className="px-4 sm:px-5 py-4">
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Ships to</p>
            <p className="text-sm font-bold text-zinc-900">{shipsTo || 'Location shared by SNKRS CART after approval'}</p>
            <p className="text-[11px] text-zinc-400 mt-1">Full address is shared by SNKRS CART on WhatsApp once your photos are approved.</p>
          </Panel>

          {v.attempts > 1 && (
            <p className="text-[11px] text-zinc-400 px-1">Photo attempts: {v.attempts}</p>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
