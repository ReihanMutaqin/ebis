import { Settings, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ onSettings, isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="text-center mb-7 relative py-2">
      {/* Theme toggle - left */}
      <button
        onClick={onToggleTheme}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        title={isDark ? 'Mode Terang' : 'Mode Gelap'}
        id="btn-toggle-theme"
      >
        {isDark
          ? <Sun size={22} className="text-yellow-300" />
          : <Moon size={22} className="text-gray-800" />
        }
      </button>

      {/* Settings - right */}
      <button
        onClick={onSettings}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        title="Pengaturan"
        id="btn-settings"
      >
        <Settings size={22} className="text-black dark:text-white" />
      </button>

      {/* Title */}
      <h1
        className="font-pixel text-[#facc15] leading-tight tracking-widest"
        style={{
          fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
          WebkitTextStroke: '2px #000',
          textShadow: '4px 4px 0px #000',
        }}
      >
        FILTER SAKTI EBIS
      </h1>

      {/* Tagline */}
      <div
        className="inline-block px-5 py-1 mt-3 font-vt text-lg tracking-wide"
        style={{
          background: '#000',
          color: '#facc15',
          transform: 'skew(-8deg)',
          letterSpacing: '2px',
        }}
      >
        ★ Kalau Ada Yang Gampang Kenapa Yang Susah ★
      </div>
    </header>
  );
}
