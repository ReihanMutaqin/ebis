export interface EBISData {
  [key: string]: string;
}

export interface FileInfo {
  name: string;
  time: string;
  size: string;
  rows: number;
}

export interface Filters {
  witel: string;
  dateFrom: string;
  search: string;
  types: string[];
  statuses: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ToastData {
  id: number;
  message: string;
  duration: number;
}

export const SUMMARY_COLS = [
  'LAST UPDATE STATUS',
  'ORDER',
  'INTERNET',
  'TYPE TRANSAKSI',
  'ALAMAT',
  'NAMA CUST',
  'STO',
];

export const QUICK_MODO_TYPES = ['MO+AS', 'DO', 'MO', 'AS', 'CN', 'CO'];

export const QUICK_MODO_STATUSES = [
  'OSS - TESTING SERVICE',
  '7 | OSS - PROVISIONING ISSUED',
  'OSS - FALLOUT',
  'OSS - PROVISIONING START',
  'OSS - PROVISIONING DESAIN',
  '8 | OSS - PONR',
];

export interface Playlist {
  key: string;
  name: string;
  desc: string;
  url: string;
  icon: string;
  color: string;
}

export const PLAYLISTS: Playlist[] = [
  {
    key: 'lofi',
    name: 'Lofi Beats',
    desc: 'Santai & Fokus Kerja',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator',
    icon: '\u2615',
    color: '#0dcaf0',
  },
  {
    key: 'pop',
    name: 'Pop Hits',
    desc: 'Lagu Populer Dunia',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator',
    icon: '\u2b50',
    color: '#198754',
  },
  {
    key: 'rock',
    name: 'Rock Classics',
    desc: 'Rock Legendaris',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWXRqgorJj26U?utm_source=generator',
    icon: '\ud83c\udfb8',
    color: '#ffc107',
  },
  {
    key: 'indonesia',
    name: 'Indonesia Hits',
    desc: 'Lagu Tanah Air',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1EQqkOPvHGajmW?utm_source=generator',
    icon: '\ud83c\uddee\ud83c\udde9',
    color: '#0d6efd',
  },
  {
    key: 'developer',
    name: 'Developer Vibes',
    desc: 'Playlist Reihan 🔥',
    url: 'https://open.spotify.com/embed/playlist/6VSx9EtQRJzYEgdvjvFxs2?utm_source=generator&theme=0',
    icon: '🔥',
    color: '#e94560',
  },
];
