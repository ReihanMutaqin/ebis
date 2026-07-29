import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import {
  X, Maximize2, Minimize2, Send, Mic, Info,
  Volume2, VolumeX, MapPin, Trash2, Download, Globe,
  Eye, Smartphone, Monitor, Tablet, ExternalLink,
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
  'Buatkan web portofolio',
  'Tips filter',
  'Bantuan',
];

function extractWebCode(content: string): string | null {
  if (!content) return null;

  const rawBlocks = content.split(/```(?:html|css|javascript|js|jsx|tsx|xml|svg)?/gi);

  let allHtmlParts: string[] = [];
  let allCssParts: string[] = [];
  let allJsParts: string[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    let block = rawBlocks[i].replace(/```$/g, '').trim();
    if (!block) continue;

    const lower = block.toLowerCase();
    if (!lower.includes('<div') && !lower.includes('<body') && !lower.includes('<!doctype') && lower.includes('{') && lower.includes('}') && (lower.includes('margin') || lower.includes('padding') || lower.includes('color') || lower.includes('background') || lower.includes('@keyframes') || lower.includes('font-family'))) {
      allCssParts.push(block);
    } else if (!lower.includes('<div') && !lower.includes('<body') && !lower.includes('<!doctype') && (lower.includes('const ') || lower.includes('let ') || lower.includes('var ') || lower.includes('function ') || lower.includes('document.') || lower.includes('addeventlistener'))) {
      allJsParts.push(block);
    } else if (lower.includes('<') && lower.includes('>')) {
      allHtmlParts.push(block);
    }
  }

  if (allHtmlParts.length === 0) {
    const startIdx = content.search(/<!DOCTYPE html|<html/i);
    if (startIdx !== -1) {
      let raw = content.slice(startIdx).replace(/```[a-z]*/gi, '').trim();
      allHtmlParts.push(raw);
    }
  }

  if (allHtmlParts.length === 0) return null;

  let combinedHtml = allHtmlParts.join('\n');
  let combinedCss = allCssParts.join('\n');
  let combinedJs = allJsParts.join('\n');

  const isFullDoc = combinedHtml.toLowerCase().includes('<!doctype') || combinedHtml.toLowerCase().includes('<html');

  if (isFullDoc) {
    if (combinedCss) {
      if (combinedHtml.includes('</head>')) {
        combinedHtml = combinedHtml.replace('</head>', `<style>${combinedCss}</style>\n</head>`);
      } else {
        combinedHtml = `<style>${combinedCss}</style>\n` + combinedHtml;
      }
    }
    if (combinedJs) {
      if (combinedHtml.includes('</body>')) {
        combinedHtml = combinedHtml.replace('</body>', `<script>${combinedJs}</script>\n</body>`);
      } else {
        combinedHtml += `\n<script>${combinedJs}</script>`;
      }
    }

    if (!combinedHtml.includes('cdn.tailwindcss.com')) {
      const cdnTags = `<script src="https://cdn.tailwindcss.com"></script>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>`;
      if (combinedHtml.includes('<head>')) {
        combinedHtml = combinedHtml.replace('<head>', `<head>\n${cdnTags}`);
      } else {
        combinedHtml = cdnTags + '\n' + combinedHtml;
      }
    }

    return combinedHtml;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>${combinedCss}</style>
</head>
<body class="bg-gray-50 text-gray-900 p-4">
  ${combinedHtml}
  <script>${combinedJs}</script>
</body>
</html>`;
}

export function ChatAssistant({
  messages, draft, isTyping, isDataAttached, isOpen, isMaximized,
  setDraft, toggleChat, toggleMaximize, sendMessage, clearChat,
  exportChat, handleCommand, speech, onToast,
}: ChatAssistantProps) {
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [webUrlInput, setWebUrlInput] = useState('');
  const [lastUserMsg, setLastUserMsg] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Drag state for Music Player
  const [musicPos, setMusicPos] = useState({ x: 0, y: 0 });
  const [isDraggingMusic, setIsDraggingMusic] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    // Reset position when chat toggles to avoid off-screen issues
    setMusicPos({ x: 0, y: 0 });
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, iframe')) return;
    setIsDraggingMusic(true);
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: musicPos.x,
      initialY: musicPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setMusicPos({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current.isDragging = false;
    setIsDraggingMusic(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

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
          {(() => {
            const latestWeb = [...messages].reverse().map(m => m.role === 'assistant' ? extractWebCode(m.content) : null).find(Boolean);
            return latestWeb ? (
              <button
                onClick={() => setPreviewHtml(latestWeb)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-black cursor-pointer shadow animate-bounce"
                title="Lihat Live Preview Web Hasil AI"
              >
                <Eye size={12} /> Preview Web
              </button>
            ) : null;
          })()}
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extractWebCode(msg.content) && (
                      <button
                        onClick={() => setPreviewHtml(extractWebCode(msg.content))}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold border border-black rounded transition-all cursor-pointer shadow-sm animate-pulse"
                      >
                        <Eye size={13} /> 👁️ Lihat Preview Web (Live)
                      </button>
                    )}
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
        <button onClick={() => setShowMusic((p: boolean) => !p)} title="Music" className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer">
          🎵
        </button>
        <button onClick={() => setShowWebModal(true)} title="Inspect Real Web (🌐)" className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#1a1a2e] rounded cursor-pointer text-blue-600 dark:text-blue-400">
          <Globe size={14} />
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
          placeholder="Ketik pesan atau /inspect <URL>..."
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

      {/* Real Web Inspector Modal */}
      {showWebModal && (
        <div className="absolute inset-0 z-[10001] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#16213e] border-[3px] border-black p-4 max-w-sm w-full font-vt" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between mb-3 bg-blue-600 text-white -m-4 p-3 mb-4 border-b-[3px] border-black">
              <h6 className="font-bold text-sm flex items-center gap-2">
                <Globe size={16} /> REAL WEB INSPECTOR
              </h6>
              <button onClick={() => setShowWebModal(false)} className="cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs mb-2 text-gray-700 dark:text-gray-300">
              Masukkan URL website asli yang ingin di-inspect / dianalisa oleh Asisten Sakti:
            </p>
            <input
              type="text"
              placeholder="https://example.com"
              value={webUrlInput}
              onChange={(e) => setWebUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && webUrlInput.trim()) {
                  sendMessage(`Inspect dan analisa website ini: ${webUrlInput.trim()}`);
                  setWebUrlInput('');
                  setShowWebModal(false);
                }
              }}
              className="w-full pro-input text-sm p-2 mb-3 dark:bg-[#0f3460] dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowWebModal(false)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 border-2 border-black text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (webUrlInput.trim()) {
                    sendMessage(`Inspect dan analisa website ini: ${webUrlInput.trim()}`);
                    setWebUrlInput('');
                    setShowWebModal(false);
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white border-2 border-black text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                🔍 Inspect Web
              </button>
            </div>
          </div>
        </div>
      )}

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
                  ['/inspect <URL>', 'Real Web Inspector'],
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
        className={`fixed z-[10010] ${!isDraggingMusic ? 'transition-all duration-500 ease-in-out' : ''} ${isOpen ? 'bottom-[90px] right-[390px] opacity-100' : 'bottom-[20px] left-[20px] opacity-90 hover:opacity-100'}`}
        style={{
          width: '350px',
          boxShadow: '8px 8px 0px rgba(0,0,0,0.8)',
          borderRadius: '12px',
          transform: `translate(${musicPos.x}px, ${musicPos.y}px)`,
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <MusicPlayer onToast={onToast} onClose={() => { setShowMusic(false); setMusicPos({x: 0, y: 0}); }} />
      </div>
    )}

    {/* Live Web Artifact Preview Modal */}
    {previewHtml && (
      <div className="fixed inset-0 z-[10005] flex flex-col bg-black/80 backdrop-blur-sm p-2 sm:p-6 font-vt">
        <div className="flex-1 flex flex-col bg-white dark:bg-[#16213e] border-[3px] border-black rounded-lg overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#2563eb] text-white border-b-[3px] border-black gap-2">
            <div className="flex items-center gap-2">
              <Eye size={18} className="animate-pulse" />
              <strong className="text-base font-bold tracking-wide">LIVE WEB ARTIFACT PREVIEW</strong>
            </div>

            {/* Viewport Switcher */}
            <div className="flex items-center gap-1 bg-blue-900/60 p-1 rounded border border-blue-300/40">
              <button
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1.5 rounded flex items-center gap-1 text-xs cursor-pointer transition-colors ${previewViewport === 'desktop' ? 'bg-white text-blue-900 font-bold' : 'text-white hover:bg-white/20'}`}
                title="Desktop View (100%)"
              >
                <Monitor size={14} /> <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setPreviewViewport('tablet')}
                className={`p-1.5 rounded flex items-center gap-1 text-xs cursor-pointer transition-colors ${previewViewport === 'tablet' ? 'bg-white text-blue-900 font-bold' : 'text-white hover:bg-white/20'}`}
                title="Tablet View (768px)"
              >
                <Tablet size={14} /> <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1.5 rounded flex items-center gap-1 text-xs cursor-pointer transition-colors ${previewViewport === 'mobile' ? 'bg-white text-blue-900 font-bold' : 'text-white hover:bg-white/20'}`}
                title="Mobile View (375px)"
              >
                <Smartphone size={14} /> <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([previewHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}
                className="p-1.5 bg-blue-700 hover:bg-blue-800 rounded border border-white/40 text-xs flex items-center gap-1 cursor-pointer font-bold"
                title="Buka di Tab Baru"
              >
                <ExternalLink size={14} /> Tab Baru
              </button>
              <button
                onClick={() => setPreviewHtml(null)}
                className="p-1.5 bg-red-600 hover:bg-red-700 rounded border border-white/40 cursor-pointer text-white"
                title="Tutup Preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
            <div
              className={`h-full bg-white transition-all duration-300 shadow-2xl border-2 border-gray-700 overflow-hidden ${
                previewViewport === 'mobile'
                  ? 'w-[375px] max-w-full rounded-[24px] p-2 bg-black'
                  : previewViewport === 'tablet'
                  ? 'w-[768px] max-w-full rounded-[16px] p-2 bg-black'
                  : 'w-full h-full'
              }`}
            >
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0 bg-white rounded"
                title="Live Web Preview"
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
