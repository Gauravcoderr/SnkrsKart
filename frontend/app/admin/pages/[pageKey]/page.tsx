'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface FaqItem { q: string; a: string; }

interface SiteContent {
  pageKey: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  htmlContent: string;
  faqItems: FaqItem[];
}

const CONTENT_PAGES = new Set(['faq', 'privacy', 'about', 'terms', 'shipping', 'returns']);
const FAQ_PAGE = 'faq';

const EMPTY: SiteContent = {
  pageKey: '', label: '',
  metaTitle: '', metaDescription: '', metaKeywords: '',
  ogTitle: '', ogDescription: '', htmlContent: '', faqItems: [],
};

type Tab = 'meta' | 'content';

export default function EditPageContent() {
  const params = useParams();
  const router = useRouter();
  const pageKey = params.pageKey as string;

  const [data, setData] = useState<SiteContent>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('meta');

  const hasContent = CONTENT_PAGES.has(pageKey);
  const isFaq = pageKey === FAQ_PAGE;

  const load = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/admin/site-content/${pageKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData({ ...EMPTY, ...json });
    } catch {
      setError('Failed to load page data.');
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    setError('');
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API}/admin/site-content/${pageKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function setField(field: keyof SiteContent, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function setFaqItem(i: number, field: 'q' | 'a', value: string) {
    setData((prev) => {
      const items = [...prev.faqItems];
      items[i] = { ...items[i], [field]: value };
      return { ...prev, faqItems: items };
    });
  }

  function addFaqItem() {
    setData((prev) => ({ ...prev, faqItems: [...prev.faqItems, { q: '', a: '' }] }));
  }

  function removeFaqItem(i: number) {
    setData((prev) => ({ ...prev, faqItems: prev.faqItems.filter((_, idx) => idx !== i) }));
  }

  function moveFaqItem(i: number, dir: -1 | 1) {
    setData((prev) => {
      const items = [...prev.faqItems];
      const j = i + dir;
      if (j < 0 || j >= items.length) return prev;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...prev, faqItems: items };
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/pages')}
            className="text-xs text-zinc-500 hover:text-white mb-1 flex items-center gap-1 transition-colors"
          >
            ← Pages &amp; SEO
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">{data.label}</h1>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-white text-zinc-900 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-zinc-100 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      {hasContent && (
        <div className="flex gap-1 mb-6 border-b border-zinc-800">
          {(['meta', 'content'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'meta' ? 'Metadata & SEO' : isFaq ? 'FAQ Items' : 'Page Content'}
            </button>
          ))}
        </div>
      )}

      {/* Metadata tab */}
      {(tab === 'meta' || !hasContent) && (
        <div className="space-y-5">
          <Section title="Page Title & Description">
            <Field
              label="Meta Title"
              hint="Shown in browser tab + Google results. ~55 chars max."
              value={data.metaTitle}
              onChange={(v) => setField('metaTitle', v)}
              maxLength={120}
            />
            <Field
              label="Meta Description"
              hint="Google snippet. ~155 chars max."
              value={data.metaDescription}
              onChange={(v) => setField('metaDescription', v)}
              textarea
              maxLength={300}
            />
            <Field
              label="Keywords"
              hint="Comma-separated. Optional."
              value={data.metaKeywords}
              onChange={(v) => setField('metaKeywords', v)}
            />
          </Section>

          <Section title="Open Graph (Social Preview)">
            <Field
              label="OG Title"
              hint="Title shown when shared on social media. Defaults to Meta Title if empty."
              value={data.ogTitle}
              onChange={(v) => setField('ogTitle', v)}
            />
            <Field
              label="OG Description"
              hint="Description shown when shared. Defaults to Meta Description if empty."
              value={data.ogDescription}
              onChange={(v) => setField('ogDescription', v)}
              textarea
            />
          </Section>
        </div>
      )}

      {/* Content tab */}
      {tab === 'content' && hasContent && (
        <div>
          {isFaq ? (
            <FaqEditor
              items={data.faqItems}
              onAdd={addFaqItem}
              onRemove={removeFaqItem}
              onChange={setFaqItem}
              onMove={moveFaqItem}
            />
          ) : (
            <HtmlEditor
              value={data.htmlContent}
              onChange={(v) => setField('htmlContent', v)}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-800 rounded-xl p-5 space-y-4">
      <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function Field({
  label, hint, value, onChange, textarea, maxLength,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; textarea?: boolean; maxLength?: number;
}) {
  const base =
    'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none';
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-1">{label}</label>
      {hint && <p className="text-[11px] text-zinc-600 mb-1.5">{hint}</p>}
      {textarea ? (
        <textarea
          rows={3}
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      ) : (
        <input
          type="text"
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      )}
      {maxLength && value.length > 0 && (
        <p className={`text-[11px] mt-1 text-right ${value.length > maxLength * 0.9 ? 'text-amber-500' : 'text-zinc-600'}`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

function FaqEditor({
  items, onAdd, onRemove, onChange, onMove,
}: {
  items: FaqItem[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: 'q' | 'a', value: string) => void;
  onMove: (i: number, dir: -1 | 1) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{items.length} Question{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-bold bg-white text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          + Add Question
        </button>
      </div>

      {items.length === 0 && (
        <div className="border border-dashed border-zinc-700 rounded-xl p-10 text-center text-zinc-600 text-sm">
          No FAQ items yet. Click "Add Question" to start.
        </div>
      )}

      {items.map((item, i) => (
        <div key={i} className="border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-zinc-600 tracking-widest uppercase">Q {i + 1}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onMove(i, -1)}
                disabled={i === 0}
                className="p-1 rounded text-zinc-600 hover:text-white disabled:opacity-30 transition-colors"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => onMove(i, 1)}
                disabled={i === items.length - 1}
                className="p-1 rounded text-zinc-600 hover:text-white disabled:opacity-30 transition-colors"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => onRemove(i)}
                className="p-1 rounded text-red-600 hover:text-red-400 transition-colors ml-1"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Question…"
            value={item.q}
            onChange={(e) => onChange(i, 'q', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <textarea
            rows={2}
            placeholder="Answer…"
            value={item.a}
            onChange={(e) => onChange(i, 'a', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition-colors"
          />
        </div>
      ))}
    </div>
  );
}

function HtmlEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white mb-1">HTML Content</p>
          <p className="text-xs text-zinc-500">
            Paste or write HTML. If empty, the default page content is shown.
            Use standard HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc.
          </p>
        </div>
        {value.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="shrink-0 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <textarea
        rows={24}
        placeholder="<h2>Section Title</h2>&#10;<p>Your content here...</p>"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-300 font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 resize-y transition-colors"
      />
      <p className="text-xs text-zinc-600">{value.length} chars</p>
    </div>
  );
}
