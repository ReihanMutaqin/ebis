import { CheckCircle2, Info } from 'lucide-react';

interface SyncResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: { added: number; duplicates: number; unchanged: number } | null;
}

export function SyncResultModal({ isOpen, onClose, result }: SyncResultModalProps) {
  if (!isOpen || !result) return null;

  const total = result.added + result.duplicates;
  const isAllExists = total === 0;

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
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Data Baru Ditambahkan</span>
              <span className={`text-lg font-black ${result.added > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {result.added}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Data Diperbarui (Update)</span>
              <span className={`text-lg font-black ${result.duplicates > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {result.duplicates}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Data Sudah Ada (Dilewati)</span>
              <span className={`text-lg font-black ${result.unchanged > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {result.unchanged}
              </span>
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
