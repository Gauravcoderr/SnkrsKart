'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dadulg5bs';
const CLOUDINARY_PRESET = 'admin_uploads';

interface SneakerProfile {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  tagline: string;
  description: string;
  releaseYear: number | null;
  designer: string;
  silhouette: string;
  category: string;
  originalRetailPrice: number | null;
  searchTags: string[];
  relatedSlugs: string[];
  image: string;
  published: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  name: '', brand: '', tagline: '', description: '',
  releaseYear: '', designer: '', silhouette: '', category: '',
  originalRetailPrice: '', searchTags: '', relatedSlugs: '', image: '', published: false,
};

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', 'sneaker-profiles');
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Image upload failed');
  const d = await r.json();
  return d.secure_url as string;
}

export default function AdminSneakerProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<SneakerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProfiles = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${API}/admin/sneaker-profiles`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setProfiles(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  function setF(k: string, v: unknown) { setForm((p) => ({ ...p, [k]: v })); }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(p: SneakerProfile) {
    setEditingId(p._id);
    setForm({
      name: p.name, brand: p.brand, tagline: p.tagline, description: p.description,
      releaseYear: p.releaseYear ? String(p.releaseYear) : '',
      designer: p.designer, silhouette: p.silhouette, category: p.category,
      originalRetailPrice: p.originalRetailPrice ? String(p.originalRetailPrice) : '',
      searchTags: p.searchTags.join(', '),
      relatedSlugs: p.relatedSlugs.join(', '),
      image: p.image, published: p.published,
    });
    setShowForm(true);
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await uploadImage(file);
      setF('image', url);
    } catch {
      setError('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    const payload = {
      ...form,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
      originalRetailPrice: form.originalRetailPrice ? Number(form.originalRetailPrice) : null,
      searchTags: form.searchTags.split(',').map((s) => s.trim()).filter(Boolean),
      relatedSlugs: form.relatedSlugs.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      const url = editingId
        ? `${API}/admin/sneaker-profiles/${editingId}`
        : `${API}/admin/sneaker-profiles`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Save failed'); return; }
      setShowForm(false);
      fetchProfiles();
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const token = localStorage.getItem('admin_token');
    await fetch(`${API}/admin/sneaker-profiles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setProfiles((prev) => prev.filter((p) => p._id !== id));
  }

  async function handleToggle(p: SneakerProfile) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API}/admin/sneaker-profiles/${p._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ published: !p.published }),
    });
    if (res.ok) setProfiles((prev) => prev.map((x) => x._id === p._id ? { ...x, published: !x.published } : x));
  }

  const filtered = profiles.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Sneaker Profiles</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{profiles.length} profiles · powers /sneakers/* pages</p>
        </div>
        <button type="button" onClick={openCreate} className="bg-zinc-100 text-zinc-900 px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors">
          + Add Profile
        </button>
      </div>

      <input
        type="text" placeholder="Search by name or brand…" value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm mb-4 focus:outline-none focus:border-zinc-500"
      />

      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
      {loading ? (
        <div className="text-zinc-500 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Brand</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Year</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-zinc-100">{p.name}</p>
                    <a href={`${SITE}/sneakers/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300">
                      /sneakers/{p.slug}
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-zinc-300">{p.brand}</td>
                  <td className="py-3 pr-4 text-zinc-400 capitalize">{p.category || '—'}</td>
                  <td className="py-3 pr-4 text-zinc-400">{p.releaseYear || '—'}</td>
                  <td className="py-3 pr-4">
                    <button type="button" onClick={() => handleToggle(p)} className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.published ? 'bg-emerald-900 text-emerald-300' : 'bg-zinc-700 text-zinc-400'}`}>
                      {p.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => openEdit(p)} className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors">Edit</button>
                      <button type="button" onClick={() => handleDelete(p._id, p.name)} className="text-xs text-red-500 hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">No profiles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-4 pt-8">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-100">{editingId ? 'Edit' : 'New'} Sneaker Profile</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">✕ Close</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ['Name *', 'name', 'text', 'e.g. Nike Air Force 1'],
                ['Brand *', 'brand', 'text', 'e.g. Nike'],
                ['Tagline', 'tagline', 'text', 'e.g. The court classic'],
                ['Designer', 'designer', 'text', 'e.g. Bruce Kilgore'],
                ['Release Year', 'releaseYear', 'number', 'e.g. 1982'],
                ['Original Retail (USD)', 'originalRetailPrice', 'number', 'e.g. 90'],
              ].map(([label, key, type, placeholder]) => (
                <div key={key as string}>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">{label}</label>
                  <input
                    type={type as string} value={(form as Record<string, unknown>)[key as string] as string}
                    onChange={(e) => setF(key as string, e.target.value)}
                    placeholder={placeholder as string}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Silhouette</label>
                <select value={form.silhouette} onChange={(e) => setF('silhouette', e.target.value)} title="Select silhouette" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500">
                  <option value="">Select…</option>
                  {['Low', 'Mid', 'High', 'Slip-on', 'Platform', 'Slide'].map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setF('category', e.target.value)} title="Select category" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500">
                  <option value="">Select…</option>
                  {['Lifestyle', 'Running', 'Basketball', 'Training', 'Skateboarding', 'Collaboration'].map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Description (sourced from official brand site / Wikipedia)</label>
              <textarea value={form.description} onChange={(e) => setF('description', e.target.value)} rows={5} placeholder="Write from official brand sources, Wikipedia, or your own research…" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Search Tags (comma-separated)</label>
                <input type="text" value={form.searchTags} onChange={(e) => setF('searchTags', e.target.value)} placeholder="air force 1, af1, force 1" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500" />
                <p className="text-[10px] text-zinc-600 mt-1">Used to match your products on the hub page</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Related Model Slugs (comma-separated)</label>
                <input type="text" value={form.relatedSlugs} onChange={(e) => setF('relatedSlugs', e.target.value)} placeholder="nike-dunk-low, nike-air-max-90" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Cover Image</label>
              <div className="flex items-center gap-3">
                <input type="text" value={form.image} onChange={(e) => setF('image', e.target.value)} placeholder="Cloudinary URL or upload below" className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500" />
                <label className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-2 text-xs font-bold transition-colors">
                  {imageUploading ? 'Uploading…' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                </label>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input type="checkbox" id="sp-published" checked={form.published} onChange={(e) => setF('published', e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              <label htmlFor="sp-published" className="text-sm text-zinc-300">Published (visible on /sneakers/)</label>
            </div>

            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-zinc-700 text-sm font-bold text-zinc-400 hover:border-zinc-500 transition-colors">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-[2] py-2.5 bg-zinc-100 text-zinc-900 text-sm font-bold hover:bg-white disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
