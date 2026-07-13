import { X, Sun, Moon, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  aiProvider: 'R' | 'R2' | 'D';
  onProviderChange: (val: 'R' | 'R2' | 'D') => void;
}

export function SettingsModal({ isOpen, onClose, isDark, onToggleTheme, aiProvider, onProviderChange }: SettingsModalProps) {
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
          {/* AI Provider */}
          <div>
            <label className="block pro-section-title mb-1.5 flex items-center gap-1.5">
              Provider AI
            </label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onProviderChange('D')}
                className={`w-full py-2 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${aiProvider === 'D' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'}`}
              >
                🤖 AI D (Groq - LLaMA 3.1)
              </button>
              <button
                onClick={() => onProviderChange('R')}
                className={`w-full py-2 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${aiProvider === 'R' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'}`}
              >
                🌐 AI R (OpenRouter - Tencent)
              </button>
              <button
                onClick={() => onProviderChange('R2')}
                className={`w-full py-2 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${aiProvider === 'R2' ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'}`}
              >
                🐬 AI R2 (OpenRouter - Dolphin)
              </button>
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
