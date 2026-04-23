'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Paginator from '../_components/Paginator';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  author: string;
  tags: string[];
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

export default function AdminBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${API}/admin/blogs`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setBlogs(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeletingId(id);
    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`${API}/admin/blogs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePublish(blog: Blog) {
    const token = localStorage.getItem('admin_token');
    const updated = await fetch(`${API}/admin/blogs/${blog._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ published: !blog.published }),
    });
    if (updated.ok) {
      setBlogs((prev) => prev.map((b) => b._id === blog._id ? { ...b, published: !b.published } : b));
    }
  }

  const filtered = blogs.filter((b) => {
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.tags.join(' ').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-red-400 text-sm">{error}</p>
      <button type="button" onClick={() => { setError(''); setLoading(true); fetchBlogs(); }} className="text-xs text-zinc-400 hover:text-white underline">Retry</button>
    </div>
  );

  return (
    <div className="text-white">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search by title, author, tag..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-72 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</span>
          <Link
            href="/admin/blogs/new"
            className="flex items-center gap-2 bg-white text-zinc-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {paginated.map((blog) => (
              <tr key={blog._id} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3">
                  <div className="font-medium text-white max-w-[220px] truncate">{blog.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">/blogs/{blog.slug}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{blog.author}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {blog.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] font-semibold uppercase tracking-wide bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                    {blog.tags.length > 2 && <span className="text-[10px] text-zinc-600">+{blog.tags.length - 2}</span>}
                    {blog.tags.length === 0 && <span className="text-zinc-600">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(blog)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      blog.published
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {blog.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{timeAgo(blog.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {blog.published && (
                      <a
                        href={`${SITE}/blogs/${blog.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition"
                      >
                        View ↗
                      </a>
                    )}
                    <Link
                      href={`/admin/blogs/${blog._id}`}
                      className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(blog._id, blog.title)}
                      disabled={deletingId === blog._id}
                      className="text-xs text-red-500 hover:text-red-400 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition disabled:opacity-40"
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
                  {search ? 'No posts match your search.' : 'No blog posts yet. Create your first post!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />
    </div>
  );
}
