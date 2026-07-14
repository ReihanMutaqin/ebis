import { useState } from 'react';
import { Search, X, Minus, Square } from 'lucide-react';
import { PLAYLISTS } from '@/types';

interface MusicPlayerProps {
  onToast: (msg: string) => void;
  onClose?: () => void;
}

export function MusicPlayer({ onToast, onClose }: MusicPlayerProps) {
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const playPlaylist = (key: string) => {
    setActivePlaylist(key);
    const pl = PLAYLISTS.find(p => p.key === key);
    if (pl) onToast(`🎵 Memutar ${pl.name}`);
  };

  const searchSpotify = () => {
    if (!searchQuery.trim()) {
      onToast('❌ Ketik judul lagu dulu!');
      return;
    }
    const url = `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;
    window.open(url, '_blank');
    onToast(`🔍 Mencari "${searchQuery}" di Spotify...`);
  };

  return (
    <div
      className="p-4 my-2"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: '2px solid #e94560',
        borderRadius: '12px',
      }}
    >
      <div className="flex flex-col mb-2">
        <div className="flex items-center justify-between cursor-grab active:cursor-grabbing">
          <div className="font-bold flex items-center gap-2 pointer-events-none" style={{ color: '#e94560' }}>
            🎵 MUSIC PLAYER
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded-full cursor-pointer text-gray-300 transition-colors">
              {isMinimized ? <Square size={14} /> : <Minus size={16} />}
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full cursor-pointer text-gray-300 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {!isMinimized && (
          <p className="text-xs text-gray-400 mt-1 italic font-vt pointer-events-none">
            * Login ke Spotify Web terlebih dahulu untuk mendengarkan lagu full (bukan preview)
          </p>
        )}
      </div>

      <div className={`transition-all duration-300 overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
        <div className="grid grid-cols-2 gap-2 mb-3 mt-1">
          {PLAYLISTS.map(pl => (
            <button
              key={pl.key}
              onClick={() => playPlaylist(pl.key)}
              className="p-2 text-sm font-vt transition-transform hover:scale-105 cursor-pointer"
              style={{
                border: `2px solid ${pl.color}`,
                background: activePlaylist === pl.key ? `${pl.color}30` : 'transparent',
                color: pl.color,
                borderRadius: '8px',
              }}
            >
              {pl.icon} {pl.name}
              <span className="block text-xs opacity-60">{pl.desc}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchSpotify()}
            placeholder="Cari lagu/artis..."
            className="flex-1 p-2 text-sm font-vt rounded-md border"
            style={{
              background: '#0f0f23',
              borderColor: '#444',
              color: 'white',
            }}
          />
          <button
            onClick={searchSpotify}
            className="px-3 py-2 rounded-md text-white cursor-pointer"
            style={{ background: '#e94560' }}
          >
            <Search size={16} />
          </button>
        </div>

        {activePlaylist && (
          <div className="mt-3">
            <iframe
              style={{ borderRadius: '12px' }}
              src={PLAYLISTS.find(p => p.key === activePlaylist)?.url}
              width="100%"
              height="152"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}
