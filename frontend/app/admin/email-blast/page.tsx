'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE = 'https://snkrs-kart.vercel.app';

interface Product { id: string; name: string; slug: string; brand?: string; colorway?: string; images?: string[]; price?: number; createdAt?: string; }
interface Blog { _id: string; title: string; slug: string; coverImage?: string; excerpt?: string; published: boolean; createdAt?: string; }

function buildBlastHtml(products: Product[], blogs: Blog[]): string {
  const ORANGE = '#FF4500';
  const BG = '#0A0A0A';
  const CARD = '#111111';

  const productCards = products.map(p => {
    const img = p.images?.[0];
    const imgHtml = img
      ? `<a href="${SITE}/products/${p.slug}" style="display:block;text-decoration:none;"><img src="${img}" alt="${p.name}" width="520" style="width:100%;max-height:260px;object-fit:cover;display:block;border-radius:6px;" /></a>`
      : '';
    return `<tr><td style="padding:0 0 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
        ${imgHtml ? `<tr><td>${imgHtml}</td></tr>` : ''}
        <tr><td style="padding:20px;">
          <div style="display:inline-block;background:${ORANGE};padding:3px 10px;border-radius:2px;margin-bottom:10px;">
            <span style="font-family:Impact,Arial,sans-serif;font-size:9px;font-weight:700;color:#fff;letter-spacing:2.5px;">NEW DROP</span>
          </div>
          <h2 style="margin:0 0 4px;font-family:Impact,Arial,sans-serif;font-size:26px;color:#fff;letter-spacing:0.5px;">${p.name}</h2>
          ${p.brand ? `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:12px;color:#666;">${p.brand}${p.colorway ? ` · ${p.colorway}` : ''}</p>` : ''}
          ${p.price ? `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#fff;">₹${p.price.toLocaleString('en-IN')}</p>` : ''}
          <a href="${SITE}/products/${p.slug}" style="display:inline-block;padding:12px 28px;background:${ORANGE};color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:2px;">Shop Now →</a>
        </td></tr>
      </table>
    </td></tr>`;
  }).join('');

  const blogCards = blogs.map(b => {
    const imgHtml = b.coverImage
      ? `<a href="${SITE}/blogs/${b.slug}" style="display:block;text-decoration:none;"><img src="${b.coverImage}" alt="${b.title}" width="520" style="width:100%;max-height:220px;object-fit:cover;display:block;border-radius:6px;" /></a>`
      : '';
    const excerpt = b.excerpt ? b.excerpt.slice(0, 150) + (b.excerpt.length > 150 ? '…' : '') : '';
    return `<tr><td style="padding:0 0 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
        ${imgHtml ? `<tr><td>${imgHtml}</td></tr>` : ''}
        <tr><td style="padding:20px;">
          <div style="display:inline-block;border:1px solid ${ORANGE};padding:3px 10px;border-radius:2px;margin-bottom:10px;">
            <span style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${ORANGE};letter-spacing:2.5px;">NEW POST</span>
          </div>
          <h2 style="margin:0 0 8px;font-family:Impact,Arial,sans-serif;font-size:24px;color:#fff;letter-spacing:0.3px;">${b.title}</h2>
          ${excerpt ? `<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#888;">${excerpt}</p>` : ''}
          <a href="${SITE}/blogs/${b.slug}" style="display:inline-block;padding:12px 28px;background:#fff;color:#0a0a0a;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:2px;">Read the Story →</a>
        </td></tr>
      </table>
    </td></tr>`;
  }).join('');

  const hasProducts = productCards.length > 0;
  const hasBlogs = blogCards.length > 0;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BG};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
  <tr><td align="center" style="padding:24px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
      <tr><td height="4" style="background:${ORANGE};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="background:${BG};padding:20px 40px;text-align:center;">
        <a href="${SITE}" style="text-decoration:none;"><span style="font-family:Impact,Arial,sans-serif;font-size:24px;color:#fff;letter-spacing:5px;">SNKRS CART</span></a>
      </td></tr>
      <tr><td style="background:${CARD};padding:32px 40px;">
        ${hasProducts ? `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;">New Arrivals</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">${productCards}</table>` : ''}
        ${hasBlogs ? `<p style="margin:${hasProducts ? '16px' : '0'} 0 16px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#555;letter-spacing:2px;text-transform:uppercase;">From the Blog</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">${blogCards}</table>` : ''}
      </td></tr>
      <tr><td style="background:${BG};padding:20px 40px;text-align:center;border-top:1px solid #1e1e1e;">
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;color:#444;letter-spacing:1px;">SNKRS CART — Sneakers. Culture. Community.</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#333;">To stop receiving emails, reply STOP.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

export default function EmailBlastPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedBlogs, setSelectedBlogs] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return null; }
    return token;
  }, [router]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/admin/products`, { headers }).then(r => r.json()),
      fetch(`${API}/admin/blogs`, { headers }).then(r => r.json()),
    ]).then(([prods, blgs]) => {
      setProducts((prods || []).slice(0, 30));
      setBlogs((blgs || []).slice(0, 30));
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, [getToken]);

  function toggleProduct(id: string) {
    setSelectedProducts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setSubject('');
    setHtml('');
    setPreview(false);
  }
  function toggleBlog(id: string) {
    setSelectedBlogs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setSubject('');
    setHtml('');
    setPreview(false);
  }

  function generate() {
    const selProds = products.filter(p => selectedProducts.has(p.id));
    const selBlgs = blogs.filter(b => selectedBlogs.has(b._id));
    if (!selProds.length && !selBlgs.length) { setError('Select at least one item.'); return; }
    setError('');
    const autoSubject = selProds.length && selBlgs.length
      ? `What's New at SNKRS CART`
      : selProds.length === 1 ? `Just Dropped: ${selProds[0].name}`
      : selProds.length > 1 ? `New Drops at SNKRS CART`
      : selBlgs.length === 1 ? `New on the Blog: ${selBlgs[0].title}`
      : `New Posts from SNKRS CART`;
    setSubject(autoSubject);
    setHtml(buildBlastHtml(selProds, selBlgs));
    setPreview(false);
  }

  async function handleSend() {
    if (!subject.trim() || !html.trim()) { setError('Generate or write subject + HTML first.'); return; }
    setError('');
    setSending(true);
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/email-blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: subject.trim(), html: html.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loadingData) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6 text-white">
      <div>
        <h1 className="text-xl font-bold text-white">Email Blast</h1>
        <p className="text-sm text-zinc-400 mt-1">Select recent products/blogs, generate email, then send to all subscribers + past customers.</p>
      </div>

      {sent && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm font-medium">
          Blast queued successfully. Emails are sending in the background.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Products</p>
            <button
              type="button"
              onClick={() => { setSelectedProducts(prev => prev.size === products.length ? new Set() : new Set(products.map(p => p.id))); setSubject(''); setHtml(''); setPreview(false); }}
              className="text-xs text-zinc-500 hover:text-white transition"
            >
              {selectedProducts.size === products.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {products.length === 0 && <p className="text-sm text-zinc-600">No products found.</p>}
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedProducts.has(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="w-4 h-4 accent-orange-500 shrink-0"
                />
                {p.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{p.brand}{p.price ? ` · ₹${p.price.toLocaleString('en-IN')}` : ''}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Blogs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Blogs</p>
            <button
              type="button"
              onClick={() => { setSelectedBlogs(prev => prev.size === blogs.length ? new Set() : new Set(blogs.map(b => b._id))); setSubject(''); setHtml(''); setPreview(false); }}
              className="text-xs text-zinc-500 hover:text-white transition"
            >
              {selectedBlogs.size === blogs.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {blogs.length === 0 && <p className="text-sm text-zinc-600">No blogs found.</p>}
            {blogs.map(b => (
              <label key={b._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedBlogs.has(b._id)}
                  onChange={() => toggleBlog(b._id)}
                  className="w-4 h-4 accent-orange-500 shrink-0"
                />
                {b.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.coverImage} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{b.title}</p>
                  <p className="text-xs text-zinc-500">{b.published ? 'Published' : 'Draft'}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={generate}
        className="px-5 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold transition"
      >
        Generate Email from Selection
      </button>

      {/* Subject + HTML */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Subject *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's New at SNKRS CART"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold tracking-widest uppercase text-zinc-400">Email HTML *</label>
            {html && (
              <button type="button" onClick={() => setPreview(p => !p)} className="text-xs text-zinc-400 hover:text-white transition">
                {preview ? 'Edit HTML' : 'Preview'}
              </button>
            )}
          </div>
          {preview && html ? (
            <div className="border border-zinc-700 rounded-lg overflow-hidden bg-white" style={{ height: 500 }}>
              <iframe srcDoc={html} className="w-full h-full border-0" title="Email preview" />
            </div>
          ) : (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Generate from selection above, or write custom HTML..."
              rows={14}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-y"
            />
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

      <div className="flex items-center gap-4 pb-8">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || sent}
          className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition disabled:opacity-50"
        >
          {sending ? 'Sending...' : sent ? 'Sent!' : 'Send to All Subscribers'}
        </button>
        {sent && (
          <button type="button" onClick={() => { setSent(false); setSubject(''); setHtml(''); setSelectedProducts(new Set()); setSelectedBlogs(new Set()); }} className="text-sm text-zinc-400 hover:text-white transition">
            Send another
          </button>
        )}
      </div>
    </div>
  );
}
