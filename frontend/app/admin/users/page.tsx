'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface AdminUser {
  _id: string;
  id: string;
  email: string;
  name: string;
  phone: string;
  addresses: { addressLine: string; city: string; state: string; pincode: string; isDefault: boolean }[];
  orderCount: number;
  totalSpend: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`${BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { router.push('/admin/login'); return; }
        setUsers(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = search.trim()
    ? users.filter((u) => {
        const q = search.toLowerCase();
        return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.phone.includes(q);
      })
    : users;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalSpend = users.reduce((s, u) => s + u.totalSpend, 0);
  const withOrders = users.filter((u) => u.orderCount > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length },
          { label: 'With Orders', value: withOrders },
          { label: 'No Orders', value: users.length - withOrders },
          { label: 'Total Revenue', value: `₹${totalSpend.toLocaleString('en-IN')}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
            <p className="text-xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email or phone…"
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm pl-9 pr-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>
          <p className="text-xs text-zinc-500 shrink-0">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">No users found.</div>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_160px_80px_110px_100px] px-5 py-2 border-b border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <span>User</span>
              <span>Phone</span>
              <span>Orders</span>
              <span>Spent</span>
              <span>Joined</span>
            </div>

            <div className="divide-y divide-zinc-800">
              {paginated.map((user) => (
                <Link
                  key={user._id}
                  href={`/admin/users/${user._id}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_160px_80px_110px_100px] px-5 py-3.5 hover:bg-zinc-800/50 transition-colors items-center gap-1 sm:gap-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name || <span className="text-zinc-500 italic">No name</span>}</p>
                    <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <p className="text-xs text-zinc-400 sm:block">{user.phone || <span className="text-zinc-600">—</span>}</p>
                  <p className="text-xs font-semibold text-white">{user.orderCount}</p>
                  <p className="text-xs font-semibold text-white">
                    {user.totalSpend > 0 ? `₹${user.totalSpend.toLocaleString('en-IN')}` : <span className="text-zinc-600">—</span>}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p); return acc;
                    }, [])
                    .map((p, i) => p === '...'
                      ? <span key={`e${i}`} className="px-1 text-zinc-600 text-xs">…</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`min-w-[28px] h-7 px-1.5 rounded text-xs font-bold transition-colors ${safePage === p ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                          {p}
                        </button>
                    )}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
