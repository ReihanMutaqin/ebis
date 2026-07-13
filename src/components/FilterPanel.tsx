import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { Filters } from '@/types';

interface FilterPanelProps {
  filters: Filters;
  uniqueWitels: string[];
  uniqueTypes: string[];
  uniqueStatuses: string[];
  onWitelChange: (w: string) => void;
  onDateChange: (d: string) => void;
  onSearchChange: (s: string) => void;
  onToggleType: (t: string) => void;
  onToggleStatus: (s: string) => void;
  onReset: () => void;
}

export function FilterPanel({
  filters,
  uniqueWitels,
  uniqueTypes,
  uniqueStatuses,
  onWitelChange,
  onDateChange,
  onSearchChange,
  onToggleType,
  onToggleStatus,
  onReset,
}: FilterPanelProps) {
  return (
    <div className="pro-card p-5 mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-blue-500" />
          Pengaturan Filter
        </h4>

        {/* Quick action buttons */}
        <div className="flex gap-2">
          <button
            id="btn-reset-filter"
            onClick={onReset}
            className="pro-btn pro-btn-ghost !text-xs !py-1.5 !px-3"
            title="Reset semua filter ke pengaturan awal"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Top filters row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block pro-section-title mb-1.5">
            Pilih Witel
          </label>
          <select
            id="select-witel"
            value={filters.witel}
            onChange={(e) => onWitelChange(e.target.value)}
            className="pro-select"
          >
            <option value="">— Semua Witel —</option>
            <option value="SOUTHERN">SOUTHERN (JAKSEL, JAKTIM, JAKPUS)</option>
            {uniqueWitels.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block pro-section-title mb-1.5">
            Last Update Status
          </label>
          <input
            id="input-date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onDateChange(e.target.value)}
            className="pro-input"
          />
        </div>

        <div>
          <label className="block pro-section-title mb-1.5">
            Cari (Order / Nama)
          </label>
          <input
            id="input-search"
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ketik SC order atau nama..."
            className="pro-input"
          />
        </div>
      </div>

      {/* Checkbox filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order type */}
        <div className="filter-box">
          <div className="filter-title">📋 Type Order</div>
          <div className="filter-content">
            {uniqueTypes.length === 0
              ? <p className="text-gray-400 text-xs italic py-2">Belum ada data</p>
              : uniqueTypes.map(type => (
                <label key={type} id={`chk-type-${type}`}>
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => onToggleType(type)}
                  />
                  {type}
                </label>
              ))
            }
          </div>
        </div>

        {/* Status */}
        <div className="filter-box">
          <div className="filter-title">🔖 Status</div>
          <div className="filter-content">
            {uniqueStatuses.length === 0
              ? <p className="text-gray-400 text-xs italic py-2">Belum ada data</p>
              : uniqueStatuses.map(status => (
                <label key={status} id={`chk-status-${status.replace(/\s+/g, '-')}`}>
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => onToggleStatus(status)}
                  />
                  {status}
                </label>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
