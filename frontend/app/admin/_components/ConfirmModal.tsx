'use client';

interface Props {
  title: string;
  message?: string;
  highlight?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message = 'This action cannot be undone.',
  highlight,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && onCancel()} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-1">{message}</p>
        {highlight && <p className="text-sm text-white font-medium mb-6 break-words">{highlight}</p>}
        {!highlight && <div className="mb-6" />}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium disabled:opacity-50"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
