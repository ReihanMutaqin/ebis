import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/types';

const MAX_HISTORY = 20;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function loadChat(): ChatMessage[] {
  try {
    const saved = localStorage.getItem('ebis_chat');
    const savedTime = localStorage.getItem('ebis_chat_time');
    if (!saved || !savedTime) return [];
    const chatTime = new Date(savedTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - chatTime.getTime()) / (1000 * 60 * 60);
    if (hoursDiff >= 24) {
      localStorage.removeItem('ebis_chat');
      localStorage.removeItem('ebis_chat_time');
      return [];
    }
    return JSON.parse(saved) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveChat(msgs: ChatMessage[]) {
  try {
    localStorage.setItem('ebis_chat', JSON.stringify(msgs));
    localStorage.setItem('ebis_chat_time', new Date().toISOString());
  } catch (e) {
    console.warn('Failed to save chat:', e);
  }
}

export function useChat(dataSummary: string) {
  const [messages, setMessagesState] = useState<ChatMessage[]>(loadChat);
  const [draft, setDraft] = useState(() => {
    try { return localStorage.getItem('ebis_chat_draft') || ''; } catch { return ''; }
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isDataAttached, setIsDataAttachedState] = useState(() => {
    try { return localStorage.getItem('ebis_data_attached') !== 'false'; } catch { return true; }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const typingRef = useRef(false);

  const setMessages = useCallback((msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessagesState(prev => {
      const next = typeof msgs === 'function' ? msgs(prev) : msgs;
      saveChat(next);
      return next;
    });
  }, []);

  const setIsDataAttached = useCallback((val: boolean) => {
    setIsDataAttachedState(val);
    try { localStorage.setItem('ebis_data_attached', String(val)); } catch { /* ignore */ }
  }, []);

  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);
  const toggleMaximize = useCallback(() => setIsMaximized(prev => !prev), []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setDraft('');
    try {
      localStorage.removeItem('ebis_chat');
      localStorage.removeItem('ebis_chat_time');
      localStorage.removeItem('ebis_chat_draft');
    } catch { /* ignore */ }
  }, [setMessages]);

  const exportChat = useCallback((format: 'txt' | 'json' | 'md' = 'txt') => {
    if (messages.length === 0) return;

    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    let filename = `chat-asisten-sakti-${timestamp}`;
    let mimeType = '';

    if (format === 'txt') {
      content = messages.map(msg => {
        const role = msg.role === 'user' ? 'USER' : 'ASISTEN SAKTI';
        return `[${role}]\n${msg.content}\n${'='.repeat(50)}\n`;
      }).join('\n');
      filename += '.txt';
      mimeType = 'text/plain';
    } else if (format === 'json') {
      content = JSON.stringify({ exported_at: new Date().toISOString(), messages }, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    } else {
      content = `# Chat dengan Asisten Sakti\n\n*Exported: ${new Date().toLocaleString('id-ID')}*\n\n---\n\n`;
      messages.forEach(msg => {
        const role = msg.role === 'user' ? '**User**' : '**Asisten Sakti**';
        content += `${role}:\n${msg.content}\n\n---\n\n`;
      });
      filename += '.md';
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || typingRef.current) return;

    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ API Key belum diatur. Klik ikon pengaturan (⚙️) di atas untuk memasukkan Groq API Key-mu.\n\nDapatkan API Key gratis di https://console.groq.com/keys',
        timestamp: Date.now(),
      }]);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: message.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    if (newMessages.length > MAX_HISTORY * 2) {
      newMessages.splice(0, newMessages.length - MAX_HISTORY * 2);
    }
    setMessages(newMessages);
    setDraft('');
    try { localStorage.removeItem('ebis_chat_draft'); } catch { /* ignore */ }
    typingRef.current = true;
    setIsTyping(true);

    try {
      const skrg = new Date();
      const infoWaktu = skrg.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      const summary = isDataAttached ? dataSummary || 'Data tersedia.' : 'Mode Cepat: Tanpa data.';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'FILTER SAKTI EBIS',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `[SYSTEM] Kamu adalah Asisten Sakti untuk aplikasi FILTER SAKTI EBIS. Gaya bahasa: santai, gaul, asyik. Waktu: ${infoWaktu}. Data: ${summary}. Bantu user soal data EBIS, filter, dan hal teknis lainnya. Jawab langsung ke intinya.`,
            },
            ...newMessages.slice(-MAX_HISTORY).map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      const botReply = data.choices?.[0]?.message?.content || 'Maaf, tidak ada respons.';
      const botMsg: ChatMessage = { role: 'assistant', content: botReply, timestamp: Date.now() };
      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      let displayMsg = '❌ ' + errMsg;
      if (errMsg.includes('401')) displayMsg = '❌ API Key tidak valid. Periksa kembali API Key-mu di ⚙️ Pengaturan atau file .env';
      else if (errMsg.includes('402') || errMsg.includes('payment')) displayMsg = '💳 Kuota Groq habis/terkena limit.';
      else if (errMsg.includes('429')) displayMsg = '⏳ Rate limit tercapai. Tunggu sebentar ya...';
      else if (errMsg.includes('unavailable') || errMsg.includes('free')) displayMsg = '🚫 Model tidak tersedia. Coba lagi atau ganti model di pengaturan.';
      else if (errMsg.includes('Network') || errMsg.includes('fetch')) displayMsg = '📡 Koneksi bermasalah. Cek internet kamu!';

      const botMsg: ChatMessage = { role: 'assistant', content: displayMsg, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      typingRef.current = false;
      setIsTyping(false);
    }
  }, [messages, dataSummary, isDataAttached, setMessages]);

  const handleCommand = useCallback((cmd: string): boolean => {
    const lower = cmd.toLowerCase();

    if (lower === '/lepas') {
      setIsDataAttached(false);
      setMessages(prev => [...prev, {
        role: 'assistant', content: '🔌 **DATA DI LEPAS** (Mode Cepat Aktif)', timestamp: Date.now(),
      }]);
      return true;
    }
    if (lower === '/pasang') {
      setIsDataAttached(true);
      setMessages(prev => [...prev, {
        role: 'assistant', content: '🔗 **DATA DI PASANG** (Mode Analisis Aktif)', timestamp: Date.now(),
      }]);
      return true;
    }
    if (lower === '/export' || lower === '/save') {
      exportChat('txt');
      setMessages(prev => [...prev, {
        role: 'assistant', content: '✅ Chat berhasil diexport sebagai TXT!', timestamp: Date.now(),
      }]);
      return true;
    }
    if (lower === '/clear') {
      clearChat();
      return true;
    }
    if (lower === '/help' || lower === '/bantuan') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `📋 **DAFTAR COMMAND:**
\`/pasang\` - Sambungkan data ke AI
\`/lepas\` - Lepas data dari AI
\`/export\` - Export chat
\`/clear\` - Hapus chat
\`/help\` - Bantuan
\`/music\` - Music player

**Shortcut:**
Ctrl+/ = Toggle chat
Ctrl+M = Voice
Esc = Tutup`,
        timestamp: Date.now(),
      }]);
      return true;
    }

    return false;
  }, [clearChat, exportChat, setIsDataAttached, setMessages]);

  return {
    messages,
    draft,
    isTyping,
    isDataAttached,
    isOpen,
    isMaximized,
    setDraft,
    setIsDataAttached,
    toggleChat,
    toggleMaximize,
    sendMessage,
    clearChat,
    exportChat,
    handleCommand,
  };
}
