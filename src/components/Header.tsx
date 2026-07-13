import { Settings, Sun, Moon, BarChart2 } from 'lucide-react';

interface HeaderProps {
  onSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ onSettings, isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="mb-6 py-4 px-1 relative">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' }}
          >
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h1
              className="font-bold leading-tight text-gray-900 dark:text-white"
              style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', letterSpacing: '-0.01em' }}
            >
              Filter EBIS
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Data Analysis & Filtering Tool
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="pro-btn pro-btn-ghost !px-2.5 !py-2"
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            id="btn-toggle-theme"
          >
            {isDark
              ? <Sun size={17} className="text-yellow-400" />
              : <Moon size={17} className="text-gray-600" />
            }
          </button>
          <button
            onClick={onSettings}
            className="pro-btn pro-btn-ghost !px-2.5 !py-2"
            title="Pengaturan"
            id="btn-settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-4 h-px bg-gradient-to-r from-blue-500/30 via-blue-400/10 to-transparent dark:from-blue-500/20" />
    </header>
  );
}
