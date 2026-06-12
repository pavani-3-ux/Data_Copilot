import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { classNames } from '../utils/helpers';
import type { Dataset, DatasetStats, DataProfile } from '../types';

interface DataExplorerProps {
  dataset: Dataset;
  data: Record<string, unknown>[];
  stats: DatasetStats;
  profiles: DataProfile[];
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataExplorer({ dataset, data, stats, profiles }: DataExplorerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'profile'>('table');

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getProfile = (columnName: string): DataProfile | undefined => {
    return profiles.find((p) => p.column_name === columnName);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Explorer</h1>
          <p className="text-secondary-400 mt-1">
            Explore {stats.totalRows.toLocaleString()} rows &bull; {stats.totalColumns} columns
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-secondary-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={classNames(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-400 hover:text-white'
              )}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('profile')}
              className={classNames(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'profile'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-400 hover:text-white'
              )}
            >
              Column Profiles
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-4">
          <p className="text-secondary-500 text-xs">Total Rows</p>
          <p className="text-white text-xl font-semibold mt-1">{stats.totalRows.toLocaleString()}</p>
        </div>
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-4">
          <p className="text-secondary-500 text-xs">Total Columns</p>
          <p className="text-white text-xl font-semibold mt-1">{stats.totalColumns}</p>
        </div>
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-4">
          <p className="text-secondary-500 text-xs">Missing Values</p>
          <p className="text-error-400 text-xl font-semibold mt-1">
            {stats.missingPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-4">
          <p className="text-secondary-500 text-xs">Duplicate Rows</p>
          <p className="text-warning-400 text-xl font-semibold mt-1">{stats.duplicateRows}</p>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-secondary-900 rounded-xl border border-secondary-800 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white placeholder-secondary-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-secondary-400 text-sm">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-secondary-900 rounded-xl border border-secondary-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-800">
                    {dataset.columns.map((col) => (
                      <th
                        key={col.name}
                        className="px-4 py-3 text-left text-xs font-medium text-secondary-400 uppercase tracking-wider cursor-pointer hover:bg-secondary-700 transition-colors"
                        onClick={() => handleSort(col.name)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{col.name}</span>
                          <div className="flex flex-col">
                            {sortColumn === col.name ? (
                              sortDirection === 'asc' ? (
                                <SortAsc className="w-3 h-3 text-primary-400" />
                              ) : (
                                <SortDesc className="w-3 h-3 text-primary-400" />
                              )
                            ) : (
                              <SortAsc className="w-3 h-3 text-secondary-600" />
                            )}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-800">
                  {paginatedData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-secondary-800/50 transition-colors"
                    >
                      {dataset.columns.map((col) => (
                        <td
                          key={col.name}
                          className="px-4 py-3 text-sm text-secondary-300 whitespace-nowrap"
                        >
                          {formatValue(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-800">
              <p className="text-secondary-400 text-sm">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{' '}
                {filteredData.length} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-secondary-800 text-secondary-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-secondary-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-secondary-800 text-secondary-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Column Profiles View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataset.columns.map((col) => {
            const profile = getProfile(col.name);
            return (
              <ColumnProfileCard
                key={col.name}
                column={col}
                profile={profile}
                isSelected={selectedColumn === col.name}
                onToggle={() => setSelectedColumn(selectedColumn === col.name ? null : col.name)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ColumnProfileCardProps {
  column: { name: string; type: string; nullable: boolean };
  profile?: DataProfile;
  isSelected: boolean;
  onToggle: () => void;
}

function ColumnProfileCard({ column, profile, isSelected, onToggle }: ColumnProfileCardProps) {
  if (!profile) return null;

  const typeColors: Record<string, string> = {
    number: 'text-primary-400 bg-primary-500/20',
    string: 'text-accent-400 bg-accent-500/20',
    date: 'text-warning-400 bg-warning-500/20',
    boolean: 'text-success-400 bg-success-500/20',
  };

  return (
    <div
      className={classNames(
        'bg-secondary-900 rounded-xl border border-secondary-800 p-4 cursor-pointer transition-all',
        isSelected && 'border-primary-500 ring-1 ring-primary-500/50'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium text-sm">{column.name}</h3>
          <span
            className={classNames(
              'inline-flex px-2 py-0.5 rounded text-xs font-medium mt-1',
              typeColors[profile.data_type] || typeColors.string
            )}
          >
            {profile.data_type}
          </span>
        </div>
        <button className="p-1 rounded hover:bg-secondary-800">
          <Info className="w-4 h-4 text-secondary-400" />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-secondary-500">Unique Values</span>
          <span className="text-white">{profile.unique_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary-500">Missing</span>
          <span className={profile.missing_percentage > 10 ? 'text-error-400' : 'text-white'}>
            {profile.missing_percentage}%
          </span>
        </div>
        {profile.mean_value !== undefined && (
          <div className="flex justify-between">
            <span className="text-secondary-500">Mean</span>
            <span className="text-white">{profile.mean_value.toFixed(2)}</span>
          </div>
        )}
        {profile.min_value !== undefined && (
          <div className="flex justify-between">
            <span className="text-secondary-500">Min</span>
            <span className="text-white">{profile.min_value}</span>
          </div>
        )}
        {profile.max_value !== undefined && (
          <div className="flex justify-between">
            <span className="text-secondary-500">Max</span>
            <span className="text-white">{profile.max_value}</span>
          </div>
        )}
      </div>

      {isSelected && profile.top_values.length > 0 && (
        <div className="mt-4 pt-4 border-t border-secondary-800">
          <p className="text-secondary-500 text-xs mb-2">Top Values</p>
          <div className="space-y-2">
            {profile.top_values.slice(0, 5).map((tv, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-secondary-300 text-xs truncate max-w-[60%]">
                  {tv.value}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-secondary-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(tv.count / profile.top_values[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-secondary-400 text-xs">{tv.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
