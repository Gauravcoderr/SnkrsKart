'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Paginator from '../_components/Paginator';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type Source = 'subscribed' | 'uploaded';

interface Subscriber {
  _id: string;
  email?: string;
  name?: string;
  phone?: string;
  source: Source;
  unsubscribed?: boolean;
  bounced?: boolean;
  createdAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Parse pasted contacts. Accepts CSV/TSV/comma/newline. Detects email vs phone per token.
function parseContacts(text: string): { email?: string; name?: string; phone?: string }[] {
  const emailRe = /[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/;
  const phoneRe = /^\+?\d[\d\s-]{6,}$/;
  const rows: { email?: string; name?: string; phone?: string }[] = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cells = trimmed.split(/[,\t;]/).map((c) => c.trim()).filter(Boolean);
    const row: { email?: string; name?: string; phone?: string } = {};
    for (const cell of cells) {
      if (!row.email && emailRe.test(cell)) { row.email = cell.match(emailRe)![0]; continue; }
      if (!row.phone && phoneRe.test(cell.replace(/\s/g, ''))) { row.phone = cell; continue; }
      if (!row.name) row.name = cell;
    }
    if (row.email || row.phone) rows.push(row);
  }
  return rows;
}

const emptyForm = { name: '', email: '', phone: '' };

export default function NewsletterPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | Source>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // bulk upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // single add / edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // null = add mode
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return null; }
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [router]);

  const fetchSubscribers = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${API}/admin/newsletter`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setSubscribers(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const parsed = parseContacts(uploadText);

  async function handleUpload() {
    if (parsed.length === 0) { setUploadMsg('Nothing to upload — paste emails or phone numbers.'); return; }
    const headers = authHeaders();
    if (!headers) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const res = await fetch(`${API}/admin/newsletter/upload`, {
        method: 'POST', headers, body: JSON.stringify({ contacts: parsed }),
      });
      const data = await res.json();
      if (!res.ok) { setUploadMsg(data.error || `Error ${res.status}`); return; }
      setUploadMsg(`Added ${data.inserted}. Skipped ${data.skipped} (already exist). Invalid ${data.invalid}.`);
      setUploadText('');
      await fetchSubscribers();
    } catch (e: any) {
      setUploadMsg(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setFormErr('');
    setFormOpen(true);
  }

  function openEdit(s: Subscriber) {
    setEditId(s._id);
    setForm({ name: s.name || '', email: s.email || '', phone: s.phone || '' });
    setFormErr('');
    setFormOpen(true);
  }

  async function handleSaveForm() {
    if (!form.email.trim() && !form.phone.trim()) { setFormErr('Enter an email or a phone number.'); return; }
    const headers = authHeaders();
    if (!headers) return;
    setSaving(true);
    setFormErr('');
    try {
      const url = editId ? `${API}/admin/newsletter/${editId}` : `${API}/admin/newsletter`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers,
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFormErr(data.error || `Error ${res.status}`); return; }
      setFormOpen(false);
      await fetchSubscribers();
    } catch (e: any) {
      setFormErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Subscriber) {
    if (!confirm(`Delete ${s.email || s.phone || 'this contact'}?`)) return;
    const headers = authHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`${API}/admin/newsletter/${s._id}`, { method: 'DELETE', headers });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || `Error ${res.status}`); return; }
      await fetchSubscribers();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  }

  const [syncing, setSyncing] = useState(false);
  async function handleSyncUnsubs() {
    const headers = authHeaders();
    if (!headers) return;
    setSyncing(true);
    try {
      const res = await fetch(`${API}/admin/newsletter/sync-unsubscribes`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) { alert(data.error || `Error ${res.status}`); return; }
      alert(`Synced ${data.found} blocked (${data.unsubscribed} unsubscribed, ${data.bounced} bounced). ${data.flagged} flagged, ${data.created} added.`);
      await fetchSubscribers();
    } catch (e: any) {
      alert(e.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  const counts = {
    all: subscribers.length,
    subscribed: subscribers.filter((s) => s.source === 'subscribed').length,
    uploaded: subscribers.filter((s) => s.source === 'uploaded').length,
  };
  const unsubCount = subscribers.filter((s) => s.unsubscribed).length;
  const bouncedCount = subscribers.filter((s) => s.bounced).length;

  const filtered = subscribers.filter((s) => {
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (s.email || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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
        <button type="button" onClick={() => { setError(''); setLoading(true); fetchSubscribers(); }} className="text-xs text-zinc-400 hover:text-white underline">
          Retry
        </button>
      </div>
    );
  }

  const tabs: { key: 'all' | Source; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'subscribed', label: 'Subscribed' },
    { key: 'uploaded', label: 'Uploaded' },
  ];

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20';

  return (
    <div className="text-white">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Newsletter</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Drop-alert signups and uploaded customer contacts.
            {unsubCount > 0 && <span className="text-zinc-500"> · {unsubCount} unsubscribed</span>}
            {bouncedCount > 0 && <span className="text-zinc-500"> · {bouncedCount} bounced</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncUnsubs}
            disabled={syncing}
            className="bg-zinc-800 text-zinc-300 text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-700 transition disabled:opacity-50"
            title="Pull unsubscribes from Brevo and flag them here"
          >
            {syncing ? 'Syncing…' : 'Sync unsubs'}
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="bg-zinc-800 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-700 transition"
          >
            Add contact
          </button>
          <button
            type="button"
            onClick={() => { setUploadOpen(true); setUploadMsg(''); }}
            className="bg-white text-black text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-200 transition"
          >
            Upload contacts
          </button>
        </div>
      </div>

      {/* filter tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setSourceFilter(t.key); setPage(1); }}
            className={`text-xs font-medium rounded-full px-3.5 py-1.5 border transition ${
              sourceFilter === t.key
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {t.label} <span className="opacity-60">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search email, name, or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-80 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <span className="text-sm text-zinc-500">{filtered.length} of {subscribers.length} total</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {paginated.map((s) => (
              <tr key={s._id} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3 text-white">
                  {s.email || <span className="text-zinc-600">— no email —</span>}
                  {s.name && <div className="text-xs text-zinc-500">{s.name}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{s.phone || <span className="text-zinc-600">—</span>}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 ${
                    s.source === 'uploaded'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {s.source === 'uploaded' ? 'Uploaded' : 'Subscribed'}
                  </span>
                  {s.unsubscribed && (
                    <span className="ml-1.5 inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 bg-red-500/15 text-red-400">
                      Unsubscribed
                    </span>
                  )}
                  {s.bounced && (
                    <span className="ml-1.5 inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 bg-zinc-500/15 text-zinc-400">
                      Bounced
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => openEdit(s)} className="text-xs text-zinc-400 hover:text-white underline mr-3">Edit</button>
                  <button type="button" onClick={() => handleDelete(s)} className="text-xs text-red-400/80 hover:text-red-400 underline">Delete</button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  {search || sourceFilter !== 'all' ? 'No contacts match your filters.' : 'No newsletter contacts yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />

      {/* add / edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !saving && setFormOpen(false)}>
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">{editId ? 'Edit contact' : 'Add contact'}</h2>
            <p className="text-sm text-zinc-400 mt-1">Email or phone required. Both is best.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" className={inputCls} />
              </div>
            </div>
            {formErr && <p className="text-xs text-red-400 mt-3">{formErr}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="text-sm text-zinc-400 hover:text-white px-4 py-2 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleSaveForm} disabled={saving} className="bg-white text-black text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-200 transition disabled:opacity-50">
                {saving ? 'Saving…' : editId ? 'Save changes' : 'Add contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* bulk upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">Upload customer contacts</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Paste one contact per line. Email and/or phone. Optional name.
              Comma, tab, or semicolon separated. Duplicates skipped automatically.
            </p>
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              rows={8}
              placeholder={`Rohit Sethi, rohitsethi267@gmail.com, 9888566587\nRajneesh Wagh, , 9321805200\nakshathreddy65@gmail.com`}
              className="mt-3 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-zinc-500">{parsed.length} contact{parsed.length === 1 ? '' : 's'} detected</span>
              {uploadMsg && <span className="text-xs text-zinc-300">{uploadMsg}</span>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setUploadOpen(false)} disabled={uploading} className="text-sm text-zinc-400 hover:text-white px-4 py-2 disabled:opacity-50">Close</button>
              <button type="button" onClick={handleUpload} disabled={uploading || parsed.length === 0} className="bg-white text-black text-sm font-semibold rounded-lg px-4 py-2 hover:bg-zinc-200 transition disabled:opacity-50">
                {uploading ? 'Uploading…' : `Upload ${parsed.length || ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
