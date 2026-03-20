'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Paginator from '../_components/Paginator';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PAGE_SIZE = 10;

interface Review {
  _id: string;
  productSlug: string;
  productName: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= value ? 'text-amber-400' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

interface EditModal {
  review: Review;
  name: string;
  rating: number;
  comment: string;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');

  const getToken = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return null; }
    return token;
  }, [router]);

  const fetchReviews = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/reviews`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function handleSave() {
    if (!editModal) return;
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${API}/admin/reviews/${editModal.review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editModal.name, rating: editModal.rating, comment: editModal.comment }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      setEditModal(null);
      fetchReviews();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const token = getToken();
    if (!token) return;
    setDeleting(true);
    try {
      await fetch(`${API}/admin/reviews/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      fetchReviews();
    } finally {
      setDeleting(false);
    }
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search by reviewer, product, comment..."
          aria-label="Search reviews"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full sm:w-80 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <span className="text-sm text-zinc-500">{filtered.length} of {reviews.length} total</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Comment</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {paginated.map((r) => (
              <tr key={r._id} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{r.name}</td>
                <td className="px-4 py-3">
                  <div className="text-white max-w-[160px] truncate">{r.productName}</div>
                  <div className="text-xs text-zinc-500 font-mono truncate max-w-[160px]">{r.productSlug}</div>
                </td>
                <td className="px-4 py-3">
                  <Stars value={r.rating} />
                  <span className="text-xs text-zinc-500 mt-0.5 block">{r.rating}/5</span>
                </td>
                <td className="px-4 py-3 text-zinc-400 max-w-[240px]">
                  <p className="line-clamp-2 text-xs leading-relaxed">{r.comment}</p>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => { setSaveError(''); setEditModal({ review: r, name: r.name, rating: r.rating, comment: r.comment }); }}
                      className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(r)}
                      className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-md hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  {search ? 'No reviews match your search.' : 'No reviews yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} />

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Edit Review</h2>
              <button
                type="button"
                aria-label="Close edit modal"
                onClick={() => setEditModal(null)}
                className="text-zinc-500 hover:text-white transition"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-widest">Reviewer Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-widest">Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                      onClick={() => setEditModal({ ...editModal, rating: s })}
                      className="focus:outline-none"
                    >
                      <svg className={`w-7 h-7 transition-colors ${s <= editModal.rating ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="edit-comment" className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-widest">Comment</label>
                <textarea
                  id="edit-comment"
                  value={editModal.comment}
                  onChange={(e) => setEditModal({ ...editModal, comment: e.target.value })}
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>

              {saveError && <p className="text-xs text-red-400">{saveError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:text-white hover:border-zinc-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-2">Delete Review?</h2>
            <p className="text-sm text-zinc-400 mb-1">
              Review by <span className="text-white font-medium">{deleteTarget.name}</span> for{' '}
              <span className="text-white font-medium">{deleteTarget.productName}</span>
            </p>
            <p className="text-xs text-zinc-500 mb-6">This will also update the product&apos;s average rating. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:text-white hover:border-zinc-500 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
