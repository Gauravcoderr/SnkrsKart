'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dadulg5bs';
const CLOUDINARY_PRESET = 'admin_uploads';

interface Drop {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  releaseDate: string;
  retailPrice: number | null;
  image: string;
  description: string;
  where: string;
  availableAtStore: boolean;
  productSlug: string;
  published: boolean;
}

const EMPTY_FORM = {
  name: '', brand: '', colorway: '', releaseDate: '', retailPrice: '',
  image: '', description: '', where: '', availableAtStore: false, productSlug: '', published: false,
};

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', 'drops');
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error('Upload failed');
  return (await r.json()).secure_url as string;
}

export default function AdminDropsPage() {
  const router = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const fetchDrops = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${API}/admin/drops`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setDrops(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchDrops(); }, [fetchDrops]);

  function setF(k: string, v: unknown) { setForm((p) => ({ ...p, [k]: v })); }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(d: Drop) {
    setEditingId(d._id);
    setForm({
      name: d.name, brand: d.brand, colorway: d.colorway,
      releaseDate: d.releaseDate ? d.releaseDate.slice(0, 10) : '',
      retailPrice: d.retailPrice ? String(d.retailPrice) : '',
      image: d.image, description: d.description, where: d.where,
      availableAtStore: d.availableAtStore, productSlug: d.productSlug, published: d.published,
    });
    setShowForm(true);
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try { setF('image', await uploadImage(file)); }
    catch { setError('Image upload failed'); }
    finally { setImageUploading(false); }
  }

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    const payload = { ...form, retailPrice: form.retailPrice ? Number(form.retailPrice) : null };
    try {
      const url = editingId ? `${API}/admin/drops/${editingId}` : `${API}/admin/drops`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Save failed'); return; }
      setShowForm(false);
      fetchDrops();
    } catch { setError('Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const token = localStorage.getItem('admin_token');
    await fetch(`${API}/admin/drops/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDrops((prev) => prev.filter((d) => d._id !== id));
  }

  async function handleToggle(d: Drop) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API}/admin/drops/${d._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ published: !d.published }),
    });
    if (res.ok) setDrops((prev) => prev.map((x) => x._id === d._id ? { ...x, published: !x.published } : x));
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const now = new Date();
  const upcoming = drops.filter((d) => new Date(d.releaseDate) >= now);
  const past = drops.filter((d) => new Date(d.releaseDate) < now);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Drop Calendar</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{upcoming.length} upcoming · {past.length} past · powers /drops/* pages</p>
        </div>
        <button type="button" onClick={openCreate} className="bg-zinc-100 text-zinc-900 px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors">
          + Add Drop
        </button>
      </div>

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
                <th className="pb-3 pr-4">Release Date</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Where</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...upcoming, ...past].map((d) => (
                <tr key={d._id} className={`border-b border-zinc-800 transition-colors ${new Date(d.releaseDate) < now ? 'opacity-50' : 'hover:bg-zinc-800/40'}`}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-zinc-100">{d.name}</p>
                    <a href={`${SITE}/drops/${d.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300">
                      /drops/{d.slug}
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-zinc-300">{d.brand}</td>
                  <td className="py-3 pr-4 text-zinc-300">{formatDate(d.releaseDate)}</td>
                  <td className="py-3 pr-4 text-zinc-400">{d.retailPrice ? `₹${d.retailPrice.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="py-3 pr-4 text-zinc-400 text-xs">{d.where || '—'}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => handleToggle(d)} className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.published ? 'bg-emerald-900 text-emerald-300' : 'bg-zinc-700 text-zinc-400'}`}>
                        {d.published ? 'Published' : 'Draft'}
                      </button>
                      {d.availableAtStore && <span className="text-[10px] text-amber-400 font-bold">In Store</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => openEdit(d)} className="text-xs text-zinc-400 hover:text-zinc-100">Edit</button>
                      <button type="button" onClick={() => handleDelete(d._id, d.name)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {drops.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-500 text-sm">No drops yet — add upcoming releases from official brand announcements</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-4 pt-8">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-100">{editingId ? 'Edit' : 'New'} Drop</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">✕ Close</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ['Name *', 'name', 'text', 'e.g. Nike Dunk Low Panda 2025'],
                ['Brand *', 'brand', 'text', 'e.g. Nike'],
                ['Colorway', 'colorway', 'text', 'e.g. White/Black'],
                ['Retail Price (₹)', 'retailPrice', 'number', 'e.g. 8495'],
                ['Where', 'where', 'text', 'e.g. Nike SNKRS App'],
                ['Product Slug (if in store)', 'productSlug', 'text', 'e.g. nike-dunk-low-panda'],
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
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Release Date *</label>
                <input type="date" value={form.releaseDate} onChange={(e) => setF('releaseDate', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500" />
                <p className="text-[10px] text-zinc-600 mt-1">From official brand announcement only</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Description (1–2 sentences from official announcement)</label>
              <textarea value={form.description} onChange={(e) => setF('description', e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 resize-none" />
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Cover Image</label>
              <div className="flex items-center gap-3">
                <input type="text" value={form.image} onChange={(e) => setF('image', e.target.value)} placeholder="Cloudinary URL or upload" className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500" />
                <label className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-2 text-xs font-bold transition-colors">
                  {imageUploading ? 'Uploading…' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="drop-store" checked={form.availableAtStore} onChange={(e) => setF('availableAtStore', e.target.checked)} className="w-4 h-4 accent-amber-500" />
                <label htmlFor="drop-store" className="text-sm text-zinc-300">Available at SNKRS CART</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="drop-published" checked={form.published} onChange={(e) => setF('published', e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                <label htmlFor="drop-published" className="text-sm text-zinc-300">Published</label>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-zinc-700 text-sm font-bold text-zinc-400 hover:border-zinc-500">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-[2] py-2.5 bg-zinc-100 text-zinc-900 text-sm font-bold hover:bg-white disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Drop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
