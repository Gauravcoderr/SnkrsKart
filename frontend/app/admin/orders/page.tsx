'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
import Paginator from '../_components/Paginator';

interface OrderItem {
  name: string;
  brand: string;
  size: string;
  qty: number;
  price: number;
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
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber: string;
  notes: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/30 text-amber-400',
  confirmed: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-purple-900/30 text-purple-400',
  delivered: 'bg-emerald-900/30 text-emerald-400',
  cancelled: 'bg-red-900/30 text-red-400',
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingNumber: '', notes: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openOrder(order: Order) {
    setSelected(order);
    setUpdateForm({ status: order.status, trackingNumber: order.trackingNumber || '', notes: order.notes || '' });
  }

  async function handleUpdate() {
    if (!selected) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${BASE_URL}/admin/orders/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateForm),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      setSelected(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  const searched = search.trim()
    ? orders.filter((o) => {
        const q = search.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.includes(q)
        );
      })
    : orders;

  const filtered = filterStatus === 'all' ? searched : searched.filter((o) => o.status === filterStatus);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goToPage(p: number) { setPage(Math.max(1, Math.min(p, totalPages))); }

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(filterStatus === s ? 'all' : s); setPage(1); }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              filterStatus === s ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${STATUS_COLORS[s].split(' ')[1]}`}>{s}</p>
            <p className="text-xl font-black text-white">{counts[s] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${selected ? 'grid-cols-1 xl:grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
        {/* Orders table */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">
                {filterStatus === 'all' ? `All Orders (${filtered.length})` : `${filterStatus} (${filtered.length})`}
              </p>
              {filterStatus !== 'all' && (
                <button onClick={() => { setFilterStatus('all'); setPage(1); }} className="text-xs text-zinc-400 hover:text-white underline">Clear filter</button>
              )}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by order #, name, email or phone…"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm pl-9 pr-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">No orders found.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {paginated.map((order) => (
                <button
                  key={order._id}
                  onClick={() => openOrder(order)}
                  className={`w-full text-left px-5 py-4 hover:bg-zinc-800/50 transition-colors ${selected?._id === order._id ? 'bg-zinc-800/80' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-zinc-300">{order.orderNumber}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[order.status]}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{order.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{order.email} · {order.phone}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.city}, {order.state}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">₹{order.total.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <Paginator page={safePage} totalPages={totalPages} onPage={goToPage} pageSize={PAGE_SIZE} totalItems={filtered.length} />
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden self-start">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">{selected.orderNumber}</p>
                <p className="text-sm font-bold text-white">{selected.name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Contact */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Customer</p>
                <p className="text-xs text-zinc-300">{selected.email}</p>
                <p className="text-xs text-zinc-300">{selected.phone}</p>
                <p className="text-xs text-zinc-400 mt-1">{selected.addressLine}, {selected.city}, {selected.state} — {selected.pincode}</p>
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-zinc-300 truncate">{item.brand} {item.name} — UK {item.size} × {item.qty}</span>
                      <span className="text-zinc-400 shrink-0 ml-2">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-800 mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Subtotal</span><span>₹{selected.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Shipping</span><span>{selected.shipping === 0 ? 'Free' : `₹${selected.shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white">
                    <span>Total</span><span>₹{selected.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Update form */}
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Update Order</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Status</label>
                    <select
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-zinc-500"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={updateForm.trackingNumber}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                      placeholder="e.g. DTDC1234567890"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Notes</label>
                    <textarea
                      value={updateForm.notes}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Internal notes..."
                      rows={2}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="w-full py-2.5 bg-white text-zinc-900 text-sm font-bold tracking-widest uppercase rounded hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 transition-colors"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
