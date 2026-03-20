interface PaginatorProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems: number;
}

const SIZE_OPTIONS = [5, 10, 20, 50];

export default function Paginator({ page, totalPages, onPage, pageSize, onPageSizeChange, totalItems }: PaginatorProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      {/* Left: page size + info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-xs text-zinc-500">Show</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">per page</span>
        </div>
        <span className="text-xs text-zinc-600">
          {totalItems > 0 ? `${start}-${end} of ${totalItems}` : 'No items'}
        </span>
      </div>

      {/* Right: page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-zinc-600 text-sm select-none">...</span>
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
            Next
          </button>
        </div>
      )}
    </div>
  );
}
