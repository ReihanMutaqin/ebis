import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import {
  X, Maximize2, Minimize2, Send, Mic, Info,
  Volume2, VolumeX, MapPin, Trash2, Download,
} from 'lucide-react';
import { MusicPlayer } from './MusicPlayer';
import type { ChatMessage } from '@/types';
import type { useSpeech as useSpeechType } from '@/hooks/useSpeech';

interface ChatAssistantProps {
  messages: ChatMessage[];
  draft: string;
  isTyping: boolean;
  isDataAttached: boolean;
  isOpen: boolean;
  isMaximized: boolean;
  setDraft: (d: string) => void;
  toggleChat: () => void;
  toggleMaximize: () => void;
  sendMessage: (msg: string) => void;
  clearChat: () => void;
  exportChat: (fmt: 'txt' | 'json' | 'md') => void;
  handleCommand: (cmd: string) => boolean;
  speech: ReturnType<typeof useSpeechType>;
  onToast: (msg: string) => void;
}

const SUGGESTED_PROMPTS = [
  'Cara pakai?',
  'Apa itu EBIS?',
  'Tips filter',
  'Bantuan',
];

export function ChatAssistant({
  messages, draft, isTyping, isDataAttached, isOpen, isMaximized,
  setDraft, toggleChat, toggleMaximize, sendMessage, clearChat,
  exportChat, handleCommand, speech, onToast,
}: ChatAssistantProps) {
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [lastUserMsg, setLastUserMsg] = useState('');

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isOpen) toggleChat();
        speech.stopSpeaking();
        speech.stopListening();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toggleChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        if (!speech.isListening) {
          speech.startListening((text) => {
            setDraft(text);
          });
        } else {
          speech.stopListening();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportChat('txt');
        onToast('✅ Chat diexport!');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        clearChat();
        onToast('🗑️ Chat dihapus!');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleChat, speech, exportChat, clearChat, onToast, setDraft]);

  const handleSend = () => {
    const msg = draft.trim();
    if (!msg) return;

    // Handle commands
    if (msg.startsWith('/')) {
      if (msg.toLowerCase().startsWith('/music') || msg.toLowerCase().startsWith('/musik') || msg.toLowerCase().startsWith('/lagu')) {
        setShowMusic(true);
        sendMessage(msg);
        return;
      }
      if (msg.toLowerCase().startsWith('/lofi') || msg.toLowerCase().startsWith('/pop') ||
          msg.toLowerCase().startsWith('/rock') || msg.toLowerCase().startsWith('/indonesia') ||
          msg.toLowerCase().startsWith('/dev')) {
        setShowMusic(true);
      }
      if (handleCommand(msg)) {
        setDraft('');
        return;
      }
    }

    setLastUserMsg(msg);
    sendMessage(msg);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'ArrowUp' && !draft && lastUserMsg) {
      e.preventDefault();
      setDraft(lastUserMsg);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      onToast('❌ Browser tidak mendukung GPS');
      return;
    }
    onToast('📍 Melacak lokasi...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          onToast(`📍 ${data.display_name.substring(0, 50)}...`);
        } catch {
          onToast(`📍 Koordinat: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      () => onToast('❌ Gagal akses GPS')
    );
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className={`fixed bottom-5 right-5 z-[9999] w-[60px] h-[60px] rounded-full bg-[#facc15] border-[3px] border-black flex items-center justify-center cursor-pointer transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}
        style={{
          boxShadow: '4px 4px 0px #000',
          animation: isOpen ? 'none' : 'pulse-ring 2s infinite',
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
      >
        <span className="text-2xl">🤖</span>
      </button>

      <div
        className="fixed z-[10000] flex flex-col bg-white dark:bg-[#16213e] border-2 border-black"
        style={{
          bottom: isMaximized ? '10vh' : '90px',
          right: isMaximized ? '10vw' : '20px',
          width: isMaximized ? '80vw' : '350px',
          height: isMaximized ? '80vh' : '500px',
          maxWidth: isMaximized ? '1000px' : '90vw',
          boxShadow: isOpen ? '8px 8px 0px rgba(0,0,0,0.8)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        }}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#facc15] border-b border-black">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <strong className="font-vt text-sm">ASISTEN SAKTI</strong>
          {isDataAttached && (
            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">DATA ON</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowShortcuts(true)} className="p-1 hover:bg-black/20 rounded" title="Info Shortcut">
            <Info size={16} />
          </button>
          <button onClick={toggleMaximize} className="p-1 hover:bg-black/20 rounded" title="Maximize">
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={toggleChat} className="p-1 hover:bg-black/20 rounded" title="Tutup">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div
        ref={chatBodyRef}
        className="flex-1 overflow-y-auto p-3 bg-[#f8f9fa] dark:bg-[#1a1a2e]"
      >
        {messages.length === 0 ? (
          <div className="space-y-2">
            <div className="p-3 border-2 border-black bg-[#0d6efd] text-white" style={{ boxShadow: '3px 3px 0px #000' }}>
              <p className="font-vt text-base">
                Halo! Ada yang bisa saya bantu soal data EBIS atau lainnya?
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => {
                    setDraft(prompt);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-[#0f3460] border border-gray-300 dark:border-[#2a2a4a] rounded-full text-sm font-vt hover:border-[#e94560] transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              style={{ animation: 'fadeIn 0.3s ease' }}
            >
              <div
                className={`p-2.5 border-2 border-black max-w-[85%] font-vt text-base ${
                  msg.role === 'user'
                    ? 'bg-[#dcf8c6] text-black'
                    : 'bg-white dark:bg-[#16213e] text-black dark:text-white'
                }`}
                style={{ boxShadow: '3px 3px 0px #000' }}
              >
                {msg.role === 'assistant' ? (
                  <div
                    className="bot-content"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}

                {msg.role === 'assistant' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => speech.speak(msg.content)}
                      className="text-xs flex items-center gap-1 px-2 py-1 border border-black hover:bg-gray-100 dark:hover:bg-[#0f3460] transition-colors cursor-pointer"
                    >
                      🔊 Baca
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        onToast('✅ Teks dicopy!');
                      }}
                      className="text-xs flex items-center gap-1 px-2 py-1 border border-black hover:bg-gray-100 dark:hover:bg-[#0f3460] transition-colors cursor-pointer"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => {
                        let tsv = '';
                        const lines = msg.content.split('\n');
                        let inTable = false;
                        for (const line of lines) {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                            // Skip markdown table separator lines
                            if (trimmed.match(/^\|([\s-:]+\|)+$/)) continue;
                            
                            tsv += trimmed.slice(1, -1).split('|').map(c => c.trim()).join('\t') + '\n';
                            inTable = true;
                          } else if (inTable) {
                            tsv += '\n';
                            inTable = false;
                          }
                        }
                        
                        if (tsv.trim()) {
                          navigator.clipboard.writeText(tsv.trim());
                          onToast('✅ Tabel disalin ke format Excel!');
                        } else {
                          onToast('❌ Tidak ada tabel yang ditemukan');
                        }
                      }}
                      className="text-xs flex items-center gap-1 px-2 py-1 border border-black hover:bg-gray-100 dark:hover:bg-[#0f3460] transition-colors cursor-pointer"
                    >
                      📊 Copy Tabel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="p-2.5 border-2 border-black bg-[#6c757d] text-white" style={{ boxShadow: '3px 3px 0px #000' }}>
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-white rounded-full" style={{ animation: 'typingBounce 1s infinite' }} />
                <span className="w-2 h-2 bg-white rounded-full" style={{ animation: 'typingBounce 1s infinite 0.2s' }} />
                <span className="w-2 h-2 bg-white rounded-full" style={{ animation: 'typingBounce 1s infinite 0.4s' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions bar */}
      <div className="flex gap-1 px-2 py-1 bg-gray-100 dark:bg-[#0f3460] border-t border-gray-300 dark:border-[#2a2a4a]">
        <button onClick={() => speech.toggleTts()} title="Toggle TTS" className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer">
          {speech.ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
        <button onClick={() => setShowMusic(p => !p)} title="Music" className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer">
          🎵
        </button>
        <button onClick={getLocation} title="Lokasi" className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer">
          <MapPin size={14} />
        </button>
        <button onClick={() => exportChat('txt')} title="Export" className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer">
          <Download size={14} />
        </button>
        <button onClick={clearChat} title="Hapus" className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer">
          <Trash2 size={14} />
        </button>
        <button
          onClick={() => handleCommand(isDataAttached ? '/lepas' : '/pasang')}
          title={isDataAttached ? 'Lepas data' : 'Pasang data'}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer text-xs font-vt"
        >
          {isDataAttached ? '🔗' : '🔌'}
        </button>
      </div>

      {/* Input */}
      <div className="flex gap-2 p-2 bg-white dark:bg-[#16213e] border-t-[3px] border-black">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ketik pesan..."
          className="flex-1 pro-input text-sm py-2"
          autoFocus
        />
        {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
          <button
            onClick={() => {
              if (speech.isListening) {
                speech.stopListening();
              } else {
                speech.startListening((text) => setDraft(text));
              }
            }}
            className={`px-3 py-2 border-2 border-black ${speech.isListening ? 'bg-red-500 text-white' : 'bg-gray-200'} cursor-pointer`}
            title="Voice input"
          >
            <Mic size={16} />
          </button>
        )}
        <button
          onClick={handleSend}
          className="px-3 py-2 bg-[#22c55e] border-2 border-black text-white cursor-pointer hover:bg-[#16a34a] transition-colors"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="absolute inset-0 z-[10001] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#16213e] border-[3px] border-black p-4 max-w-sm w-full mx-4" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-3 bg-[#facc15] -m-4 p-3 mb-4 border-b-[3px] border-black">
              <h6 className="font-bold font-vt text-sm flex items-center gap-2">
                <Info size={16} /> INFO PENTING
              </h6>
              <button onClick={() => setShowShortcuts(false)} className="cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <table className="w-full text-sm font-vt">
              <thead>
                <tr className="bg-black text-white">
                  <th colSpan={2} className="text-center py-1">⌨️ SHORTCUT KEYBOARD</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Ctrl+/', 'Toggle chat'],
                  ['Ctrl+M', 'Voice input'],
                  ['Ctrl+Shift+E', 'Export chat'],
                  ['Ctrl+Shift+Del', 'Hapus chat'],
                  ['Esc', 'Tutup chat / TTS'],
                  ['↑ (kosong)', 'Recall pesan akhir'],
                ].map(([key, val]) => (
                  <tr key={key} className="border-b border-gray-300">
                    <td className="py-1 px-2 bg-gray-100 dark:bg-[#0f3460] w-[45%]"><code>{key}</code></td>
                    <td className="py-1 px-2">{val}</td>
                  </tr>
                ))}
              </tbody>
              <thead>
                <tr className="bg-black text-white border-t-[3px] border-black">
                  <th colSpan={2} className="text-center py-1">💬 COMMAND CHAT</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['/help', 'Bantuan'],
                  ['/tts', 'Toggle audio AI'],
                  ['/export', 'Export chat'],
                  ['/clear', 'Hapus chat'],
                ].map(([cmd, desc]) => (
                  <tr key={cmd} className="border-b border-gray-300">
                    <td className="py-1 px-2 bg-gray-100 dark:bg-[#0f3460]"><code>{cmd}</code></td>
                    <td className="py-1 px-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* Floating Music Player */}
    {showMusic && (
      <div 
        className={`fixed z-[10010] transition-all duration-500 ease-in-out ${isOpen ? 'bottom-[90px] right-[390px] opacity-100' : 'bottom-[20px] left-[20px] opacity-90 hover:opacity-100'}`}
        style={{
          width: '350px',
          boxShadow: '8px 8px 0px rgba(0,0,0,0.8)',
          borderRadius: '12px',
        }}
      >
        <MusicPlayer onToast={onToast} onClose={() => setShowMusic(false)} />
      </div>
    )}
    </>
  );
}
