import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ToastData } from '@/types';

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  /* Pick accent color based on content */
  const isSuccess = toast.message.includes('✅');
  const isError   = toast.message.includes('❌');
  const bgColor   = isSuccess ? '#16a34a' : isError ? '#dc2626' : '#1d4ed8';

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 border-[3px] border-black font-vt text-lg text-white min-w-[220px] max-w-[360px]"
      style={{
        background: bgColor,
        boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
        transform: visible ? 'translateX(0)' : 'translateX(130%)',
        opacity:   visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(.22,.68,0,1.2), opacity 0.3s ease',
      }}
    >
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
        title="Tutup"
      >
        <X size={16} />
      </button>
    </div>
  );
}
