import { Star, RotateCcw } from 'lucide-react';
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
    <div className="pixel-card p-5 mb-6">
      <h4 className="font-bold text-xl text-center mb-4 font-vt text-2xl">
        ⚡ SETTING FILTER ⚡
      </h4>

      {/* Quick buttons */}
      <div className="mb-4 p-4 text-center bg-[#eee] border-2 border-black">
        <button
          onClick={onQuickModo}
          className="pixel-btn px-4 py-2 bg-[#facc15] text-black text-lg mr-3 mb-2 inline-flex items-center gap-2"
          title="★ FITUR SAKTI ★ Otomatis centang filter TYPE: MO, AS, CN, CO, DO, MO+AS STATUS: OSS Fallout, Provisioning, dll."
        >
          <Star size={18} /> QUICK MODO
        </button>
        <button
          onClick={onReset}
          className="pixel-btn px-4 py-2 bg-[#ef4444] text-white text-lg inline-flex items-center gap-2"
          title="⚠ BAHAYA ⚠ Klik ini kalau mau menghapus semua filter dan kembali ke pengaturan awal."
        >
          <RotateCcw size={18} /> ATUR ULANG
        </button>
      </div>

      {/* Filter row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <label className="block font-bold mb-1 font-vt text-lg">PILIH WITEL</label>
          <select
            value={filters.witel}
            onChange={(e) => onWitelChange(e.target.value)}
            className="pixel-select w-full"
          >
            <option value="">ALL WORLDS (SEMUA)</option>
            {uniqueWitels.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <div className="text-center">
          <label className="block font-bold mb-1 font-vt text-lg">LAST UPDATE STATUS</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onDateChange(e.target.value)}
            className="pixel-input w-full"
          />
        </div>

        <div className="text-center">
          <label className="block font-bold mb-1 font-vt text-lg">CARI (OPSIONAL)</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Order ID / Name..."
            className="pixel-input w-full"
          />
        </div>
      </div>

      {/* Filter row 2 - checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
        {/* Order Type */}
        <div className="filter-box">
          <div className="filter-title">ORDER</div>
          <div className="filter-content">
            {uniqueTypes.map(type => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={() => onToggleType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="filter-box">
          <div className="filter-title">STATUS</div>
          <div className="filter-content">
            {uniqueStatuses.map(status => (
              <label key={status}>
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(status)}
                  onChange={() => onToggleStatus(status)}
                />
                {status}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
