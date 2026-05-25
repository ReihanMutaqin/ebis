import { X, Sun, Moon, KeyRound } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SettingsModal({ isOpen, onClose, apiKey, onApiKeyChange, isDark, onToggleTheme }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#16213e] border-[3px] border-black p-6 max-w-md w-full mx-4"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.8)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-lg text-[#f0a500]">⚙️ PENGATURAN</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-[#0f3460] rounded cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* API Key */}
        <div className="mb-6">
          <label className="block font-bold mb-2 font-vt text-lg flex items-center gap-2">
            <KeyRound size={18} /> OpenRouter API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-or-..."
            className="pixel-input w-full text-base"
          />
          <p className="text-sm text-gray-500 mt-1 font-vt">
            API key disimpan di browser kamu (localStorage). Dapatkan gratis di{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              openrouter.ai
            </a>
          </p>
        </div>

        {/* Theme */}
        <div className="mb-4">
          <label className="block font-bold mb-2 font-vt text-lg">Tema</label>
          <button
            onClick={onToggleTheme}
            className="pixel-btn px-4 py-2 bg-gray-200 dark:bg-[#0f3460] text-black dark:text-white flex items-center gap-2"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Mode Terang ☀️' : 'Mode Gelap 🌙'}
          </button>
        </div>

        {/* Save */}
        <button
          onClick={onClose}
          className="pixel-btn w-full px-4 py-3 bg-[#3b82f6] text-white font-vt text-xl"
        >
          SIMPAN
        </button>
      </div>
    </div>
  );
}
