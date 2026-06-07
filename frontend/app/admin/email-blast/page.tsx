'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE = 'https://snkrscart.com';
const LOGO_URL = `${SITE}/logo.jpg`;

interface Product { id: string; name: string; slug: string; brand?: string; colorway?: string; images?: string[]; price?: number; createdAt?: string; }
interface Blog { _id: string; title: string; slug: string; coverImage?: string; excerpt?: string; published: boolean; createdAt?: string; }

function buildBlastHtml(products: Product[], blogs: Blog[]): string {
  const productCards = products.map(p => {
    const img = p.images?.[0];
    const meta = [p.brand, p.colorway].filter(Boolean).join(' · ');
    const imgRow = img
      ? `<tr><td style="line-height:0;font-size:0;"><a href="${SITE}/products/${p.slug}" style="display:block;text-decoration:none;"><img src="${img}" alt="${p.name}" width="536" style="width:100%;max-height:260px;object-fit:cover;display:block;border:none;" /></a></td></tr>`
      : '';
    return `
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E4E4E7;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${imgRow}
            <tr><td style="padding:24px 28px 8px;">
              <p style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;color:#A1A1AA;letter-spacing:3px;text-transform:uppercase;">Just Dropped</p>
              <h2 style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:22px;font-weight:700;color:#18181B;line-height:1.2;">${p.name}</h2>
              ${meta ? `<p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#71717A;">${meta}</p>` : ''}
            </td></tr>
            ${p.price ? `<tr><td style="padding:4px 28px 0;"><span style="font-family:Inter,Arial,sans-serif;font-size:24px;font-weight:700;color:#18181B;">&#8377;${p.price.toLocaleString('en-IN')}</span></td></tr>` : ''}
            <tr><td style="padding:20px 28px 24px;">
              <a href="${SITE}/products/${p.slug}" style="display:block;text-align:center;padding:13px 28px;background:#18181B;color:#FFFFFF;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Shop Now &rarr;</a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr><td height="12" style="font-size:0;line-height:0;">&nbsp;</td></tr>`;
  }).join('');

  const blogCards = blogs.map(b => {
    const excerpt = b.excerpt ? b.excerpt.slice(0, 130) + (b.excerpt.length > 130 ? '…' : '') : '';
    const imgRow = b.coverImage
      ? `<tr><td style="line-height:0;font-size:0;"><a href="${SITE}/blogs/${b.slug}" style="display:block;text-decoration:none;"><img src="${b.coverImage}" alt="${b.title}" width="536" style="width:100%;max-height:220px;object-fit:cover;display:block;border:none;" /></a></td></tr>`
      : '';
    return `
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E4E4E7;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${imgRow}
            <tr><td style="padding:24px 28px 8px;">
              <p style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;color:#A1A1AA;letter-spacing:3px;text-transform:uppercase;">New on the Blog</p>
              <h2 style="margin:0 0 8px;font-family:Inter,Arial,sans-serif;font-size:20px;font-weight:700;color:#18181B;line-height:1.25;">${b.title}</h2>
              ${excerpt ? `<p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.65;color:#52525B;">${excerpt}</p>` : ''}
            </td></tr>
            <tr><td style="padding:16px 28px 24px;">
              <a href="${SITE}/blogs/${b.slug}" style="display:block;text-align:center;padding:13px 28px;background:#18181B;color:#FFFFFF;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Read the Story &rarr;</a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr><td height="12" style="font-size:0;line-height:0;">&nbsp;</td></tr>`;
  }).join('');

  const hasProducts = products.length > 0;
  const hasBlogs = blogs.length > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>SNKRS CART</title>
  <style>body{margin:0;padding:0;background:#ECECED;-webkit-font-smoothing:antialiased;}</style>
</head>
<body style="margin:0;padding:0;background:#ECECED;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECECED;">
  <tr><td align="center" style="padding:32px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

      <!-- HEADER -->
      <tr><td style="background:#FFFFFF;padding:18px 32px;text-align:left;border-bottom:1px solid #E4E4E7;">
        <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;">
          <img src="${LOGO_URL}" alt="SNKRS CART" height="52" style="height:52px;display:inline-block;vertical-align:middle;border:none;" />
        </a>
        <a href="${SITE}" style="text-decoration:none;display:inline-block;vertical-align:middle;margin-left:10px;">
          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:800;color:#18181B;letter-spacing:-0.4px;vertical-align:middle;">SNKRS CART</span>
        </a>
      </td></tr>

      <!-- INTRO BAND -->
      <tr><td style="background:#F4F4F5;padding:22px 32px 14px;">
        <p style="margin:0 0 4px;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;color:#A1A1AA;letter-spacing:3px;text-transform:uppercase;">What's New</p>
        <h1 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:22px;font-weight:700;color:#18181B;line-height:1.2;">Fresh from SNKRS CART</h1>
      </td></tr>

      <!-- CARDS -->
      <tr><td style="background:#F4F4F5;padding:12px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${hasProducts ? `<tr><td style="padding:0 0 8px;"><p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;color:#A1A1AA;letter-spacing:3px;text-transform:uppercase;">New Arrivals</p></td></tr>${productCards}` : ''}
          ${hasBlogs ? `<tr><td style="padding:${hasProducts ? '8px' : '0'} 0 8px;"><p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:700;color:#A1A1AA;letter-spacing:3px;text-transform:uppercase;">From the Blog</p></td></tr>${blogCards}` : ''}
        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0F0F0F;padding:28px 32px 24px;text-align:center;">
        <a href="https://www.instagram.com/snkrs_cart/" style="display:inline-block;margin:0 6px;text-decoration:none;vertical-align:top;">
          <img src="https://res.cloudinary.com/dadulg5bs/image/upload/w_22,h_22,c_fit,f_png/email-icons/instagram-white.png" width="22" height="22" alt="Instagram" style="display:block;border:none;opacity:0.7;" />
        </a>
        <a href="https://wa.me/919410903791" style="display:inline-block;margin:0 6px;text-decoration:none;vertical-align:top;">
          <img src="https://res.cloudinary.com/dadulg5bs/image/upload/w_22,h_22,c_fit,f_png/email-icons/whatsapp-white.png" width="22" height="22" alt="WhatsApp" style="display:block;border:none;opacity:0.7;" />
        </a>
        <div style="height:1px;background:rgba(255,255,255,0.08);margin:18px 0 14px;"></div>
        <p style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:800;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;">SNKRS CART</p>
        <p style="margin:0 0 4px;font-family:Inter,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);">
          <a href="https://wa.me/919410903791" style="color:rgba(255,255,255,0.3);text-decoration:none;">+91 94109 03791</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:infosnkrscart@gmail.com" style="color:rgba(255,255,255,0.3);text-decoration:none;">infosnkrscart@gmail.com</a>
          &nbsp;&middot;&nbsp;
          <a href="${SITE}" style="color:rgba(255,255,255,0.3);text-decoration:none;">snkrscart.com</a>
        </p>
        <p style="margin:8px 0 0;font-family:Inter,Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.15);">You received this because you shopped, reviewed, or subscribed. Reply STOP to unsubscribe.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
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
