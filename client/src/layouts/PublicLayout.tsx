import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  Calculator,
  ShoppingBag,
  User,
  PhoneCall,
  MessageCircle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AIFloatingButton } from '../components/AIFloatingButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { WebsiteSettings } from '../types';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const [settings, setSettings] = useState<WebsiteSettings | undefined>(undefined);
  const { isHindi } = useLanguage();
  const { isAuthenticated, isFarmer, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    api
      .get('/settings/website')
      .then((res) => {
        if (res.data.success) {
          setSettings(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const publicBottomTabs = [
    { href: '/#rates', label: isHindi ? 'आज का भाव' : 'Rates', icon: TrendingUp },
    { href: '/#calculator', label: isHindi ? 'तौल' : 'Calculator', icon: Calculator },
    { href: '/#products', label: isHindi ? 'उत्पाद' : 'Products', icon: ShoppingBag },
    {
      href: isAuthenticated ? (isAdmin ? '/admin' : '/farmer') : '/farmer/login',
      label: isAuthenticated ? (isAdmin ? 'Dashboard' : 'Portal') : (isHindi ? 'लॉगिन' : 'Login'),
      icon: User,
      isPrimary: true
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16 lg:pb-0">
      <Navbar logoUrl={settings?.logoUrl} />
      <main className="flex-1">
        <Outlet context={{ settings }} />
      </main>
      <Footer settings={settings} />

      {/* Native App Floating Mobile Bottom Bar for Public Website */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 px-2 pt-1.5 pb-safe flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none">
        <a
          href="/"
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all app-touch-active text-slate-600 dark:text-slate-300 hover:text-brand-600"
        >
          <Home className="w-5 h-5 stroke-2" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">{isHindi ? 'होम' : 'Home'}</span>
        </a>

        {publicBottomTabs.map((item) => {
          const Icon = item.icon;
          return item.href.startsWith('/#') ? (
            <a
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all app-touch-active text-slate-600 dark:text-slate-300 hover:text-brand-600"
            >
              <Icon className="w-5 h-5 stroke-2" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">{item.label}</span>
            </a>
          ) : (
            <Link
              key={item.href}
              to={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all app-touch-active ${
                item.isPrimary
                  ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2.5px]" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}

        {/* 1-Click WhatsApp Quick Call Button */}
        {settings?.whatsappNumber && (
          <a
            href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20Banshidhar%20Poultry`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all app-touch-active text-emerald-600 dark:text-emerald-400"
            title="WhatsApp"
          >
            <MessageCircle className="w-5 h-5 stroke-2" />
            <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">WhatsApp</span>
          </a>
        )}
      </nav>

      <AIFloatingButton />
      <OfflineBanner />
    </div>
  );
};
