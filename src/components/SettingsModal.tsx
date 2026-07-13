import { X, Sun, Moon, KeyRound, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SettingsModal({ isOpen, onClose, isDark, onToggleTheme }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#0d1526] border border-gray-200 dark:border-[#1e2d45] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Settings size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Pengaturan</h2>
          </div>
          <button
            onClick={onClose}
            className="pro-btn pro-btn-ghost !px-2 !py-1.5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Theme */}
          <div>
            <label className="block pro-section-title mb-1.5">Tema Tampilan</label>
            <button
              onClick={onToggleTheme}
              className="pro-btn pro-btn-ghost w-full justify-center"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              {isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            </button>
          </div>

          {/* Save */}
          <button
            onClick={onClose}
            className="pro-btn pro-btn-primary w-full justify-center !py-2.5"
          >
            Simpan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
