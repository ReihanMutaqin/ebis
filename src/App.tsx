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
    rows.forEach(r => {
      const s = r['STATUS RESUME'] || 'KOSONG';
      const sto = r['STO'] || 'KOSONG';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      stoCounts[sto] = (stoCounts[sto] || 0) + 1;
    });
    const st = Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(', ');
    const sto = Object.entries(stoCounts).map(([k, v]) => `${k}: ${v}`).join(', ');
    return `Total data: ${rows.length} baris. Status: [${st}]. STO: [${sto}].`;
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
            onQuickModo={filters.quickModo}
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
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Filter Sakti EBIS</p>
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
        apiKey={chat.apiKey}
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
        apiKey={chat.apiKey}
        onApiKeyChange={chat.setApiKey}
        isDark={theme.isDark}
        onToggleTheme={theme.toggle}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
