import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ToastData } from '@/types';

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2">
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
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className="flex items-center gap-2 bg-[#0d6efd] text-white px-4 py-3 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.4)] font-vt text-lg min-w-[200px]"
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
      }}
    >
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="hover:text-black transition-colors">
        <X size={18} />
      </button>
    </div>
  );
}
