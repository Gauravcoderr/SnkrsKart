'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface PageEntry {
  pageKey: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  updatedAt?: string;
}

const CONTENT_PAGES = new Set(['faq', 'privacy', 'about', 'terms']);

export default function AdminPagesListPage() {
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${API}/admin/site-content`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setPages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Pages &amp; SEO</h1>
        <p className="text-sm text-zinc-500 mt-1">Edit metadata and content for each page.</p>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-5 py-3 text-[11px] font-bold tracking-widest uppercase text-zinc-500">Page</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold tracking-widest uppercase text-zinc-500 hidden sm:table-cell">Meta Title</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold tracking-widest uppercase text-zinc-500 hidden md:table-cell">Content</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {pages.map((p) => (
              <tr key={p.pageKey} className="hover:bg-zinc-900/40 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{p.label}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">/{p.pageKey === 'home' ? '' : p.pageKey}</p>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  {p.metaTitle ? (
                    <span className="text-zinc-400 truncate max-w-[180px] block">{p.metaTitle}</span>
                  ) : (
                    <span className="text-zinc-700 italic">Not set</span>
                  )}
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  {CONTENT_PAGES.has(p.pageKey) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 bg-zinc-800 px-2 py-1 rounded-md">
                      Editable
                    </span>
                  ) : (
                    <span className="text-zinc-700 text-xs">Metadata only</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/pages/${p.pageKey}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
