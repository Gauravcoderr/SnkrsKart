'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';
import { useAuth, authHeaders } from '@/context/AuthContext';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  pending:   { dot: 'bg-amber-400',   text: 'text-amber-700',  label: 'Pending Payment' },
  confirmed: { dot: 'bg-blue-400',    text: 'text-blue-700',   label: 'Confirmed' },
  shipped:   { dot: 'bg-violet-400',  text: 'text-violet-700', label: 'Shipped' },
  delivered: { dot: 'bg-emerald-400', text: 'text-emerald-700',label: 'Delivered' },
  cancelled: { dot: 'bg-red-400',     text: 'text-red-700',    label: 'Cancelled' },
};

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

export default function OrdersPage() {
  const { isLoggedIn, loading: authLoading, openAuthModal } = useAuth();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  // Fetch user's orders via React Query
  const { data: myOrders = [], isLoading: myOrdersLoading } = useQuery<Order[]>({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/orders/my`, { credentials: 'include', headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn,
    staleTime: 2 * 60 * 1000, // 2 min
  });

  // Lookup order by number via mutation
  const lookupMutation = useMutation({
    mutationFn: async (orderNumber: string) => {
      const res = await fetch(`${BASE_URL}/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order not found');
      return data as Order;
    },
    onSuccess: (data) => { setOrder(data); setError(''); },
    onError: (err: Error) => { setError(err.message); setOrder(null); },
  });

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    lookupMutation.mutate(q);
  }

  const loading = lookupMutation.isPending;

  const status = order ? (STATUS_STYLES[order.status] ?? STATUS_STYLES.pending) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Account</p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Track Your Order</h1>
      </div>

      {/* Logged-in user's orders */}
      {isLoggedIn && (
        <div className="mb-10">
          {myOrdersLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            </div>
          ) : myOrders.length > 0 ? (
            <div className="space-y-3">
              {myOrders.map((o) => {
                const s = STATUS_STYLES[o.status] ?? STATUS_STYLES.pending;
                return (
                  <div
                    key={o._id}
                    className="border border-zinc-100 rounded-xl p-4 hover:border-zinc-200 transition cursor-pointer"
                    onClick={() => { setOrder(o); setQuery(o.orderNumber); }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-zinc-600">{o.orderNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 3).map((item, i) => (
                          item.image ? (
                            <div key={i} className="relative w-10 h-10 rounded-lg border-2 border-white bg-zinc-50 overflow-hidden">
                              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                            </div>
                          ) : null
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {o.items.map((i) => i.name).join(', ')}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-zinc-900 shrink-0">{formatPrice(o.total)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <p className="text-sm">No orders yet.</p>
              <Link href="/products" className="text-xs underline hover:text-zinc-700 mt-1 inline-block">Start shopping</Link>
            </div>
          )}
        </div>
      )}

      {/* Sign in prompt if not logged in */}
      {!authLoading && !isLoggedIn && (
        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 mb-8 text-center">
          <p className="text-sm text-zinc-600 mb-2">Sign in to see all your orders in one place</p>
          <button type="button" onClick={openAuthModal} className="text-xs font-bold text-zinc-900 underline hover:text-zinc-600 transition">
            Sign In
          </button>
        </div>
      )}

      {/* Manual search form */}
      <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-2">Track by Order Number</p>
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter order number (e.g. SC-ABC123-XY)"
          className="flex-1 border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors shrink-0"
        >
          {loading ? '...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded px-4 py-3 text-sm text-red-700 mb-6">
          {error}. Double-check your order number from the confirmation email.
        </div>
      )}

      {order && status && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className="border border-zinc-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Order</p>
              <span className="text-xs font-mono font-semibold text-zinc-600">{order.orderNumber}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
              <span className={`text-sm font-bold ${status.text}`}>{status.label}</span>
            </div>
            {order.status === 'pending' && (
              <p className="text-xs text-zinc-500 mt-1 ml-4">
                Complete UPI payment and send screenshot on{' '}
                <a
                  href={`https://wa.me/919410903791?text=Order+${order.orderNumber}+payment+done`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  WhatsApp
                </a>{' '}
                to confirm your order.
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-xs text-zinc-500 mt-1 ml-4">
                Tracking: <span className="font-mono font-semibold text-zinc-700">{order.trackingNumber}</span>
              </p>
            )}
          </div>

          {/* Items */}
          <div className="border border-zinc-100 rounded-xl overflow-hidden">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 px-5 pt-4 pb-3 border-b border-zinc-100">
              Items
            </p>
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 p-4 border-b border-zinc-100 last:border-0">
                {item.image && (
                  <div className="relative w-14 h-14 bg-zinc-50 rounded shrink-0 overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
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

          {/* Summary + address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-100 rounded-xl p-5">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Payment Summary</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span className={order.shipping === 0 ? 'text-emerald-600 font-semibold' : ''}>
                    {order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900 border-t border-zinc-100 pt-2 mt-2">
                  <span>Total</span><span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
            <div className="border border-zinc-100 rounded-xl p-5">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Delivery Address</p>
              <p className="text-sm font-semibold text-zinc-900">{order.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{order.addressLine}</p>
              <p className="text-xs text-zinc-500">{order.city}, {order.state} — {order.pincode}</p>
              <p className="text-xs text-zinc-500 mt-1">{order.phone}</p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 text-center">
            Need help?{' '}
            <a
              href={`https://wa.me/919410903791?text=Help+with+order+${order.orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 underline hover:text-zinc-900"
            >
              Contact us on WhatsApp
            </a>
          </p>
        </div>
      )}

      {!order && !error && !loading && (
        <div className="text-center py-12 text-zinc-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">Enter your order number to track your order.</p>
          <p className="text-xs mt-1">Find it in your confirmation email.</p>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-zinc-100 text-center">
        <Link href="/products" className="text-xs text-zinc-400 hover:text-zinc-700 underline transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
