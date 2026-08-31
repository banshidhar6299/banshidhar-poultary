import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Globe,
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  LogOut,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ChickLogo } from './ChickLogo';

interface NavbarProps {
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ logoUrl }) => {
  const { language, setLanguage, t, isHindi } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isFarmer, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { href: '/', label: isHindi ? 'होम' : 'Home' },
    { href: '/#rates', label: isHindi ? 'आज का भाव' : "Today's Rates" },
    { href: '/#products', label: isHindi ? 'उत्पाद' : 'Products' },
    { href: '/#calculator', label: isHindi ? 'कैलकुलेटर' : 'Calculator' },
    { href: '/#about', label: isHindi ? 'परिचय' : 'About Us' },
    { href: '/#contact', label: isHindi ? 'संपर्क' : 'Contact' }
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors shadow-sm select-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 h-14 sm:h-16 gap-1.5 sm:gap-3">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2 group shrink-0 min-w-0 py-1">
          <ChickLogo size={32} logoUrl={logoUrl} />
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-display text-xs sm:text-base font-black tracking-tight text-slate-950 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate leading-tight">
              BANSHIDHAR POULTRY
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase hidden sm:block leading-none mt-0.5">
              DEALERSHIP & FARMER PORTAL
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink min-w-0">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title="Switch Language (English / Hindi)"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 app-touch-active"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
          </button>

          {/* Theme Toggle (Desktop only) */}
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            className="hidden sm:flex items-center justify-center p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors app-touch-active"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-brand-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Monitor className="w-4 h-4" />
            )}
          </button>

          {/* Auth Button */}
          {isAuthenticated ? (
            <Link
              to={isAdmin ? '/admin' : '/farmer'}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm transition-all whitespace-nowrap app-touch-active"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdmin ? 'Admin' : user?.name?.split(' ')[0] || 'Portal'}</span>
            </Link>
          ) : (
            <Link
              to="/farmer/login"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm transition-all whitespace-nowrap app-touch-active"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t.nav.farmerLogin}</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg app-touch-active"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={cycleTheme}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-brand-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>
          </div>

          <div className="space-y-1 py-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <Link
                to={isAdmin ? '/admin' : '/farmer'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
              >
                {isAdmin ? '👑 Admin Dashboard' : '👨‍🌾 Farmer Portal'}
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="px-3 py-2.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link
                to="/farmer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
              >
                👨‍🌾 {t.nav.farmerLogin}
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600"
              >
                👑 Admin Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
