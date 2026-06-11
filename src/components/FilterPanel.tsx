import { Star, RotateCcw, SlidersHorizontal } from 'lucide-react';
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
  onQuickModo: () => void;
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
  onQuickModo,
  onReset,
}: FilterPanelProps) {
  return (
    <div className="pixel-card p-5 mb-5">
      {/* Header */}
      <h4 className="font-vt text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
        <SlidersHorizontal size={20} />
        SETTING FILTER
        <SlidersHorizontal size={20} />
      </h4>

      {/* Quick action buttons */}
      <div className="flex gap-3 mb-5 justify-center flex-wrap">
        <button
          id="btn-quick-modo"
          onClick={onQuickModo}
          className="pixel-btn px-5 py-2 bg-[#facc15] text-black text-xl"
          title="Otomatis centang filter TYPE: MO, AS, CN, CO, DO, MO+AS — STATUS: OSS Fallout, Provisioning, dll."
        >
          <Star size={16} /> QUICK MODO
        </button>
        <button
          id="btn-reset-filter"
          onClick={onReset}
          className="pixel-btn px-5 py-2 bg-[#ef4444] text-white text-xl"
          title="Reset semua filter ke pengaturan awal"
        >
          <RotateCcw size={16} /> ATUR ULANG
        </button>
      </div>

      {/* Top filters row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block font-vt text-base font-bold mb-1 tracking-wide uppercase text-gray-600 dark:text-gray-400">
            Pilih Witel
          </label>
          <select
            id="select-witel"
            value={filters.witel}
            onChange={(e) => onWitelChange(e.target.value)}
            className="pixel-select"
          >
            <option value="">— Semua Witel —</option>
            {uniqueWitels.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-vt text-base font-bold mb-1 tracking-wide uppercase text-gray-600 dark:text-gray-400">
            Last Update Status
          </label>
          <input
            id="input-date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onDateChange(e.target.value)}
            className="pixel-input"
          />
        </div>

        <div>
          <label className="block font-vt text-base font-bold mb-1 tracking-wide uppercase text-gray-600 dark:text-gray-400">
            Cari (Order / Nama)
          </label>
          <input
            id="input-search"
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ketik SC order atau nama..."
            className="pixel-input"
          />
        </div>
      </div>

      {/* Checkbox filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order type */}
        <div className="filter-box">
          <div className="filter-title">📋 TYPE ORDER</div>
          <div className="filter-content">
            {uniqueTypes.length === 0
              ? <p className="text-gray-400 text-sm italic">Belum ada data</p>
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
          <div className="filter-title">🔖 STATUS</div>
          <div className="filter-content">
            {uniqueStatuses.length === 0
              ? <p className="text-gray-400 text-sm italic">Belum ada data</p>
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
