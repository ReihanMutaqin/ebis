import { X, Sun, Moon, Settings, Cpu, Sparkles, CheckCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  aiProvider?: string;
  onProviderChange?: (val: any) => void;
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
          {/* AI Model Info */}
          <div>
            <label className="block pro-section-title mb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              Model AI Aktif
            </label>
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/30 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
                    <Cpu size={15} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100 font-mono">
                    openrouter/free
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle size={11} /> Aktif (Free Router)
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <strong>Free Models Router</strong> — Otomatis memilih model AI gratis terbaik dan aktif dari OpenRouter dengan dukungan image understanding, tool calling, analisis data EBIS, serta pembuatan preview web live.
              </p>
            </div>
          </div>

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
