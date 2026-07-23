import { CheckCircle2, AlertTriangle, Loader2, Send, ShieldCheck } from "lucide-react";

export interface StatusModalState {
  isOpen: boolean;
  status: "loading" | "success" | "error";
  title: string;
  message: string;
  count?: number;
}

export interface StatusModalProps extends StatusModalState {
  onClose: () => void;
}

export function StatusModal({ isOpen, status, title, message, count, onClose }: StatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Top Glow Accent */}
        {status === "loading" && (
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
        )}
        {status === "success" && (
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl"></div>
        )}
        {status === "error" && (
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl"></div>
        )}

        <div className="relative text-center space-y-4 py-2">
          
          {/* Icon Area */}
          <div className="flex justify-center">
            {status === "loading" && (
              <div className="relative flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl text-blue-600 shadow-inner">
                <Send className="w-10 h-10 animate-bounce text-blue-600" />
                <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/40 animate-ping"></div>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-2xl text-emerald-600 shadow-lg shadow-emerald-500/20 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center justify-center w-20 h-20 bg-rose-50 rounded-2xl text-rose-600 shadow-lg shadow-rose-500/20 animate-in zoom-in duration-300">
                <AlertTriangle className="w-10 h-10 text-rose-600" />
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Count Badge (if present) */}
          {count !== undefined && count > 0 && status === "success" && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{count} Pengguna Telegram Terkirim</span>
            </div>
          )}

          {/* Loading Animation Spinner */}
          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 text-blue-600 text-xs font-bold pt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memproses pengiriman...</span>
            </div>
          )}

          {/* Action Button */}
          {status !== "loading" && (
            <div className="pt-3">
              <button
                onClick={onClose}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-98 cursor-pointer ${
                  status === "success"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
                    : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-slate-500/25"
                }`}
              >
                Oke, Mengerti
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
