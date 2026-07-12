'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import ProductFormModal from './ProductFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import Paginator from '../_components/Paginator';
import ImageLightbox from '@/components/ui/ImageLightbox';
import AdminFilterDrawer from '@/components/admin/AdminFilterDrawer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Crocs'];
const GENDERS = ['men', 'women', 'kids', 'unisex'];
const FLAGS = ['featured', 'trending', 'newArrival', 'soldOut'] as const;
const FLAG_LABELS: Record<string, string> = { featured: 'Featured', trending: 'Trending', newArrival: 'New Arrival', soldOut: 'Sold Out' };

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Filters (inside drawer)
  const [filterBrand, setFilterBrand] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterFlags, setFilterFlags] = useState<Set<string>>(new Set());

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return null; }
    return token;
  }, [router]);

  const fetchProducts = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      setProducts(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [getToken, router]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function toggleFlag(flag: string) {
    setFilterFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag); else next.add(flag);
      return next;
    });
    setPage(1);
  }

  function clearFilters() {
    setFilterBrand('');
    setFilterGender('');
    setFilterFlags(new Set());
    setPage(1);
  }

  const activeFilterCount = (filterBrand ? 1 : 0) + (filterGender ? 1 : 0) + filterFlags.size;

  function handleAdd() { setEditProduct(null); setFormOpen(true); }
  function handleEdit(product: Product) { setEditProduct(product); setFormOpen(true); }

  async function handleDelete(product: Product) {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API}/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { setDeleteProduct(null); fetchProducts(); }
  }

  async function handleSave(data: Partial<Product>) {
    const token = getToken();
    if (!token) return;
    const url = editProduct ? `${API}/admin/products/${editProduct.id}` : `${API}/admin/products`;
    const res = await fetch(url, {
      method: editProduct ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
    const saved = await res.json();
    const slug = saved.slug ?? data.slug;
    if (slug) fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ slug }) }).catch(() => null);
    setFormOpen(false);
    setEditProduct(null);
    fetchProducts();
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      }
      if (filterBrand && p.brand !== filterBrand) return false;
      if (filterGender && p.gender !== filterGender) return false;
      for (const flag of filterFlags) {
        if (!p[flag as keyof Product]) return false;
      }
      return true;
    });
  }, [products, search, filterBrand, filterGender, filterFlags]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name, brand, SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-72 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg border transition-colors shrink-0 ${
              activeFilterCount > 0
                ? 'bg-white text-zinc-900 border-white font-semibold'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-zinc-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{filtered.length}/{products.length} products</span>
          <button type="button" onClick={handleAdd} className="bg-white text-zinc-900 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-zinc-200 transition shrink-0">
            + Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Image</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">MRP</th>
              <th className="px-4 py-3 font-medium">Gender</th>
              <th className="px-4 py-3 font-medium">Sizes</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => p.images?.length && setLightbox({ images: p.images, index: 0 })} className="focus:outline-none">
                    <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg bg-zinc-800 cursor-zoom-in hover:opacity-80 transition-opacity" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white max-w-[200px] truncate">{p.name}</div>
                  <div className="text-xs text-zinc-500 truncate max-w-[200px]">{p.colorway}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{p.brand}</td>
                <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">&#8377;{p.price.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{p.originalPrice ? `₹${p.originalPrice.toLocaleString('en-IN')}` : '-'}</td>
                <td className="px-4 py-3 capitalize text-zinc-400">{p.gender}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-zinc-400 max-w-[120px] truncate">
                    {p.productType !== 'shoes' && p.availableStringSizes?.length ? p.availableStringSizes.join(', ') : p.availableSizes.join(', ')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {p.featured && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Featured</span>}
                    {p.trending && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Trending</span>}
                    {p.newArrival && <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">New</span>}
                    {p.soldOut && <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">Sold Out</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.sourceUrl ? (
                    <a
                      href={p.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={p.sourceUrl}
                      className="inline-flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition">View</a>
                    <button type="button" onClick={() => handleEdit(p)} className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition">Edit</button>
                    <button type="button" onClick={() => setDeleteProduct(p)} className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-md hover:bg-red-500/10 transition">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                  {search || activeFilterCount > 0 ? 'No products match your filters.' : 'No products yet. Add one!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginator page={page} totalPages={totalPages} onPage={setPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} totalItems={filtered.length} />

      {/* Filter drawer */}
      <AdminFilterDrawer open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
        {/* Brand */}
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Brand</p>
          <div className="space-y-1">
            {BRANDS.map((b) => (
              <button key={b} type="button"
                onClick={() => { setFilterBrand(filterBrand === b ? '' : b); setPage(1); }}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${filterBrand === b ? 'bg-white text-zinc-900 font-semibold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Gender</p>
          <div className="space-y-1">
            {GENDERS.map((g) => (
              <button key={g} type="button"
                onClick={() => { setFilterGender(filterGender === g ? '' : g); setPage(1); }}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg capitalize transition ${filterGender === g ? 'bg-white text-zinc-900 font-semibold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Status</p>
          <div className="space-y-2">
            {FLAGS.map((f) => (
              <label key={f} className="flex items-center gap-3 cursor-pointer group py-1">
                <input type="checkbox" checked={filterFlags.has(f)} onChange={() => toggleFlag(f)} className="w-4 h-4 accent-white rounded" />
                <span className={`text-sm transition ${filterFlags.has(f) ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{FLAG_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear */}
        {activeFilterCount > 0 && (
          <button type="button" onClick={() => { clearFilters(); setFilterDrawerOpen(false); }}
            className="w-full py-2.5 border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition">
            Clear all filters
          </button>
        )}
      </AdminFilterDrawer>

      {formOpen && <ProductFormModal product={editProduct} allProducts={products} onSave={handleSave} onClose={() => { setFormOpen(false); setEditProduct(null); }} />}
      {deleteProduct && <DeleteConfirmModal product={deleteProduct} onConfirm={() => handleDelete(deleteProduct)} onCancel={() => setDeleteProduct(null)} />}
      {lightbox && <ImageLightbox images={lightbox.images} currentIndex={lightbox.index} onIndexChange={(i) => setLightbox({ ...lightbox, index: i })} onClose={() => setLightbox(null)} />}
    </div>
  );
}
