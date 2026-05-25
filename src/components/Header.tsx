import { Settings, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  onSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ onSettings, isDark, onToggleTheme }: HeaderProps) {
  return (
    <div className="text-center mb-6 relative">
      {/* Settings button */}
      <button
        onClick={onSettings}
        className="absolute right-0 top-0 p-2 hover:bg-black/10 rounded transition-colors"
        title="Pengaturan"
      >
        <Settings size={22} className="text-black dark:text-white" />
      </button>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        className="absolute left-0 top-0 p-2 hover:bg-black/10 rounded transition-colors"
        title={isDark ? 'Mode Terang' : 'Mode Gelap'}
      >
        {isDark ? <Volume2 size={22} className="text-white" /> : <VolumeX size={22} className="text-black" />}
      </button>

      <h1
        className="font-pixel text-[#facc15] leading-tight"
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 3rem)',
          WebkitTextStroke: '2px black',
          textShadow: '4px 4px 0px #000',
          letterSpacing: '5px',
        }}
      >
        FILTER SAKTI EBIS
      </h1>
      <div
        className="inline-block px-4 py-1 mt-2 text-lg font-vt"
        style={{
          background: '#000',
          color: '#fff',
          transform: 'skew(-10deg)',
        }}
      >
        Kalau Ada Yang Gampang Kenapa Yang Susah
      </div>
    </div>
  );
}
