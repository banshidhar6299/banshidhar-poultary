import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  ClipboardList,
  BookOpen,
  MessageSquare,
  Globe,
  Sun,
  Moon,
  LogOut,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ChickLogo } from '../components/ChickLogo';
import { NotificationBell } from '../components/NotificationBell';
import { AIFloatingButton } from '../components/AIFloatingButton';
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

  const navItems = [
    { path: '/farmer', label: isHindi ? 'होम' : 'Home', icon: Home, exact: true },
    { path: '/farmer/products', label: isHindi ? 'ऑर्डर' : 'Order', icon: ShoppingBag },
    { path: '/farmer/orders', label: isHindi ? 'ऑर्डर स्थिति' : 'Orders', icon: ClipboardList },
    { path: '/farmer/ledger', label: isHindi ? 'खाताबही (Khatabook)' : 'Khatabook', icon: BookOpen },
    { path: '/farmer/batches', label: isHindi ? 'बैच' : 'Batches', icon: Layers },
    { path: '/farmer/messages', label: isHindi ? 'डीलर चैट' : 'Dealer Chat', icon: MessageSquare }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-8 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 h-16 gap-3">
          {/* Logo & Farmer ID */}
          <Link to="/farmer" className="flex items-center gap-2.5 shrink-0">
            <ChickLogo size={36} />
            <div className="flex flex-col">
              <span className="font-display text-sm font-black tracking-tight text-slate-950 dark:text-white leading-tight whitespace-nowrap">
                BANSHIDHAR POULTRY
              </span>
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase whitespace-nowrap">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* Theme */}
            <button
              onClick={cycleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar */}
            <Link
              to="/farmer/profile"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white font-black text-xs shadow-md hover:ring-2 hover:ring-brand-400 transition-all"
              title="My Profile"
            >
              {user?.name?.charAt(0).toUpperCase() || 'F'}
            </Link>

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                active
                  ? 'text-brand-600 dark:text-brand-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <AIFloatingButton />
      <OfflineBanner />
    </div>
  );
};
