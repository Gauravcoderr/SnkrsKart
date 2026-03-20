'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import ProductFormModal from './ProductFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import Paginator from '../_components/Paginator';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return null;
    }
    return token;
  }, [router]);

  const fetchProducts = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setProducts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleAdd() {
    setEditProduct(null);
    setFormOpen(true);
  }

  function handleEdit(product: Product) {
    setEditProduct(product);
    setFormOpen(true);
  }

  async function handleDelete(product: Product) {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteProduct(null);
        fetchProducts();
      }
    } catch {
      // ignore
    }
  }

  async function handleSave(data: Partial<Product>) {
    const token = getToken();
    if (!token) return;

    const url = editProduct
      ? `${API}/admin/products/${editProduct.id}`
      : `${API}/admin/products`;

    const res = await fetch(url, {
      method: editProduct ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save');
    }

    setFormOpen(false);
    setEditProduct(null);
    fetchProducts();
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-80 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{products.length} products</span>
          <button
            type="button"
            onClick={handleAdd}
            className="bg-white text-zinc-900 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-zinc-200 transition shrink-0"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Product Table */}
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
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-12 h-12 object-cover rounded-lg bg-zinc-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white max-w-[200px] truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-[200px]">{p.colorway}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{p.brand}</td>
                  <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                    {'\u20B9'}{p.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                    {p.originalPrice ? `\u20B9${p.originalPrice.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-zinc-400">{p.gender}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-zinc-400 max-w-[120px] truncate">
                      {p.availableSizes.join(', ')}
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteProduct(p)}
                        className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-md hover:bg-red-500/10 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    {search ? 'No products match your search.' : 'No products yet. Add one!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

      {/* Modals */}
      {formOpen && (
        <ProductFormModal
          product={editProduct}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditProduct(null); }}
        />
      )}

      {deleteProduct && (
        <DeleteConfirmModal
          product={deleteProduct}
          onConfirm={() => handleDelete(deleteProduct)}
          onCancel={() => setDeleteProduct(null)}
        />
      )}
    </div>
  );
}
