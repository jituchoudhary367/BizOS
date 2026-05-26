import { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  data = [],
  onRowClick,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your filters or create a new entry.',
  searchable = false,
  searchPlaceholder = 'Search...',
  rowClassName = null, // optional: fn(row) => string
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Filter data by search query
  let filteredData = data;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredData = data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? row[col.accessor] : '';
        return String(val).toLowerCase().includes(q);
      })
    );
  }

  // Sort data
  if (sortKey) {
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      {searchable && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="input pl-9"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  className={cn(col.sortable && 'cursor-pointer select-none hover:text-text-secondary')}
                  onClick={() => col.sortable && handleSort(col.accessor)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.accessor && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr
                key={row.id || i}
                className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row))}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.accessor || col.header}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && searchQuery && (
        <p className="text-center text-text-tertiary text-sm py-8">
          No results for &ldquo;{searchQuery}&rdquo;
        </p>
      )}
    </div>
  );
}
