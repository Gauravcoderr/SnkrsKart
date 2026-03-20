'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Paginator from '../_components/Paginator';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PAGE_SIZE = 10;

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  productName: string;
  productBrand: string;
  selectedSize: number | null;
  price: number;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchInquiries = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${API}/admin/inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setInquiries(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const filtered = inquiries.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.productName.toLowerCase().includes(q) ||
      i.productBrand.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error}</p>
        <button type="button" onClick={() => { setError(''); setLoading(true); fetchInquiries(); }} className="text-xs text-zinc-400 hover:text-white underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search by name, email, product..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full sm:w-80 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <span className="text-sm text-zinc-500">{filtered.length} of {inquiries.length} total</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {paginated.map((inq) => (
              <tr key={inq._id} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{inq.name}</div>
                  <div className="text-xs text-zinc-500">{inq.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white max-w-[200px] truncate">{inq.productName}</div>
                  <div className="text-xs text-zinc-500">{inq.productBrand}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {inq.selectedSize ? `UK ${inq.selectedSize}` : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                  ₹{inq.price.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                  {timeAgo(inq.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/inquiries/${inq._id}`}
                    className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  {search ? 'No inquiries match your search.' : 'No inquiries yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
