'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';
import { useAuth, authHeaders } from '@/context/AuthContext';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const STATUS_STYLES: Record<string, { dot: string; text: string; bg: string; label: string; accent: string; heroBg: string; heroText: string; strip: string }> = {
  pending:   { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   label: 'Pending Payment', accent: 'text-amber-500',   heroBg: 'from-amber-950 to-zinc-950',   heroText: 'text-amber-300',  strip: 'bg-gradient-to-b from-amber-400 to-amber-600' },
  confirmed: { dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',    label: 'Confirmed',       accent: 'text-blue-500',    heroBg: 'from-blue-950 to-zinc-950',    heroText: 'text-blue-300',   strip: 'bg-gradient-to-b from-blue-400 to-blue-600' },
  shipped:   { dot: 'bg-violet-400',  text: 'text-violet-700',  bg: 'bg-violet-50',  label: 'Shipped',         accent: 'text-violet-500',  heroBg: 'from-violet-950 to-zinc-950',  heroText: 'text-violet-300', strip: 'bg-gradient-to-b from-violet-400 to-violet-600' },
  delivered: { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Delivered',       accent: 'text-emerald-500', heroBg: 'from-emerald-950 to-zinc-950', heroText: 'text-emerald-300',strip: 'bg-gradient-to-b from-emerald-400 to-emerald-600' },
  cancelled: { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     label: 'Cancelled',       accent: 'text-red-500',     heroBg: 'from-red-950 to-zinc-950',     heroText: 'text-red-300',    strip: 'bg-gradient-to-b from-red-400 to-red-600' },
};

const STEPS = [
  { label: 'Order Placed', icon: (filled: boolean) => (
    <svg className={`w-4 h-4 ${filled ? 'text-white' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )},
  { label: 'Confirmed', icon: (filled: boolean) => (
    <svg className={`w-4 h-4 ${filled ? 'text-white' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )},
  { label: 'Shipped', icon: (filled: boolean) => (
    <svg className={`w-4 h-4 ${filled ? 'text-white' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )},
  { label: 'Delivered', icon: (filled: boolean) => (
    <svg className={`w-4 h-4 ${filled ? 'text-white' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
];

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

const STEP_COLORS = [
  { filled: 'bg-amber-500 ring-amber-500/25',    line: 'bg-amber-400',    label: 'text-amber-600' },
  { filled: 'bg-blue-500 ring-blue-500/25',      line: 'bg-blue-400',     label: 'text-blue-600' },
  { filled: 'bg-violet-500 ring-violet-500/25',  line: 'bg-violet-400',   label: 'text-violet-600' },
  { filled: 'bg-emerald-500 ring-emerald-500/25',line: 'bg-emerald-400',  label: 'text-emerald-600' },
];

function StatusStepper({ status, compact = false }: { status: string; compact?: boolean }) {
  const stepIdx = STEP_INDEX[status] ?? 0;
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span className="text-sm font-bold text-red-600">Order Cancelled</span>
      </div>
    );
  }
  const circleSize = compact ? 'w-7 h-7' : 'w-10 h-10';
  const lineW = compact ? 'w-5 sm:w-8' : 'w-8 sm:w-14';
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= stepIdx;
        const isCurrent = i === stepIdx;
        const isLast = i === STEPS.length - 1;
        const colors = STEP_COLORS[i];
        return (
          <div key={step.label} className="flex items-start">
            <div className="flex flex-col items-center gap-2">
              <div className={`
                ${circleSize} rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                ${done
                  ? isCurrent
                    ? `${colors.filled} ring-4`
                    : colors.filled.split(' ')[0]
                  : 'bg-zinc-100 border-2 border-zinc-200'}
              `}>
                {step.icon(done)}
              </div>
              {!compact && (
                <span className={`text-[9px] font-black tracking-wider uppercase text-center leading-tight transition-colors max-w-[52px] ${done ? colors.label : 'text-zinc-400'}`}>
                  {step.label}
                </span>
              )}
            </div>
            {!isLast && (
              <div className={`${lineW} h-0.5 mt-5 mx-1 rounded-full transition-all duration-300 ${i < stepIdx ? colors.line : 'bg-zinc-200'}`} />
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

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-md hover:border-zinc-200 transition-all duration-200">
      {/* Left status strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.strip}`} />

      <div className="pl-4">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-zinc-700">{order.orderNumber}</span>
            <span className="text-zinc-300 text-xs">·</span>
            <span className="text-xs text-zinc-400">{date}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            <span className={`text-[10px] font-bold tracking-wide ${s.text}`}>{s.label}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-4">
            {/* Product thumbnails */}
            <div className="flex -space-x-3 shrink-0">
              {order.items.slice(0, 3).map((item, i) =>
                item.image ? (
                  <div key={i} className="relative w-16 h-16 rounded-xl border-2 border-white bg-zinc-100 overflow-hidden shadow-sm ring-1 ring-zinc-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                  </div>
                ) : null
              )}
              {order.items.length > 3 && (
                <div className="w-16 h-16 rounded-xl border-2 border-white bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center shadow-sm ring-1 ring-zinc-100">
                  <span className="text-xs font-black text-indigo-500">+{order.items.length - 3}</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">{order.items.map((i) => i.name).join(', ')}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {order.items.length} item{order.items.length > 1 ? 's' : ''} · UK {order.items[0]?.size}
              </p>
              <p className="text-base font-black text-zinc-900 mt-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {formatPrice(order.total)}
              </p>
            </div>

            {/* View Details */}
            <button
              type="button"
              onClick={() => onViewDetails(order)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-indigo-600 transition-colors mt-1"
            >
              Details
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Stepper */}
          <div className="mt-4 pt-3 border-t border-zinc-50">
            <StatusStepper status={order.status} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Back */}
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </button>

      {/* Hero status banner */}
      <div className={`rounded-2xl bg-gradient-to-br ${s.heroBg} p-6 text-white overflow-hidden relative`}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/5" />
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border border-white/5" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 mb-1">Order</p>
              <p className="text-sm font-mono font-bold text-white/80">{order.orderNumber}</p>
              <p className="text-xs text-white/40 mt-0.5">{date}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
              <span className={`text-xs font-black tracking-wide ${s.text}`}>{s.label}</span>
            </div>
          </div>
          {order.status !== 'cancelled' && (
            <div className="bg-white/5 rounded-xl p-4 mt-2">
              <StatusStepper status={order.status} />
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-2">
              <StatusStepper status={order.status} />
            </div>
          )}
        </div>
      </div>

      {/* Tracking + Payment alerts */}
      {order.trackingNumber && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-100 rounded-xl">
          <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase text-violet-500 mb-0.5">Tracking Number</p>
            <p className="text-sm font-mono font-bold text-violet-900 truncate">{order.trackingNumber}</p>
          </div>
        </div>
      )}
      {order.status === 'pending' && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800 mb-0.5">Payment Pending</p>
            <p className="text-xs text-amber-700">
              Complete UPI payment and send screenshot on{' '}
              <a href={`https://wa.me/919410903791?text=Order+${order.orderNumber}+payment+done`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                WhatsApp
              </a>{' '}
              to confirm.
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-50">
          <p className="text-xs font-black tracking-widest uppercase text-zinc-500">Items Ordered</p>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
        </div>
        {order.items.map((item, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
            {item.image ? (
              <div className="relative w-[72px] h-[72px] bg-zinc-100 rounded-xl shrink-0 overflow-hidden ring-1 ring-zinc-100">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="72px" />
              </div>
            ) : (
              <div className="w-[72px] h-[72px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shrink-0 flex items-center justify-center">
                <span className="text-2xl">👟</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black tracking-widest uppercase text-indigo-500">{item.brand}</p>
              <p className="text-sm font-bold text-zinc-900 leading-snug mt-0.5">{item.name}</p>
              {item.colorway && <p className="text-xs text-zinc-400 mt-0.5">{item.colorway}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">UK {item.size}</span>
                <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">Qty {item.qty}</span>
              </div>
            </div>
            <p className="text-sm font-black text-zinc-900 shrink-0">{formatPrice(item.price * item.qty)}</p>
          </div>
        ))}
      </div>

      {/* Summary + Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-5 text-white">
          <p className="text-[10px] font-black tracking-widest uppercase text-zinc-400 mb-4">Payment Summary</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span><span className="font-semibold text-white">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Shipping</span>
              <span className={order.shipping === 0 ? 'text-emerald-400 font-bold' : 'font-semibold text-white'}>
                {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between font-black border-t border-zinc-700 pt-3 mt-1 text-base">
              <span className="text-zinc-300">Total</span>
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm">
          <p className="text-[10px] font-black tracking-widest uppercase text-zinc-400 mb-4">Delivery Address</p>
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">{order.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{order.addressLine}</p>
              <p className="text-xs text-zinc-500">{order.city}, {order.state} — {order.pincode}</p>
              <p className="text-xs text-zinc-400 mt-1">{order.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-zinc-500">Need help with this order?</span>
        <a href={`https://wa.me/919410903791?text=Help+with+order+${order.orderNumber}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
          Chat on WhatsApp →
        </a>
      </div>
    </div>
  );
}

const TABS: { key: FilterTab; label: string; color: string; activeColor: string }[] = [
  { key: 'all',       label: 'All Orders', color: 'text-zinc-500 bg-zinc-100',           activeColor: 'bg-zinc-900 text-white' },
  { key: 'active',    label: 'Active',     color: 'text-blue-600 bg-blue-50',             activeColor: 'bg-blue-600 text-white' },
  { key: 'delivered', label: 'Delivered',  color: 'text-emerald-600 bg-emerald-50',       activeColor: 'bg-emerald-600 text-white' },
  { key: 'cancelled', label: 'Cancelled',  color: 'text-red-500 bg-red-50',               activeColor: 'bg-red-500 text-white' },
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

  if (selectedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 rounded-b-3xl px-6 pt-10 pb-8 mb-8 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-indigo-300/60 mb-0.5">Account</p>
              <h1 className="text-2xl font-black tracking-tight text-white">My Orders</h1>
              {isLoggedIn && myOrders.length > 0 && (
                <p className="text-xs text-zinc-400 mt-0.5">{myOrders.length} order{myOrders.length > 1 ? 's' : ''} total</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTrack((v) => !v)}
            className="shrink-0 text-xs font-bold text-white/70 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
          >
            Track #
          </button>
        </div>

        {/* Track section inside hero */}
        {showTrack && (
          <div className="relative z-10 mt-5 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <p className="text-[10px] font-bold tracking-widest uppercase text-indigo-300/60 mb-2">Track by Order Number</p>
            <form onSubmit={handleTrack} className="flex gap-2">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="e.g. SC-ABC123-XY"
                className="flex-1 bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 transition-colors font-mono rounded-xl"
              />
              <button
                type="submit"
                disabled={lookupMutation.isPending}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold tracking-wide hover:opacity-90 disabled:opacity-50 transition rounded-xl shrink-0"
              >
                {lookupMutation.isPending ? '...' : 'Track'}
              </button>
            </form>
            {trackError && <p className="text-xs text-red-400 mt-2">{trackError}</p>}
            {trackedOrder && (
              <div className="mt-3">
                <OrderCard order={trackedOrder} onViewDetails={(o) => setSelectedOrder(o)} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Not logged in */}
      {!authLoading && !isLoggedIn && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-10 text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-base font-black text-zinc-900 mb-1">Sign in to view your orders</p>
          <p className="text-xs text-zinc-500 mb-5">Track orders, view history and manage returns</p>
          <button type="button" onClick={openAuthModal} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 text-xs font-bold tracking-widest uppercase hover:opacity-90 transition rounded-xl shadow-lg shadow-indigo-200">
            Sign In
          </button>
        </div>
      )}

      {/* Orders list (logged in) */}
      {isLoggedIn && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map((tab) => {
              const count = tab.key === 'all' ? myOrders.length
                : tab.key === 'active' ? myOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
                : myOrders.filter((o) => o.status === tab.key).length;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive ? tab.activeColor + ' shadow-sm' : 'text-zinc-500 bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : 'bg-white text-zinc-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-zinc-400 font-medium">Loading your orders…</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((o) => (
                <OrderCard key={o._id} order={o} onViewDetails={(o) => setSelectedOrder(o)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-zinc-50 to-indigo-50/30 rounded-2xl border border-dashed border-indigo-100">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-600">
                {activeTab === 'all' ? 'No orders yet.' : `No ${activeTab} orders.`}
              </p>
              {activeTab === 'all' && (
                <Link href="/products" className="inline-block mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors">
                  Start shopping →
                </Link>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center justify-between">
        <Link href="/account" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Account
        </Link>
        <Link href="/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
          Continue Shopping →
        </Link>
      </div>
    </div>
  );
}
