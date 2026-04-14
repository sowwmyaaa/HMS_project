export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Showing <span className="font-medium">{start}</span> to <span className="font-medium">{end}</span> of <span className="font-medium">{total}</span> results
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p;
          if (totalPages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 border rounded text-sm border-slate-300 dark:border-slate-600 ${page === p ? 'bg-hostel-primary text-white border-hostel-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}
