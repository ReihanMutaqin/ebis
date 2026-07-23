import React, { useState, useEffect } from "react";
import { Lock, User, Key, LogIn, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";
import { verifyAdminLogin } from "../../lib/db";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function isDashboardAuthenticated(): boolean {
  return localStorage.getItem("ebis_dashboard_auth") === "true";
}

export function setDashboardAuthenticated(status: boolean): void {
  if (status) {
    localStorage.setItem("ebis_dashboard_auth", "true");
  } else {
    localStorage.removeItem("ebis_dashboard_auth");
  }
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [authenticated, setAuthenticated] = useState<boolean>(isDashboardAuthenticated());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthenticated(isDashboardAuthenticated());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isValid = await verifyAdminLogin(username, password);
      if (isValid) {
        setDashboardAuthenticated(true);
        setAuthenticated(true);
      } else {
        setError("Username atau password salah!");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat memverifikasi login.");
    } finally {
      setLoading(false);
    }
  };

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Decorative Background Blur */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-2xl opacity-20"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-2xl opacity-20"></div>

        <div className="relative text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Login Dashboard Manager</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Masukkan akun kredensial untuk mengakses data & ringkasan Manager.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 animate-in shake duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5 relative" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-slate-800 bg-slate-50/50 transition-all outline-none"
                placeholder="Masukkan username (contoh: admin)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-slate-800 bg-slate-50/50 transition-all outline-none"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 px-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Masuk ke Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Hubungi Admin jika butuh akses: <code>@Rei219</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
