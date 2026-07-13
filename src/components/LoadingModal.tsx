interface LoadingModalProps {
  isOpen: boolean;
}

export function LoadingModal({ isOpen }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0d1526] p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xl border border-gray-100 dark:border-[#1e2d45] min-w-[200px]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">Memuat Data</h5>
        <p className="text-gray-400 text-xs">Mohon tunggu sebentar...</p>
      </div>
    </div>
  );
}
