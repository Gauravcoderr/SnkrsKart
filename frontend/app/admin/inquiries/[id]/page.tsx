'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  productSlug: string;
  productName: string;
  productBrand: string;
  selectedSize: number | null;
  price: number;
  createdAt: string;
}

export default function InquiryDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }

    fetch(`${API}/admin/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
        if (res.status === 404) { setNotFound(true); return; }
        setInquiry(await res.json());
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !inquiry) {
    return (
      <div className="text-center py-20 text-zinc-500">
        <p className="text-lg font-medium text-white mb-2">Inquiry not found</p>
        <Link href="/admin/inquiries" className="text-sm underline hover:text-white transition">← Back to Inquiries</Link>
      </div>
    );
  }

  const date = new Date(inquiry.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="text-white max-w-2xl">
      {/* Back */}
      <Link
        href="/admin/inquiries"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition mb-6"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Inquiries
      </Link>

      {/* Header card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Purchase Inquiry</p>
            <h1 className="text-xl font-bold text-white">{inquiry.name}</h1>
          </div>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">{date}</span>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
          <Field label="Email">
            <a href={`mailto:${inquiry.email}`} className="text-blue-400 hover:text-blue-300 transition">{inquiry.email}</a>
          </Field>
          <Field label="Phone / WhatsApp">
            <a href={`tel:${inquiry.phone}`} className="text-blue-400 hover:text-blue-300 transition">{inquiry.phone}</a>
          </Field>
          <Field label="Delivery Address" className="sm:col-span-2">
            <span className="whitespace-pre-wrap">{inquiry.address}</span>
          </Field>
        </div>
      </div>

      {/* Product card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-4">Product Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand">{inquiry.productBrand}</Field>
          <Field label="Product">{inquiry.productName}</Field>
          <Field label="Size">
            {inquiry.selectedSize ? `UK ${inquiry.selectedSize}` : <span className="text-zinc-600">Not specified</span>}
          </Field>
          <Field label="Price">
            <span className="text-white font-semibold">₹{inquiry.price.toLocaleString('en-IN')}</span>
          </Field>
          <Field label="Product Slug" className="sm:col-span-2">
            <Link
              href={`/products/${inquiry.productSlug}`}
              target="_blank"
              className="text-blue-400 hover:text-blue-300 transition font-mono text-xs"
            >
              {inquiry.productSlug} ↗
            </Link>
          </Field>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mt-4">
        <a
          href={`mailto:${inquiry.email}?subject=Re: Your interest in ${inquiry.productBrand} ${inquiry.productName}`}
          className="flex-1 py-2.5 text-center text-sm font-semibold bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition"
        >
          Reply via Email
        </a>
        <a
          href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}?text=Hi ${encodeURIComponent(inquiry.name)}, thanks for your interest in the ${encodeURIComponent(inquiry.productBrand + ' ' + inquiry.productName)}!`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 text-center text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">{label}</p>
      <p className="text-sm text-zinc-200">{children}</p>
    </div>
  );
}
