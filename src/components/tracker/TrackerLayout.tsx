import { Link, Outlet } from "react-router";
import { LayoutDashboard, Users, Home, Menu, X, Upload, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";

export default function TrackerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/tracker" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="font-bold text-xl text-slate-800 dark:text-white">EBIS Tracker</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
                <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                  <Upload className="w-4 h-4 mr-2" /> Web Filter
                </Link>
                <Link to="/tracker" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                  <Home className="w-4 h-4 mr-2" /> Tracker Home
                </Link>
                <Link to="/tracker/technician" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                  <Users className="w-4 h-4 mr-2" /> Teknisi
                </Link>
                <Link to="/tracker/manager" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                </Link>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center">
              <button
                onClick={theme.toggle}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Toggle theme"
              >
                {theme.isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center sm:hidden gap-2">
              <button
                onClick={theme.toggle}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition-colors"
              >
                {theme.isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors duration-200">
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block pl-3 pr-4 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400">
                <div className="flex items-center"><Upload className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" /> Web Filter</div>
              </Link>
              <Link to="/tracker" onClick={() => setMobileMenuOpen(false)} className="block pl-3 pr-4 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400">
                <div className="flex items-center"><Home className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" /> Tracker Home</div>
              </Link>
              <Link to="/tracker/technician" onClick={() => setMobileMenuOpen(false)} className="block pl-3 pr-4 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400">
                <div className="flex items-center"><Users className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" /> Teknisi</div>
              </Link>
              <Link to="/tracker/manager" onClick={() => setMobileMenuOpen(false)} className="block pl-3 pr-4 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400">
                <div className="flex items-center"><LayoutDashboard className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" /> Dashboard</div>
              </Link>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
