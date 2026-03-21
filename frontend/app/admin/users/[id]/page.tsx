'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import { BASE_URL } from '../../_lib/config';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/30 text-amber-400',
  confirmed: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-purple-900/30 text-purple-400',
  delivered: 'bg-emerald-900/30 text-emerald-400',
  cancelled: 'bg-red-900/30 text-red-400',
};

interface Address {
  _id?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface OrderItem { name: string; brand: string; size: string; qty: number; price: number; }

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  city: string;
  state: string;
}

interface UserDetail {
  id: string;
  _id: string;
  email: string;
  name: string;
  phone: string;
  addresses: Address[];
  orders: Order[];
  createdAt: string;
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { router.push('/admin/login'); return; }
        if (res.status === 404) { router.push('/admin/users'); return; }
        setUser(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const totalSpend = user.orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </Link>

      {/* Header card */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-black text-lg uppercase">
              {(user.name || user.email)[0]}
            </div>
            <div>
              <p className="text-lg font-black text-white">{user.name || <span className="text-zinc-500 italic font-normal text-base">No name set</span>}</p>
              <p className="text-sm text-zinc-400">{user.email}</p>
              {user.phone && <p className="text-sm text-zinc-400">{user.phone}</p>}
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 text-right shrink-0">
            Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-zinc-800">
          {[
            { label: 'Total Orders', value: user.orders.length },
            { label: 'Total Spent', value: totalSpend > 0 ? `₹${totalSpend.toLocaleString('en-IN')}` : '—' },
            { label: 'Addresses', value: user.addresses.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
              <p className="text-xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Orders */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="text-sm font-bold text-white">Order History</p>
          </div>
          {user.orders.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">No orders yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {user.orders.map((order) => (
                <div key={order._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-zinc-300">{order.orderNumber}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[order.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.city}, {order.state}
                      </p>
                      <div className="mt-1.5 space-y-0.5">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-[11px] text-zinc-500">
                            {item.brand} {item.name} — UK {item.size} × {item.qty}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">₹{order.total.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="text-sm font-bold text-white">Saved Addresses</p>
          </div>
          {user.addresses.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-sm">No addresses saved.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {user.addresses.map((addr, i) => (
                <div key={addr._id ?? i} className="px-5 py-4">
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded mb-2 inline-block">
                      Default
                    </span>
                  )}
                  <p className="text-xs text-zinc-300">{addr.addressLine}</p>
                  <p className="text-xs text-zinc-400">{addr.city}, {addr.state} — {addr.pincode}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
