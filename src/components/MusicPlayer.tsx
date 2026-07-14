import { useState } from 'react';
import { Search } from 'lucide-react';
import { PLAYLISTS } from '@/types';

interface MusicPlayerProps {
  onToast: (msg: string) => void;
}

export function MusicPlayer({ onToast }: MusicPlayerProps) {
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="flex flex-col mb-3">
        <div className="font-bold flex items-center gap-2" style={{ color: '#e94560' }}>
          🎵 MUSIC PLAYER
        </div>
        <p className="text-xs text-gray-400 mt-1 italic font-vt">
          * Login ke Spotify Web terlebih dahulu untuk mendengarkan lagu full (bukan preview)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
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
  );
}
