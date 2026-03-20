'use client';

import { Product } from '@/types';

interface Props {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ product, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-2">Delete Product</h3>
        <p className="text-sm text-zinc-400 mb-1">
          Are you sure you want to delete this product?
        </p>
        <p className="text-sm text-white font-medium mb-6">
          {product.brand} — {product.name}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
