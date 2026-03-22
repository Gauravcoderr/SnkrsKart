'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Paginator from '../_components/Paginator';
import { uploadImage } from '@/lib/uploadImage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PAGE_SIZE = 10;

interface Banner {
  _id: string;
  brand: string;
  tag: string;
  headline: string[];
  sub: string;
  cta: string;
  href: string;
  image: string;
  accent: string;
  bg: string;
  imgBg: string;
  order: number;
  active: boolean;
}

type BannerForm = Omit<Banner, '_id'>;

const EMPTY_FORM: BannerForm = {
  brand: '', tag: '', headline: [''], sub: '', cta: '', href: '',
  image: '', accent: '#ffffff', bg: '#0a0a0a', imgBg: '#1a1a1a',
  order: 0, active: true,
};

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; form: BannerForm; id?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadImage(file, 'products');
      setField('image', url);
    } catch (e: any) {
      setUploadError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const getToken = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return null; }
    return token;
  }, [router]);

  const fetchBanners = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/banners`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      setBanners(await res.json());
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  function openCreate() {
    setSaveError('');
    setModal({ mode: 'create', form: { ...EMPTY_FORM } });
  }

  function openEdit(b: Banner) {
    setSaveError('');
    const { _id, ...rest } = b;
    setModal({ mode: 'edit', form: { ...rest }, id: _id });
  }

  async function handleSave() {
    if (!modal) return;
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setSaveError('');
    try {
      const url = modal.mode === 'edit'
        ? `${API}/admin/banners/${modal.id}`
        : `${API}/admin/banners`;
      const res = await fetch(url, {
        method: modal.mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(modal.form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      setModal(null);
      fetchBanners();
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
      await fetch(`${API}/admin/banners/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      fetchBanners();
    } finally {
      setDeleting(false);
    }
  }

  function setField<K extends keyof BannerForm>(key: K, value: BannerForm[K]) {
    if (!modal) return;
    setModal({ ...modal, form: { ...modal.form, [key]: value } });
  }

  const totalPages = Math.max(1, Math.ceil(banners.length / pageSize));
  const paginated = banners.slice((page - 1) * pageSize, page * pageSize);

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
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-500">{banners.length} banners</span>
        <button
          type="button"
          onClick={openCreate}
          className="bg-white text-zinc-900 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-zinc-200 transition"
        >
          + Add Banner
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Preview</th>
              <th className="px-4 py-3 font-medium">Brand / Tag</th>
              <th className="px-4 py-3 font-medium">Headline</th>
              <th className="px-4 py-3 font-medium">CTA</th>
              <th className="px-4 py-3 font-medium">Colors</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {paginated.map((b) => (
              <tr key={b._id} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3">
                  <div
                    className="w-16 h-10 rounded-md overflow-hidden flex items-center justify-center"
                    style={{ background: b.bg }}
                  >
                    {b.image ? (
                      <img src={b.image} alt={b.brand} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-zinc-500">No img</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{b.brand}</div>
                  <div className="text-xs text-zinc-500">{b.tag}</div>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="text-white truncate">{b.headline.join(' ')}</p>
                  <p className="text-xs text-zinc-500 truncate">{b.sub}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{ color: b.accent, background: `${b.accent}22` }}
                  >
                    {b.cta}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <ColorDot color={b.accent} title="Accent" />
                    <ColorDot color={b.bg} title="Background" />
                    <ColorDot color={b.imgBg} title="Image BG" />
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{b.order}</td>
                <td className="px-4 py-3">
                  {b.active
                    ? <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Active</span>
                    : <span className="text-[11px] bg-zinc-700/40 text-zinc-500 px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(b)}
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
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">No banners yet. Add one!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} totalItems={banners.length} />

      {/* Edit / Create Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <h2 className="text-base font-bold text-white">
                {modal.mode === 'create' ? 'Add Banner' : 'Edit Banner'}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModal(null)}
                className="text-zinc-500 hover:text-white transition"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Brand">
                  <input id="b-brand" type="text" value={modal.form.brand} onChange={(e) => setField('brand', e.target.value)}
                    className={inputCls} placeholder="e.g. Nike" />
                </Field>
                <Field label="Tag">
                  <input id="b-tag" type="text" value={modal.form.tag} onChange={(e) => setField('tag', e.target.value)}
                    className={inputCls} placeholder="e.g. NEW COLLECTION" />
                </Field>
              </div>

              <Field label="Headline Lines">
                <div className="space-y-2">
                  {modal.form.headline.map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={line}
                        onChange={(e) => {
                          const updated = [...modal.form.headline];
                          updated[i] = e.target.value;
                          setField('headline', updated);
                        }}
                        placeholder={`Line ${i + 1}`}
                        className={`${inputCls} flex-1`}
                      />
                      {modal.form.headline.length > 1 && (
                        <button type="button" onClick={() => setField('headline', modal.form.headline.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-300 px-2.5 rounded-lg hover:bg-red-500/10 transition text-xs">
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setField('headline', [...modal.form.headline, ''])}
                    className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition">
                    + Add Line
                  </button>
                </div>
              </Field>

              <Field label="Sub-heading">
                <input id="b-sub" type="text" value={modal.form.sub} onChange={(e) => setField('sub', e.target.value)}
                  className={inputCls} placeholder="Short sub-heading text" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="CTA Button Text">
                  <input id="b-cta" type="text" value={modal.form.cta} onChange={(e) => setField('cta', e.target.value)}
                    className={inputCls} placeholder="e.g. Shop Now" />
                </Field>
                <Field label="CTA Link (href)">
                  <input id="b-href" type="text" value={modal.form.href} onChange={(e) => setField('href', e.target.value)}
                    className={inputCls} placeholder="/products?brand=Nike" />
                </Field>
              </div>

              <Field label="Image">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modal.form.image}
                    onChange={(e) => setField('image', e.target.value)}
                    className={`${inputCls} flex-1`}
                    placeholder="https://... or upload →"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="shrink-0 px-3.5 py-2.5 text-sm font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition whitespace-nowrap"
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload banner image"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
                  />
                </div>
                {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
              </Field>

              {/* Colors */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-widest">Colors</p>
                <div className="grid grid-cols-3 gap-4">
                  <ColorField label="Accent (text/button)" value={modal.form.accent} onChange={(v) => setField('accent', v)} />
                  <ColorField label="Background" value={modal.form.bg} onChange={(v) => setField('bg', v)} />
                  <ColorField label="Image Background" value={modal.form.imgBg} onChange={(v) => setField('imgBg', v)} />
                </div>
              </div>

              {/* Color preview */}
              <div className="rounded-lg overflow-hidden border border-zinc-800" style={{ background: modal.form.bg }}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: modal.form.accent }}>
                      {modal.form.tag || 'TAG'}
                    </p>
                    <p className="font-bold text-lg leading-tight" style={{ color: modal.form.accent }}>
                      {modal.form.headline.join(' ') || 'Headline'}
                    </p>
                    <p className="text-xs mt-1 opacity-70" style={{ color: modal.form.accent }}>{modal.form.sub || 'Sub-heading'}</p>
                    <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded"
                      style={{ background: modal.form.accent, color: modal.form.bg }}>
                      {modal.form.cta || 'Shop Now'}
                    </span>
                  </div>
                  {modal.form.image && (
                    <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: modal.form.imgBg }}>
                      <img src={modal.form.image} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Order (sort position)">
                  <input id="b-order" type="number" value={modal.form.order} onChange={(e) => setField('order', Number(e.target.value))}
                    className={inputCls} />
                </Field>
                <Field label="Status">
                  <div className="flex items-center gap-3 h-10">
                    <button
                      type="button"
                      onClick={() => setField('active', !modal.form.active)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${modal.form.active ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${modal.form.active ? 'left-5' : 'left-1'}`} />
                    </button>
                    <span className="text-sm text-zinc-400">{modal.form.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </Field>
              </div>

              {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
              <button type="button" onClick={() => setModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:text-white hover:border-zinc-500 transition">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition">
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Create Banner' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-2">Delete Banner?</h2>
            <p className="text-sm text-zinc-400 mb-6">
              <span className="text-white font-medium">{deleteTarget.brand}</span> — {deleteTarget.tag}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:text-white hover:border-zinc-500 transition">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-0.5"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label={`${label} hex`}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function ColorDot({ color, title }: { color: string; title: string }) {
  return (
    <div
      className="w-5 h-5 rounded-full border border-zinc-700 shrink-0"
      style={{ background: color }}
      title={`${title}: ${color}`}
    />
  );
}
