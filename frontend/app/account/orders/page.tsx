'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';
import { useAuth, authHeaders } from '@/context/AuthContext';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const STATUS_STYLES: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  pending:   { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   label: 'Pending Payment' },
  confirmed: { dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    label: 'Confirmed' },
  shipped:   { dot: 'bg-violet-400',  text: 'text-violet-700',  bg: 'bg-violet-50',  label: 'Shipped' },
  delivered: { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Delivered' },
  cancelled: { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     label: 'Cancelled' },
};

const STEPS = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'];
const STEP_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3, cancelled: -1,
};

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  size: string;
  colorway: string;
  price: number;
  qty: number;
  image: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  trackingNumber?: string;
  createdAt: string;
}

function StatusStepper({ status }: { status: string }) {
  const stepIdx = STEP_INDEX[status] ?? 0;
  if (status === 'cancelled') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
        <span className="text-xs font-semibold text-red-600">Order Cancelled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i <= stepIdx;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full border-2 transition-colors ${done ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-300'}`} />
              <span className={`text-[9px] font-semibold whitespace-nowrap ${done ? 'text-zinc-700' : 'text-zinc-400'}`}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={`h-px w-8 sm:w-12 mb-4 mx-0.5 transition-colors ${i < stepIdx ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, onViewDetails }: { order: Order; onViewDetails: (o: Order) => void }) {
  const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const itemNames = order.items.map((i) => i.name).join(', ');

  return (
    <div className="border border-zinc-100 rounded-2xl overflow-hidden hover:border-zinc-200 hover:shadow-sm transition-all">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-zinc-700">{order.orderNumber}</span>
          <span className="text-zinc-300 text-xs">·</span>
          <span className="text-xs text-zinc-500">{date}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${s.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <span className={`text-[10px] font-bold tracking-wide ${s.text}`}>{s.label}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Product thumbnails */}
          <div className="flex -space-x-3 shrink-0">
            {order.items.slice(0, 3).map((item, i) =>
              item.image ? (
                <div key={i} className="relative w-14 h-14 rounded-xl border-2 border-white bg-zinc-100 overflow-hidden shadow-sm">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                </div>
              ) : null
            )}
            {order.items.length > 3 && (
              <div className="w-14 h-14 rounded-xl border-2 border-white bg-zinc-100 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-zinc-500">+{order.items.length - 3}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">{itemNames}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {order.items.length} item{order.items.length > 1 ? 's' : ''} · UK {order.items[0]?.size}
            </p>
            <p className="text-sm font-bold text-zinc-900 mt-1">{formatPrice(order.total)}</p>
          </div>

          {/* View Details */}
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="shrink-0 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 mt-1"
          >
            Details
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <StatusStepper status={order.status} />
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const status = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  return (
    <div className="space-y-5">
      {/* Back */}
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </button>

      {/* Status card */}
      <div className="border border-zinc-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold text-zinc-600">{order.orderNumber}</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className={`text-xs font-bold ${status.text}`}>{status.label}</span>
          </div>
        </div>
        <StatusStepper status={order.status} />
        {order.status === 'pending' && (
          <p className="text-xs text-zinc-500 mt-4 p-3 bg-amber-50 rounded-lg">
            Complete UPI payment and send screenshot on{' '}
            <a href={`https://wa.me/919410903791?text=Order+${order.orderNumber}+payment+done`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline">
              WhatsApp
            </a>{' '}
            to confirm your order.
          </p>
        )}
        {order.trackingNumber && (
          <p className="text-xs text-zinc-500 mt-3">
            Tracking: <span className="font-mono font-semibold text-zinc-700">{order.trackingNumber}</span>
          </p>
        )}
      </div>

      {/* Items */}
      <div className="border border-zinc-100 rounded-2xl overflow-hidden">
        <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 px-5 pt-4 pb-3 border-b border-zinc-100">Items ({order.items.length})</p>
        {order.items.map((item, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-zinc-100 last:border-0">
            {item.image && (
              <div className="relative w-16 h-16 bg-zinc-50 rounded-xl shrink-0 overflow-hidden">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{item.brand}</p>
              <p className="text-sm font-semibold text-zinc-900 truncate">{item.name}</p>
              <p className="text-xs text-zinc-500">UK {item.size} · Qty {item.qty}</p>
            </div>
            <p className="text-sm font-bold text-zinc-900 shrink-0">{formatPrice(item.price * item.qty)}</p>
          </div>
        ))}
      </div>

      {/* Summary + Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-zinc-100 rounded-2xl p-5">
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Payment Summary</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-zinc-600">
              <span>Shipping</span>
              <span className={order.shipping === 0 ? 'text-emerald-600 font-semibold' : ''}>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-zinc-900 border-t border-zinc-100 pt-2 mt-2"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>
        <div className="border border-zinc-100 rounded-2xl p-5">
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Delivery Address</p>
          <p className="text-sm font-semibold text-zinc-900">{order.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{order.addressLine}</p>
          <p className="text-xs text-zinc-500">{order.city}, {order.state} — {order.pincode}</p>
          <p className="text-xs text-zinc-500 mt-1">{order.phone}</p>
        </div>
      </div>

      <p className="text-xs text-zinc-400 text-center">
        Need help?{' '}
        <a href={`https://wa.me/919410903791?text=Help+with+order+${order.orderNumber}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline hover:text-zinc-900">
          Contact us on WhatsApp
        </a>
      </p>
    </div>
  );
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const { isLoggedIn, loading: authLoading, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState('');
  const [showTrack, setShowTrack] = useState(false);

  const { data: myOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/orders/my`, { credentials: 'include', headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn,
    staleTime: 2 * 60 * 1000,
  });

  const lookupMutation = useMutation({
    mutationFn: async (orderNumber: string) => {
      const res = await fetch(`${BASE_URL}/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order not found');
      return data as Order;
    },
    onSuccess: (data) => { setTrackedOrder(data); setTrackError(''); },
    onError: (err: Error) => { setTrackError(err.message); setTrackedOrder(null); },
  });

  function handleTrack(e: FormEvent) {
    e.preventDefault();
    const q = trackQuery.trim().toUpperCase();
    if (!q) return;
    lookupMutation.mutate(q);
  }

  const filteredOrders = myOrders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return o.status !== 'delivered' && o.status !== 'cancelled';
    if (activeTab === 'delivered') return o.status === 'delivered';
    if (activeTab === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  // Show detail view
  if (selectedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-0.5">Account</p>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">My Orders</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowTrack((v) => !v)}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-3 py-2 rounded-lg transition-colors"
        >
          Track by Order #
        </button>
      </div>

      {/* Track by order number — collapsible */}
      {showTrack && (
        <div className="mb-6 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-2">Track by Order Number</p>
          <form onSubmit={handleTrack} className="flex gap-2">
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="e.g. SC-ABC123-XY"
              className="flex-1 border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors font-mono rounded-lg bg-white"
            />
            <button
              type="submit"
              disabled={lookupMutation.isPending}
              className="px-5 py-2 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors rounded-lg shrink-0"
            >
              {lookupMutation.isPending ? '...' : 'Track'}
            </button>
          </form>
          {trackError && <p className="text-xs text-red-600 mt-2">{trackError}</p>}
          {trackedOrder && (
            <div className="mt-3">
              <OrderCard order={trackedOrder} onViewDetails={(o) => setSelectedOrder(o)} />
            </div>
          )}
        </div>
      )}

      {/* Not logged in */}
      {!authLoading && !isLoggedIn && (
        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-8 text-center mb-6">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-700 mb-1">Sign in to view your orders</p>
          <p className="text-xs text-zinc-400 mb-4">Track orders, view history and manage returns</p>
          <button type="button" onClick={openAuthModal} className="bg-zinc-900 text-white px-6 py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 transition rounded-lg">
            Sign In
          </button>
        </div>
      )}

      {/* Orders list (logged in) */}
      {isLoggedIn && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 mb-5 border-b border-zinc-100 pb-0">
            {TABS.map((tab) => {
              const count = tab.key === 'all' ? myOrders.length
                : tab.key === 'active' ? myOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
                : myOrders.filter((o) => o.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wide transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-900'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((o) => (
                <OrderCard key={o._id} order={o} onViewDetails={(o) => setSelectedOrder(o)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm font-semibold text-zinc-500">
                {activeTab === 'all' ? 'No orders yet.' : `No ${activeTab} orders.`}
              </p>
              {activeTab === 'all' && (
                <Link href="/products" className="text-xs underline hover:text-zinc-700 mt-1 inline-block">
                  Start shopping
                </Link>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center justify-between">
        <Link href="/account" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
          ← Back to Account
        </Link>
        <Link href="/products" className="text-xs text-zinc-400 hover:text-zinc-700 underline transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
