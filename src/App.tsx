import { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { DataInfo } from '@/components/DataInfo';
import { FilterPanel } from '@/components/FilterPanel';
import { DataTables } from '@/components/DataTables';
import { ChatAssistant } from '@/components/ChatAssistant';
import { SettingsModal } from '@/components/SettingsModal';
import { LoadingModal } from '@/components/LoadingModal';
import { ToastContainer } from '@/components/Toast';
import { useFileParser } from '@/hooks/useFileParser';
import { useFilters } from '@/hooks/useFilters';
import { useChat } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { useSpeech } from '@/hooks/useSpeech';
import type { ToastData } from '@/types';

let toastId = 0;

export default function App() {
  const { data, headers, fileInfo, isLoading, parseFile } = useFileParser();
  const filters = useFilters(data);
  const theme = useTheme();
  const speech = useSpeech();
  const [showSettings, setShowSettings] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Build data summary for chat context
  const dataSummary = useMemo(() => {
    if (data.length === 0) return 'Tidak ada data.';
    const rows = filters.filteredData;
    const statusCounts: Record<string, number> = {};
    const stoCounts: Record<string, number> = {};
    const witelCounts: Record<string, number> = {};
    const orderStateCounts: Record<string, number> = {};
    const msgCounts: Record<string, number> = {};
    const orderCounts: Record<string, number> = {};

    rows.forEach(r => {
      const s = r['STATUS RESUME'] || 'KOSONG';
      const sto = r['STO'] || 'KOSONG';
      const witel = r['WITEL_OLD'] || 'KOSONG';
      const date = r['ORDER DATE'] || r['TGL ORDER'] || r['DATE'] || 'KOSONG';
      const msg = r['STATUS MESSAGE'] || 'KOSONG';
      const order = r['ORDER'] || 'KOSONG';

      statusCounts[s] = (statusCounts[s] || 0) + 1;
      stoCounts[sto] = (stoCounts[sto] || 0) + 1;
      witelCounts[witel] = (witelCounts[witel] || 0) + 1;
      orderStateCounts[date] = (orderStateCounts[date] || 0) + 1;
      msgCounts[msg] = (msgCounts[msg] || 0) + 1;
      orderCounts[order] = (orderCounts[order] || 0) + 1;
    });

    // Helper function to get top N items
    const getTop = (obj: Record<string, number>, limit: number) => {
      return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([k, v]) => `${k.length > 30 ? k.substring(0, 30) + '...' : k}: ${v}`)
        .join(' | ');
    };

    const st = getTop(statusCounts, 15);
    const sto = getTop(stoCounts, 15);
    const wit = getTop(witelCounts, 15);
    const dates = getTop(orderStateCounts, 15);
    const topMsg = getTop(msgCounts, 5);
    const ord = getTop(orderCounts, 15);

    // Provide actual correlated data for the first 20 rows to prevent hallucination
    const sampleRows = rows.slice(0, 20).map(r => ({
      ORDER: r['ORDER'] || '',
      TANGGAL: r['LAST UPDATE STATUS'] || r['ORDER DATE'] || r['TGL ORDER'] || '',
      WITEL: r['WITEL_OLD'] || '',
      STO: r['STO'] || '',
      STATUS: r['STATUS RESUME'] || '',
      "STATUS MESSAGE": r['STATUS MESSAGE'] || ''
    }));

    return `Data Terfilter (yang sedang ditampilkan di tabel saat ini): ${rows.length} baris.
Ringkasan Frekuensi:
WITEL (Top 15): [${wit}]
STO (Top 15): [${sto}]
Status (Top 15): [${st}]
Date (Top 15): [${dates}]
Order (Top 15): [${ord}]
Top Status Msg: [${topMsg}]

Data Sample (20 Baris Pertama Teratas dari tabel):
${JSON.stringify(sampleRows)}`;
  }, [data, filters.filteredData]);

  const chat = useChat(dataSummary);

  // Initialize filters when data first loads
  useEffect(() => {
    if (data.length > 0 && filters.uniqueTypes.length > 0) {
      filters.initFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, filters.uniqueTypes.length, filters.uniqueStatuses.length]);

  const addToast = useCallback((message: string, duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    parseFile(file);
  }, [parseFile]);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-[1400px] mx-auto">
        <Header
          onSettings={() => setShowSettings(true)}
          isDark={theme.isDark}
          onToggleTheme={theme.toggle}
        />

        <FileUpload onFileSelect={handleFileSelect} hasFile={!!fileInfo} />

        {isLoading && <LoadingModal isOpen={true} />}

        {fileInfo && <DataInfo info={fileInfo} />}

        {fileInfo && (
          <FilterPanel
            filters={filters.filters}
            uniqueWitels={filters.uniqueWitels}
            uniqueTypes={filters.uniqueTypes}
            uniqueStatuses={filters.uniqueStatuses}
            onWitelChange={filters.setWitel}
            onDateChange={filters.setDateFrom}
            onSearchChange={filters.setSearch}
            onToggleType={filters.toggleType}
            onToggleStatus={filters.toggleStatus}
            onReset={filters.resetFilter}
          />
        )}

        {fileInfo && (
          <DataTables
            data={data}
            headers={headers}
            filteredData={filters.filteredData}
            onToast={addToast}
          />
        )}

        {/* Footer */}
        <footer className="text-center mt-8 py-4 px-4 border-t border-gray-200 dark:border-[#1e2d45]">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Filter EBIS</p>
          <p className="text-xs text-gray-400">
            © 2026 <span className="font-medium text-gray-500 dark:text-gray-400">Reihan x Dheo</span>
            {' · '}
          </p>
        </footer>
      </div>

      {/* Chat */}
      <ChatAssistant
        messages={chat.messages}
        draft={chat.draft}
        isTyping={chat.isTyping}
        isDataAttached={chat.isDataAttached}
        isOpen={chat.isOpen}
        isMaximized={chat.isMaximized}
        setDraft={chat.setDraft}
        toggleChat={chat.toggleChat}
        toggleMaximize={chat.toggleMaximize}
        sendMessage={chat.sendMessage}
        clearChat={chat.clearChat}
        exportChat={chat.exportChat}
        handleCommand={chat.handleCommand}
        speech={speech}
        onToast={addToast}
      />

      {/* Settings */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDark={theme.isDark}
        onToggleTheme={theme.toggle}
        aiProvider={chat.aiProvider}
        onProviderChange={chat.setAiProvider}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
