import { useState } from 'react';
import { CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface SyncResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: { 
    added: number; 
    duplicates: number; 
    unchanged: number;
    addedItems?: any[];
    updatedItems?: any[];
    skippedItems?: any[];
  } | null;
}

export function SyncResultModal({ isOpen, onClose, result }: SyncResultModalProps) {
  if (!isOpen || !result) return null;

  const [activeDetail, setActiveDetail] = useState<'added' | 'duplicates' | 'unchanged' | null>(null);

  const total = result.added + result.duplicates;
  const isAllExists = total === 0;

  const toggleDetail = (type: 'added' | 'duplicates' | 'unchanged') => {
    setActiveDetail(prev => prev === type ? null : type);
  };

  const renderDetailList = (items: any[] | undefined, emptyMessage: string) => {
    if (!items || items.length === 0) return <div className="text-sm text-slate-500 py-2">{emptyMessage}</div>;
    return (
      <div className="mt-2 max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="text-xs p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="font-medium text-slate-700 dark:text-slate-300">{item['ORDER'] || 'Unknown Order'}</span>
            <span className="text-slate-500 truncate max-w-[150px]" title={item['NAMA CUST']}>{item['NAMA CUST'] || item['STATUS RESUME'] || ''}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className={`p-6 text-center ${isAllExists ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white dark:bg-slate-700 shadow-sm ring-4 ring-white dark:ring-slate-800">
            {isAllExists ? (
              <Info className="w-8 h-8 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAllExists ? 'Data Sudah Tersedia' : 'Sinkronisasi Berhasil!'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isAllExists 
              ? 'Seluruh data yang Anda export sudah tersimpan sebelumnya di Tracker (Tidak ada data baru atau perubahan).'
              : 'Data dari file yang di-filter telah sukses dikirim ke database Tracker.'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {/* Added */}
            <div className="border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/50 overflow-hidden transition-all">
              <button 
                onClick={() => toggleDetail('added')}
                disabled={result.added === 0}
                className="w-full flex items-center justify-between p-3.5 focus:outline-none hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Data Baru Ditambahkan
                  {result.added > 0 && (activeDetail === 'added' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
                <span className={`text-lg font-black ${result.added > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {result.added}
                </span>
              </button>
              {activeDetail === 'added' && result.added > 0 && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-100 dark:border-slate-600/50">
                  {renderDetailList(result.addedItems, 'Tidak ada data baru')}
                </div>
              )}
            </div>

            {/* Updated */}
            <div className="border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/50 overflow-hidden transition-all">
              <button 
                onClick={() => toggleDetail('duplicates')}
                disabled={result.duplicates === 0}
                className="w-full flex items-center justify-between p-3.5 focus:outline-none hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Data Diperbarui (Update)
                  {result.duplicates > 0 && (activeDetail === 'duplicates' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
                <span className={`text-lg font-black ${result.duplicates > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {result.duplicates}
                </span>
              </button>
              {activeDetail === 'duplicates' && result.duplicates > 0 && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-100 dark:border-slate-600/50">
                  {renderDetailList(result.updatedItems, 'Tidak ada data diperbarui')}
                </div>
              )}
            </div>

            {/* Skipped */}
            <div className="border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/50 overflow-hidden transition-all">
              <button 
                onClick={() => toggleDetail('unchanged')}
                disabled={result.unchanged === 0}
                className="w-full flex items-center justify-between p-3.5 focus:outline-none hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Data Sudah Ada (Dilewati)
                  {result.unchanged > 0 && (activeDetail === 'unchanged' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
                <span className={`text-lg font-black ${result.unchanged > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {result.unchanged}
                </span>
              </button>
              {activeDetail === 'unchanged' && result.unchanged > 0 && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-100 dark:border-slate-600/50">
                  {renderDetailList(result.skippedItems, 'Tidak ada data dilewati')}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold shadow-sm transition-all hover:shadow focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
          >
            Tutup & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
