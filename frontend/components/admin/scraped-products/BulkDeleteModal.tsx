'use client';

interface BulkDeleteModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

export default function BulkDeleteModal({ count, onConfirm, onCancel, deleting }: BulkDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Delete {count} product{count !== 1 ? 's' : ''}?</h2>
          <p className="text-sm text-zinc-400">
            This cannot be undone. Rejected URLs will be blacklisted so scrapers won&apos;t fetch them again.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-white rounded-full animate-spin" />}
            {deleting ? 'Deleting...' : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
}
