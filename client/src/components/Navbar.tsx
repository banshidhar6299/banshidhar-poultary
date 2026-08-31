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
  Sparkles
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
    { href: '/', label: isHindi ? 'Home' : 'Home' },
    { href: '/#rates', label: isHindi ? 'Rates (भाव)' : "Today's Rates" },
    { href: '/#products', label: isHindi ? 'Products' : 'Products' },
    { href: '/#calculator', label: isHindi ? 'Calculator' : 'Weight Calculator' },
    { href: '/#about', label: isHindi ? 'About' : 'About Us' },
    { href: '/#join', label: isHindi ? 'Join Farmer' : 'Join Us' },
    { href: '/#contact', label: isHindi ? 'Contact' : 'Contact' }
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 h-16 sm:h-18 gap-2">
        {/* Brand Logo & Title (Fixed no-wrap, robust shrink-0) */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 py-1">
          <ChickLogo size={40} logoUrl={logoUrl} />
          <div className="flex flex-col justify-center">
            <span className="font-display text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors whitespace-nowrap leading-tight">
              BANSHIDHAR POULTRY
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase whitespace-nowrap -mt-0.5">
              DEALERSHIP & FARMER PORTAL
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 shrink min-w-0">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-2.5 py-1.5 text-[11px] xl:text-xs font-bold text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title="Switch Language (English / Hindi)"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            className="flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            <div className="flex items-center gap-1.5">
              <Link
                to={isAdmin ? '/admin' : '/farmer'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-md shadow-brand-600/20 transition-all whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Dashboard' : user?.name?.split(' ')[0] || 'Portal'}</span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/farmer/login"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-md shadow-brand-600/20 transition-all whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t.nav.farmerLogin}</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 rounded-xl transition-colors"
            >
              {link.label}
            </a>
          ))}
          {!isAuthenticated && (
            <Link
              to="/farmer/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center mt-2 px-4 py-2.5 text-sm font-black text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              {t.nav.farmerLogin}
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
