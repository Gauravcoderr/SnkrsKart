'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Paginator from '../_components/Paginator';
import ConfirmModal from '../_components/ConfirmModal';
import AdminLoader from '@/app/admin/_components/AdminLoader';
import { useAdminToast } from '@/app/admin/_components/AdminToast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

const CAPTION_MAX = 2200;
const HASHTAG_MAX = 5;
const FEED_PREVIEW = 125;

type Status = 'draft' | 'approved' | 'publishing' | 'published' | 'failed' | 'rejected';
type Kind = 'IMAGE' | 'CAROUSEL' | 'REELS' | 'STORIES';

interface Media { url: string; type: 'IMAGE' | 'VIDEO'; altText?: string }

interface IgPost {
  _id: string;
  kind: Kind;
  caption: string;
  media: Media[];
  coverUrl?: string;
  status: Status;
  scheduledAt: string | null;
  source: { kind: 'drop' | 'blog' | 'sneaker' | 'manual'; slug: string };
  notes?: string;
  attempts: number;
  error?: string;
  permalink?: string;
  dryRun?: boolean;
  approvedBy?: string;
  publishedAt?: string | null;
  createdAt: string;
}

interface IgStatus {
  enabled: boolean;
  dryRun: boolean;
  login: string;
  apiVersion: string;
  igUserId: string;
  token: { refreshable: boolean; expiresAt: string | null; lastError: string };
  quota: { used: number; total: number } | null;
  quotaError: string;
  counts: Record<Status, number>;
}

const TABS: { key: Status | 'all'; label: string }[] = [
  { key: 'draft', label: 'Drafts' },
  { key: 'approved', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
  { key: 'failed', label: 'Failed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const STATUS_STYLE: Record<Status, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  approved: 'bg-sky-900 text-sky-300',
  publishing: 'bg-amber-900 text-amber-300',
  published: 'bg-emerald-900 text-emerald-300',
  failed: 'bg-red-900 text-red-300',
  rejected: 'bg-zinc-800 text-zinc-500',
};

const hashtagCount = (c: string) => (c.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length;

function fmtIST(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + ' IST';
}

// datetime-local works in the admin's browser time (IST for us).
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sourceHref(s: IgPost['source']): string | null {
  if (!s.slug || s.kind === 'manual') return null;
  const base = s.kind === 'blog' ? 'blogs' : s.kind === 'drop' ? 'drops' : 'sneakers';
  return `${SITE}/${base}/${s.slug}`;
}

function CarouselPreview({ media }: { media: Media[] }) {
  const [i, setI] = useState(0);
  const m = media[Math.min(i, media.length - 1)];
  if (!m) return <div className="aspect-[4/5] bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">No media</div>;
  return (
    <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
      {m.type === 'VIDEO' ? (
        <video src={m.url} controls className="w-full h-full object-contain" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.url} alt={m.altText || ''} className="w-full h-full object-contain" />
      )}
      {media.length > 1 && (
        <>
          <button type="button" onClick={() => setI((p) => Math.max(0, p - 1))} disabled={i === 0} aria-label="Previous slide" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white disabled:opacity-20">‹</button>
          <button type="button" onClick={() => setI((p) => Math.min(media.length - 1, p + 1))} disabled={i === media.length - 1} aria-label="Next slide" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white disabled:opacity-20">›</button>
          <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded">{i + 1}/{media.length}</span>
        </>
      )}
    </div>
  );
}

function CaptionMeter({ caption }: { caption: string }) {
  const tags = hashtagCount(caption);
  const preview = caption.length > FEED_PREVIEW ? caption.slice(0, FEED_PREVIEW) : caption;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-3 text-[10px] font-bold tracking-widest uppercase">
        <span className={caption.length > CAPTION_MAX ? 'text-red-400' : 'text-zinc-500'}>{caption.length}/{CAPTION_MAX} chars</span>
        <span className={tags > HASHTAG_MAX ? 'text-red-400' : 'text-zinc-500'}>{tags}/{HASHTAG_MAX} hashtags</span>
        {/\{\{[^}]*\}\}/.test(caption) && <span className="text-red-400">has a {'{{placeholder}}'}</span>}
        {/\u2014/.test(caption) && <span className="text-red-400">em dash</span>}
      </div>
      <div className="border border-zinc-700 bg-zinc-950 p-3">
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-600 mb-1">What the feed shows</p>
        <p className="text-sm text-zinc-200 whitespace-pre-line break-words">
          {preview}
          {caption.length > FEED_PREVIEW && <span className="text-zinc-500"> ... more</span>}
        </p>
      </div>
    </div>
  );
}

export default function AdminInstagramPage() {
  const router = useRouter();
  const toast = useAdminToast();
  const [tab, setTab] = useState<Status | 'all'>('draft');
  const [posts, setPosts] = useState<IgPost[]>([]);
  const [status, setStatus] = useState<IgStatus | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<IgPost | null>(null);
  const [approving, setApproving] = useState<IgPost | null>(null);
  const [approveAt, setApproveAt] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<IgPost | null>(null);

  const authFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); throw new Error('Not logged in'); }
    const res = await fetch(`${API}/admin/instagram${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    });
    if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); throw new Error('Session expired'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    return data;
  }, [router]);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (tab !== 'all') q.set('status', tab);
      const [list, st] = await Promise.all([authFetch(`?${q}`), authFetch('/status')]);
      setPosts(list.posts);
      setTotal(list.total);
      setTotalPages(list.totalPages);
      setStatus(st);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, pageSize, tab, toast]);

  useEffect(() => { load(); }, [load]);

  async function act(post: IgPost, path: string, body?: unknown, success = 'Done') {
    setBusyId(post._id);
    try {
      const data = await authFetch(`/${post._id}${path}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      if (data.queued) toast('Queued: video posts publish on the next 5-minute run');
      else if (data.post?.status === 'failed') toast(data.post.error || 'Publishing failed', 'error');
      else toast(success);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusyId(editing._id);
    try {
      await authFetch(`/${editing._id}`, {
        method: 'PUT',
        body: JSON.stringify({ caption: editing.caption, media: editing.media, scheduledAt: editing.scheduledAt, notes: editing.notes }),
      });
      toast('Saved. Edited posts go back to draft until approved again');
      setEditing(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    setBusyId(confirmDelete._id);
    try {
      await authFetch(`/${confirmDelete._id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function runDue() {
    try {
      const r = await authFetch('/run-due', { method: 'POST' });
      toast(r.skipped ? `Skipped: ${r.skipped}` : `Published ${r.published}, not published ${r.notPublished}`);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Run failed', 'error');
    }
  }

  function moveMedia(i: number, dir: -1 | 1) {
    if (!editing) return;
    const j = i + dir;
    if (j < 0 || j >= editing.media.length) return;
    const next = [...editing.media];
    [next[i], next[j]] = [next[j], next[i]];
    setEditing({ ...editing, media: next });
  }

  const tokenDays = status?.token.expiresAt ? Math.floor((new Date(status.token.expiresAt).getTime() - Date.now()) / 86_400_000) : null;
  const btn = 'text-xs font-bold px-3 py-1.5 border transition-colors disabled:opacity-40';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Instagram</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Drafts from the /drop, /blog and /sneaker pipelines. Nothing posts until it is approved here.</p>
        </div>
        <button type="button" onClick={runDue} disabled={!status?.enabled} className="bg-zinc-100 text-zinc-900 px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-white disabled:opacity-40">
          Run due posts now
        </button>
      </div>

      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="border border-zinc-800 p-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Publisher</p>
            <p className={`text-sm font-bold mt-1 ${status.enabled ? (status.dryRun ? 'text-amber-400' : 'text-emerald-400') : 'text-red-400'}`}>
              {status.enabled ? (status.dryRun ? 'Dry run' : 'Live') : 'Not configured'}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{status.login} login · {status.apiVersion}</p>
          </div>
          <div className="border border-zinc-800 p-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Token</p>
            <p className={`text-sm font-bold mt-1 ${tokenDays !== null && tokenDays < 10 ? 'text-red-400' : 'text-zinc-200'}`}>
              {tokenDays !== null ? `${tokenDays} days left` : status.token.refreshable ? 'Refreshes daily' : 'Manual'}
            </p>
            {status.token.lastError && <p className="text-[10px] text-red-400 mt-0.5 break-words">{status.token.lastError}</p>}
          </div>
          <div className="border border-zinc-800 p-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Posts today</p>
            <p className="text-sm font-bold mt-1 text-zinc-200">{status.quota ? `${status.quota.used} / ${status.quota.total}` : 'n/a'}</p>
            {status.quotaError && <p className="text-[10px] text-red-400 mt-0.5 break-words">{status.quotaError}</p>}
          </div>
          <div className="border border-zinc-800 p-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Queue</p>
            <p className="text-sm font-bold mt-1 text-zinc-200">{status.counts.draft} drafts · {status.counts.approved} scheduled</p>
            {status.counts.failed > 0 && <p className="text-[10px] text-red-400 mt-0.5">{status.counts.failed} failed</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => { setTab(t.key); setPage(1); setLoading(true); }}
            className={`text-xs font-bold px-3 py-1.5 border ${tab === t.key ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
          >
            {t.label}{t.key !== 'all' && status ? ` (${status.counts[t.key]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <AdminLoader className="h-40" />
      ) : posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">Nothing here. Run /drop, /blog or /sneaker and say yes to the Instagram step.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((p) => {
            const href = sourceHref(p.source);
            const busy = busyId === p._id;
            return (
              <article key={p._id} className="border border-zinc-800 bg-zinc-900 flex flex-col">
                <CarouselPreview media={p.media} />
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_STYLE[p.status]}`}>{p.status === 'approved' ? 'scheduled' : p.status}{p.dryRun ? ' (dry run)' : ''}</span>
                    <span className="text-[10px] font-bold text-zinc-500">{p.kind} · {p.media.length}</span>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300 truncate">{p.source.kind}/{p.source.slug}</a>
                    ) : (
                      <span className="text-[10px] text-zinc-600 truncate">{p.source.slug || 'manual'}</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-line break-words line-clamp-4">{p.caption || <span className="text-zinc-600">No caption</span>}</p>
                  {p.status === 'approved' && <p className="text-xs text-sky-300">{p.scheduledAt ? `Posts ${fmtIST(p.scheduledAt)}` : 'Posts on the next run'}</p>}
                  {p.status === 'published' && (
                    <p className="text-xs text-emerald-300">
                      Posted {fmtIST(p.publishedAt)}{' '}
                      {p.permalink && <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="underline">View</a>}
                    </p>
                  )}
                  {p.error && <p className="text-xs text-red-400 break-words">{p.error}</p>}
                  <div className="mt-auto pt-2 flex flex-wrap gap-2">
                    {(p.status === 'draft' || p.status === 'approved' || p.status === 'failed' || p.status === 'rejected') && (
                      <button type="button" disabled={busy} onClick={() => setEditing({ ...p, media: [...p.media] })} className={`${btn} border-zinc-700 text-zinc-300 hover:border-zinc-500`}>Edit</button>
                    )}
                    {p.status === 'draft' && (
                      <button type="button" disabled={busy} onClick={() => { setApproving(p); setApproveAt(toLocalInput(p.scheduledAt)); }} className={`${btn} border-sky-700 text-sky-300 hover:border-sky-500`}>Approve</button>
                    )}
                    {(p.status === 'draft' || p.status === 'approved') && (
                      <button type="button" disabled={busy || !status?.enabled} onClick={() => act(p, '/publish-now', undefined, 'Published')} className={`${btn} border-emerald-700 text-emerald-300 hover:border-emerald-500`}>Publish now</button>
                    )}
                    {p.status === 'approved' && (
                      <button type="button" disabled={busy} onClick={() => act(p, '/unapprove', undefined, 'Back to draft')} className={`${btn} border-zinc-700 text-zinc-400 hover:border-zinc-500`}>Unschedule</button>
                    )}
                    {p.status === 'failed' && (
                      <button type="button" disabled={busy} onClick={() => act(p, '/retry', undefined, 'Queued again')} className={`${btn} border-amber-700 text-amber-300 hover:border-amber-500`}>Retry</button>
                    )}
                    {p.status === 'rejected' && (
                      <button type="button" disabled={busy} onClick={() => act(p, '/reopen', undefined, 'Back to draft')} className={`${btn} border-zinc-700 text-zinc-300 hover:border-zinc-500`}>Reopen</button>
                    )}
                    {(p.status === 'draft' || p.status === 'approved' || p.status === 'failed') && (
                      <button type="button" disabled={busy} onClick={() => act(p, '/reject', undefined, 'Rejected')} className={`${btn} border-zinc-800 text-zinc-500 hover:border-zinc-600`}>Reject</button>
                    )}
                    {p.status !== 'publishing' && (
                      <button type="button" disabled={busy} onClick={() => setConfirmDelete(p)} className="text-xs text-red-500 hover:text-red-400 px-1">Delete</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Paginator
        page={page}
        totalPages={totalPages}
        onPage={(n) => setPage(n)}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={total}
      />

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto p-4 pt-8">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl rounded-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-zinc-100">Edit {editing.kind.toLowerCase()}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-zinc-500 hover:text-zinc-300 text-xs">✕ Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <CarouselPreview media={editing.media} />
                <div className="mt-3 space-y-2">
                  {editing.media.map((m, i) => (
                    <div key={`${m.url}-${i}`} className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 w-5">{i + 1}</span>
                      <input
                        value={m.altText || ''}
                        onChange={(e) => setEditing({ ...editing, media: editing.media.map((x, j) => (j === i ? { ...x, altText: e.target.value } : x)) })}
                        placeholder="Alt text (what is in the picture)"
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 px-2 py-1 text-xs focus:outline-none focus:border-zinc-500"
                      />
                      <button type="button" onClick={() => moveMedia(i, -1)} disabled={i === 0} aria-label="Move up" className="text-xs text-zinc-400 disabled:opacity-30 px-1">▲</button>
                      <button type="button" onClick={() => moveMedia(i, 1)} disabled={i === editing.media.length - 1} aria-label="Move down" className="text-xs text-zinc-400 disabled:opacity-30 px-1">▼</button>
                      <button type="button" onClick={() => setEditing({ ...editing, media: editing.media.filter((_, j) => j !== i) })} aria-label="Remove" className="text-xs text-red-400 px-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Caption</label>
                <textarea
                  value={editing.caption}
                  onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                  rows={12}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                />
                <CaptionMeter caption={editing.caption} />
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mt-4 mb-1">Post at (IST, empty = next run after approval)</label>
                <input
                  type="datetime-local"
                  value={toLocalInput(editing.scheduledAt)}
                  onChange={(e) => setEditing({ ...editing, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                />
                {editing.notes && <p className="text-[11px] text-zinc-500 mt-3 whitespace-pre-line">{editing.notes}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-zinc-700 text-sm font-bold text-zinc-400 hover:border-zinc-500">Cancel</button>
              <button type="button" onClick={saveEdit} disabled={busyId === editing._id} className="flex-[2] py-2.5 bg-zinc-100 text-zinc-900 text-sm font-bold hover:bg-white disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {approving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setApproving(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Approve for Instagram</h3>
            <p className="text-sm text-zinc-400 mb-4">Pick when it goes out (IST). Leave empty to post on the next 5-minute run.</p>
            <input type="datetime-local" value={approveAt} onChange={(e) => setApproveAt(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-500" />
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => setApproving(null)} className="text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">Cancel</button>
              <button
                type="button"
                disabled={busyId === approving._id}
                onClick={async () => {
                  const p = approving;
                  setApproving(null);
                  await act(p, '/approve', { scheduledAt: approveAt ? new Date(approveAt).toISOString() : null }, approveAt ? 'Scheduled' : 'Approved, posts on the next run');
                }}
                className="text-sm px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete this record"
          message={confirmDelete.status === 'published' ? 'This removes the record here only. The post stays on Instagram.' : 'This cannot be undone.'}
          highlight={confirmDelete.caption.slice(0, 80)}
          busy={busyId === confirmDelete._id}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
