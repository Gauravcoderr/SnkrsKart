'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { compressImage } from '@/lib/compressImage';
import { uploadImage } from '@/lib/uploadImage';

const RichTextEditor = dynamic(() => import('@/components/blog/RichTextEditor'), { ssr: false, loading: () => <div className="h-[400px] bg-zinc-900 border border-zinc-700 rounded-lg animate-pulse" /> });

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface BlogFormProps {
  blogId?: string; // if editing
}

export default function BlogForm({ blogId }: BlogFormProps) {
  const router = useRouter();
  const isEdit = !!blogId;

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: 'SNKRS CART',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    published: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const coverFileRef = useRef<HTMLInputElement | null>(null);

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    setUploadError('');
    try {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed, 'blogs');
      set('coverImage', url);
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploadingCover(false);
    }
  }

  useEffect(() => {
    if (!isEdit) return;
    const token = localStorage.getItem('admin_token');
    fetch(`${API}/admin/blogs/${blogId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          coverImage: data.coverImage || '',
          author: data.author || 'SNKRS CART',
          tags: (data.tags || []).join(', '),
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          metaKeywords: data.metaKeywords || '',
          published: data.published || false,
        });
        setSlugManual(true);
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setFetchLoading(false));
  }, [blogId, isEdit]);

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(val: string) {
    set('title', val);
    if (!slugManual) set('slug', toSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      metaKeywords: form.metaKeywords || form.tags,
    };
    try {
      const url = isEdit ? `${API}/admin/blogs/${blogId}` : `${API}/admin/blogs`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.push('/admin/blogs');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Nike Air Max 90: A Complete History"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Slug *</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => { setSlugManual(true); set('slug', e.target.value); }}
              placeholder="nike-air-max-90-history"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <p className="text-[10px] text-zinc-600 mt-1">URL: /blogs/{form.slug || 'your-slug'}</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="Short summary shown in blog listing..."
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Content *</label>
            <RichTextEditor value={form.content} onChange={(html) => set('content', html)} />
          </div>
        </div>

        {/* Right — settings */}
        <div className="space-y-5">
          {/* Publish toggle */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Visibility</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${form.published ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                onClick={() => set('published', !form.published)}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.published ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-medium text-zinc-300">
                {form.published ? 'Published' : 'Draft'}
              </span>
            </label>
          </div>

          {/* Cover image */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Cover Image</p>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={form.coverImage}
                onChange={(e) => set('coverImage', e.target.value)}
                placeholder="Paste URL or upload →"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <input
                type="file"
                accept="image/*"
                aria-label="Upload cover image"
                className="hidden"
                ref={coverFileRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                title="Upload cover image"
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingCover}
                className="shrink-0 px-2.5 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:border-indigo-400 hover:text-indigo-300 transition disabled:opacity-40"
              >
                {uploadingCover ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                )}
              </button>
            </div>
            {uploadError && <p className="text-xs text-red-400 mt-1.5">{uploadError}</p>}
            {form.coverImage && (
              <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-lg bg-zinc-800">
                <Image src={form.coverImage} alt="Cover preview" fill className="object-cover" sizes="300px" />
              </div>
            )}
          </div>

          {/* Author */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Author</p>
            <input
              type="text"
              value={form.author}
              onChange={(e) => set('author', e.target.value)}
              placeholder="SNKRS CART"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Tags */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Tags</p>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="Nike, Jordan, Release Guide"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Comma-separated</p>
          </div>

          {/* SEO */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">SEO</p>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Meta Title</label>
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => set('metaTitle', e.target.value)}
                placeholder={form.title ? `${form.title} | SNKRS CART Blog` : 'Auto-generated from title'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Meta Description</label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => set('metaDescription', e.target.value)}
                placeholder="Auto-generated from excerpt"
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Meta Keywords</label>
              <input
                type="text"
                value={form.metaKeywords}
                onChange={(e) => set('metaKeywords', e.target.value)}
                placeholder="sneakers, nike, air jordan, india"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <p className="text-[10px] text-zinc-600 mt-1">Comma-separated keywords for search engines</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-zinc-900 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Publish Post'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/blogs')}
          className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
