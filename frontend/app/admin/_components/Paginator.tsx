interface PaginatorProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

export default function Paginator({ page, totalPages, onPage }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-zinc-600 text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p as number)}
            className={`min-w-[32px] h-8 text-sm rounded-lg transition ${
              p === page
                ? 'bg-white text-zinc-900 font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}
