import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  MessageSquare,
  Globe,
  Sun,
  Moon,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ChickLogo } from '../components/ChickLogo';
import { NotificationBell } from '../components/NotificationBell';
import { OfflineBanner } from '../components/OfflineBanner';

export const FarmerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, isHindi } = useLanguage();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  // 3 Primary tabs for bottom and top navigation
  const navItems = [
    { path: '/farmer', label: isHindi ? 'मेरी पासबुक' : 'Passbook', icon: BookOpen, exact: true },
    { path: '/farmer/messages', label: isHindi ? 'डीलर चैट' : 'Dealer Chat', icon: MessageSquare },
    { path: '/farmer/profile', label: isHindi ? 'प्रोफ़ाइल' : 'Profile', icon: UserIcon }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path || location.pathname === '/farmer/ledger';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Native App Style Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm select-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 h-14 sm:h-16 gap-2">
          {/* Logo & Farmer Identity */}
          <Link to="/farmer" className="flex items-center gap-2 shrink-0 app-touch-active">
            <ChickLogo size={32} />
            <div className="flex flex-col justify-center">
              <span className="font-display text-xs sm:text-sm font-black tracking-tight text-slate-950 dark:text-white leading-tight whitespace-nowrap">
                BANSHIDHAR
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-brand-600 dark:text-brand-400 uppercase whitespace-nowrap -mt-0.5">
                {user?.farmerId || 'Farmer'} · {user?.name?.split(' ')[0]}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 shrink min-w-0">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                      : 'text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 app-touch-active"
              title="Change Language"
            >
              <Globe className="w-3 h-3" />
              <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* Theme Switch */}
            <button
              onClick={cycleTheme}
              className="p-1.5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 app-touch-active"
              title="Theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Farmer Profile Avatar */}
            <Link
              to="/farmer/profile"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white font-black text-xs shadow-md hover:ring-2 hover:ring-brand-400 transition-all app-touch-active"
              title="My Profile"
            >
              {user?.name?.charAt(0).toUpperCase() || 'F'}
            </Link>

            {/* Logout (Desktop) */}
            <button
              onClick={logout}
              title="Logout"
              className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors app-touch-active"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (With safe padding for mobile bottom bar) */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Native App Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 px-4 pt-1.5 pb-safe flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all app-touch-active relative ${
                active
                  ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Glow */}
              {active && (
                <span className="absolute -top-1.5 w-8 h-1 bg-brand-600 dark:bg-brand-400 rounded-full shadow-sm" />
              )}
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px] scale-110' : 'stroke-2'} transition-transform`} />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <OfflineBanner />
    </div>
  );
};
export default FarmerLayout;
