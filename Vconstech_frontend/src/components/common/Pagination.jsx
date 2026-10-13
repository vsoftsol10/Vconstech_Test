import React from "react";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, "...", totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "Records",
  className = "",
}) => {
  const safePageSize = pageSize || DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const end = Math.min(safePage * safePageSize, totalItems);

  const handlePageSizeChange = (event) => {
    const nextPageSize = Number(event.target.value);
    onPageSizeChange?.(nextPageSize);
    onPageChange(1);
  };

  return (
    <div className={`flex flex-col gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-white ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="text-sm font-medium text-gray-700">
            Showing <span className="font-semibold text-gray-900">{start}</span>&ndash;
            <span className="font-semibold text-gray-900">{end}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalItems}</span> {itemLabel}
          </p>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Show:
            <select
              value={safePageSize}
              onChange={handlePageSizeChange}
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 pr-8 text-sm font-semibold text-gray-800 shadow-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          {getPaginationItems(safePage, totalPages).map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
                ...
              </span>
            ) : (
              <button
                type="button"
                key={item}
                onClick={() => onPageChange(item)}
                className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-lg transition-colors ${
                  safePage === item
                    ? "bg-[#FFBE2A] text-black shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {item}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
