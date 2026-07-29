import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/types';

const MAX_HISTORY = 20;

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

async function fetchWebPageContent(urlStr: string): Promise<{ url: string; content: string }> {
  let targetUrl = urlStr.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }
  
  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const res = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain, text/markdown' },
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 30) {
        return { url: targetUrl, content: text.slice(0, 8000) };
      }
    }
  } catch (err) {
    console.warn('Jina web reader error, trying proxy fallback:', err);
  }

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const html = await res.text();
      const cleanedText = html
        .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanedText.length > 20) {
        return { url: targetUrl, content: cleanedText.slice(0, 8000) };
      }
    }
  } catch (err) {
    console.error('AllOrigins fallback error:', err);
  }

  throw new Error(`Gagal membaca isi website (${targetUrl}).`);
}

export function useChat(dataSummary: string) {
  const [messages, setMessagesState] = useState<ChatMessage[]>(loadChat);
  const [draft, setDraft] = useState(() => {
    try { return localStorage.getItem('ebis_chat_draft') || ''; } catch { return ''; }
  });
  const [aiProvider, setAiProviderState] = useState<'R' | 'R2' | 'D'>(() => {
    try { return (localStorage.getItem('ebis_ai_provider') as 'R' | 'R2' | 'D') || 'D'; } catch { return 'D'; }
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

  const setAiProvider = useCallback((val: 'R' | 'R2' | 'D') => {
    setAiProviderState(val);
    try { localStorage.setItem('ebis_ai_provider', val); } catch { /* ignore */ }
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

    const isGroq = aiProvider === 'D';
    const key = isGroq ? import.meta.env.VITE_GROQ_API_KEY : import.meta.env.VITE_OPENROUTER_API_KEY;
    const apiUrl = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    
    let modelUsed = 'llama-3.1-8b-instant';
    if (aiProvider === 'R') modelUsed = 'inclusionai/ling-3.0-flash:free';
    if (aiProvider === 'R2') modelUsed = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

    if (!key) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ API Key belum diatur untuk ${isGroq ? 'Groq' : 'OpenRouter'} di file .env.`,
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

      let webInspectContext = '';
      const urlMatch = message.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
      if (urlMatch || message.toLowerCase().startsWith('/inspect') || message.toLowerCase().startsWith('/web')) {
        let rawUrl = urlMatch ? urlMatch[0] : message.replace(/^\/(inspect|web)\s*/i, '').trim();
        rawUrl = rawUrl.replace(/[.,)]+$/, '');
        if (rawUrl) {
          try {
            const webResult = await fetchWebPageContent(rawUrl);
            webInspectContext = `\n\n[REAL-TIME WEB INSPECTOR DATA (${webResult.url})]:\n${webResult.content}`;
          } catch (webErr) {
            const errMsg = webErr instanceof Error ? webErr.message : 'Gagal inspect web';
            webInspectContext = `\n\n[REAL-TIME WEB INSPECTOR NOTICE]: ${errMsg}`;
          }
        }
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'FILTER SAKTI EBIS',
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [
            {
              role: 'system',
              content: `[SYSTEM] Kamu adalah Asisten Sakti untuk aplikasi FILTER SAKTI EBIS. Gaya bahasa: santai, gaul, asyik. Waktu: ${infoWaktu}. Data summary saat ini: ${summary}.${webInspectContext} 
Karakter/Aturan Penting saat diminta analisa data:
1. Tampilkan analisa/rincian data Witel-nya.
2. Tampilkan analisa/rincian data STO-nya.
3. Sebutkan STATUS RESUME-nya apa.
4. Sebutkan STATUS MESSAGE-nya apa.
5. Sebutkan DATE (TANGGAL)-nya kapan.
6. Tampilkan juga rincian data ORDER-nya.
WAJIB: Sajikan semua hasil analisa dan rincian data ke dalam format tabel Markdown agar rapih.
PENTING: DILARANG KERAS menggunakan karakter pipe ("|") di dalam teks atau isi sel tabel karena akan merusak format tabel Markdown. Jika data asli mengandung karakter "|", ubahlah menjadi "-" atau spasi.
7. PEMBUATAN WEB / PREVIEW: Jika user meminta membuatkan website/landing page/portofolio/UI/komponen, berikan kode HTML lengkap (termasuk CSS/JS atau Tailwind CDN) di dalam format html code block agar user dapat melihat hasilnya secara langsung dengan mengeklik tombol '👁️ Lihat Preview Web (Live)'.
8. EFISIENSI KODE WEB: Utamakan menggunakan utility class Tailwind CSS (cdn.tailwindcss.com) dan FontAwesome agar kode website sangat efisien, indah, modern, responsif, dan lengkap hingga penutup akhir tanpa terpotong.
Bantu user soal data EBIS, filter, pembuatan web, dan hal teknis lainnya. Jika ada data REAL-TIME WEB INSPECTOR, gunakan informasi website tersebut untuk menjawab dan menginspeksi web secara detail. Jawab terstruktur dan langsung ke intinya.`,
            },
            ...newMessages.slice(-MAX_HISTORY).map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 6000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('429 Rate limit tercapai.');
        const errText = await response.text();
        let errMsg = `API Error ${response.status}`;
        try { errMsg = JSON.parse(errText).error.message; } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API Error');
      }

      const botReply = data.choices?.[0]?.message?.content || 'Maaf, API (OpenRouter/Groq) tidak memberikan respons untuk pertanyaan ini. Coba ulangi atau ganti model providernya di pengaturan.';
      const botMsg: ChatMessage = { role: 'assistant', content: botReply, timestamp: Date.now() };
      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      let displayMsg = '❌ ' + errMsg;
      if (errMsg.includes('401')) displayMsg = `❌ API Key tidak valid. Periksa kembali API Key-mu di file .env`;
      else if (errMsg.includes('402') || errMsg.includes('payment')) displayMsg = `💳 Kuota ${isGroq ? 'Groq' : 'OpenRouter'} habis/terkena limit.`;
      else if (errMsg.includes('429')) displayMsg = '⏳ Rate limit tercapai. Tunggu sebentar ya...';
      else if (errMsg.includes('unavailable') || errMsg.includes('free')) displayMsg = '🚫 Model tidak tersedia saat ini. Coba ganti provider di pengaturan.';
      else if (errMsg.includes('Network') || errMsg.includes('fetch')) displayMsg = '📡 Koneksi bermasalah. Cek internet kamu!';

      const botMsg: ChatMessage = { role: 'assistant', content: displayMsg, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      typingRef.current = false;
      setIsTyping(false);
    }
  }, [aiProvider, messages, dataSummary, isDataAttached, setMessages]);

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
    if (lower.startsWith('/inspect') || lower.startsWith('/web')) {
      const url = cmd.replace(/^\/(inspect|web)\s*/i, '').trim();
      if (!url) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '🌐 **REAL WEB INSPECTOR**\nFormat: `/inspect <URL>` atau `/web <URL>`\nContoh: `/inspect https://telkom.co.id` atau tempelkan link website di chat!',
          timestamp: Date.now(),
        }]);
        return true;
      }
    }
    if (lower === '/help' || lower === '/bantuan') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `📋 **DAFTAR COMMAND:**
\`/inspect <URL>\` - Real Web Inspector (Membaca & Analisa Web Live)
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
    aiProvider,
    isTyping,
    isDataAttached,
    isOpen,
    isMaximized,
    setDraft,
    setAiProvider,
    setIsDataAttached,
    toggleChat,
    toggleMaximize,
    sendMessage,
    clearChat,
    exportChat,
    handleCommand,
  };
}
