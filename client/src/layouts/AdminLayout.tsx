import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Layers,
  Scale,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Globe,
  Sun,
  Moon,
  KeyRound,
  Download,
  BookOpen,
  UserCheck,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ChickLogo } from '../components/ChickLogo';
import { NotificationBell } from '../components/NotificationBell';
import { api } from '../api/client';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, isHindi } = useLanguage();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Security / Password & Email Modal State
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 15-Minute Reset Email Trigger State
  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [resetEmailSuccess, setResetEmailSuccess] = useState('');

  useEffect(() => {
    if (user?.email) {
      setAdminEmail(user.email);
    }
  }, [user]);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        isHindi
          ? 'एडमिन ऐप इंस्टॉल करने के लिए अपने ब्राउज़र मेनू (⋮ या शेयर आइकन) पर क्लिक करें और "Add to Home Screen" या "Install App" चुनें।'
          : 'To install Admin app: Click browser menu (⋮ / share) and tap "Add to Home Screen" or "Install App".'
      );
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setEmailSuccess('');

    if (!adminEmail || !adminEmail.trim()) {
      setPasswordError('Please enter a valid email address.');
      return;
    }

    setEmailSaving(true);
    try {
      const res = await api.put('/auth/profile', { email: adminEmail.trim() });
      if (res.data.success) {
        setEmailSuccess('Email address saved successfully!');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update email.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        newPassword
      });

      if (res.data.success) {
        setPasswordSuccess('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!adminEmail || !adminEmail.trim()) {
      setPasswordError('Please save a valid email address first.');
      return;
    }

    setResetEmailSending(true);
    setPasswordError('');
    setResetEmailSuccess('');

    try {
      const res = await api.post('/auth/forgot-password', {
        email: adminEmail.trim(),
        role: 'ADMIN'
      });

      if (res.data.success) {
        setResetEmailSuccess(
          isHindi
            ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है (15 मिनट तक मान्य)!'
            : 'Password reset link sent to your email (Valid for 15 minutes)!'
        );
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to send reset link email.');
    } finally {
      setResetEmailSending(false);
    }
  };

  const navItems = [
    { path: '/admin', label: isHindi ? 'डैशबोर्ड' : 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/khatabook', label: isHindi ? 'खाताबही (Khatabook)' : 'Khatabook', icon: BookOpen },
    { path: '/admin/farmers', label: isHindi ? 'किसान (Farmers)' : 'Farmers', icon: Users },
    { path: '/admin/products', label: isHindi ? 'उत्पाद सूची (Products)' : 'Products', icon: ShoppingBag },
    { path: '/admin/messages', label: isHindi ? 'किसान संदेश (Chat)' : 'Messages', icon: MessageSquare },
    { path: '/admin/settings/website', label: isHindi ? 'वेबसाइट सेटिंग्स' : 'Website Settings', icon: Settings }
  ];

  // 4 Primary tabs for Mobile Admin Bottom Bar
  const mobileBottomTabs = [
    { path: '/admin', label: isHindi ? 'डैशबोर्ड' : 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/khatabook', label: isHindi ? 'खाताबही' : 'Khata', icon: BookOpen },
    { path: '/admin/farmers', label: isHindi ? 'किसान' : 'Farmers', icon: Users },
    { path: '/admin/products', label: isHindi ? 'उत्पाद' : 'Products', icon: ShoppingBag }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shrink-0 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <ChickLogo size={36} />
          <div>
            <span className="font-display text-sm font-black text-brand-900 dark:text-white leading-tight block">
              BANSHIDHAR
            </span>
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              ADMIN DASHBOARD
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all app-touch-active ${
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin PWA App Install Button (Sidebar) */}
        {!isInstalled && (
          <div className="pt-2 pb-2">
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 rounded-xl font-bold text-xs shadow-sm transition-all app-touch-active"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHindi ? '📱 एडमिन ऐप डाउनलोड' : '📱 Install Admin App'}</span>
            </button>
          </div>
        )}

        {/* Developed by Nishant Badge */}
        <div className="pt-2 pb-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
          <span>Developed by </span>
          <span className="font-extrabold text-brand-600 dark:text-brand-400">Nishant</span>
        </div>

        {/* Bottom User info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setSecurityModalOpen(true)}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity app-touch-active"
            title="Admin Security & Password"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              A
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-800 dark:text-white leading-tight">Admin</p>
              <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                {isHindi ? 'सुरक्षा / पासवर्ड' : 'Security / Pass'}
              </p>
            </div>
          </button>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 app-touch-active"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Native App Style Top Header */}
        <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 app-touch-active"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile App Logo Header */}
            <div className="flex items-center gap-2 lg:hidden">
              <ChickLogo size={28} />
              <span className="font-display text-xs font-black text-slate-900 dark:text-white tracking-tight">
                BANSHIDHAR ADMIN
              </span>
            </div>

            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 hidden lg:block">
              {isHindi ? 'बंशीधर पोल्ट्री प्रबंधन' : 'Banshidhar Poultry Management'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* PWA Install Button in Header */}
            {!isInstalled && (
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[11px] sm:text-xs font-bold shadow-sm transition-all app-touch-active"
                title="Install Admin Web App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isHindi ? 'एडमिन ऐप' : 'Admin App'}</span>
              </button>
            )}

            {/* Admin Security / Password */}
            <button
              onClick={() => setSecurityModalOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all app-touch-active flex items-center gap-1.5"
              title="Admin Security / Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">{isHindi ? 'पासवर्ड' : 'Password'}</span>
            </button>

            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 app-touch-active"
            >
              <Globe className="w-3 h-3" />
              <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* Theme */}
            <button
              onClick={cycleTheme}
              className="p-1.5 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 app-touch-active"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors app-touch-active"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto pb-24 lg:pb-8 flex flex-col justify-between">
          <div>
            <Outlet />
          </div>

          {/* Admin Bottom Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>© {new Date().getFullYear()} Banshidhar Poultry · Admin Console</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span>Developed by</span>
              <span className="font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800 text-[10px]">
                Nishant
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Native App Mobile Bottom Navigation Bar for Admin */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 px-2 pt-1.5 pb-safe flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] select-none">
        {mobileBottomTabs.map((item) => {
          const active = isActive(item.path, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all app-touch-active relative ${
                active
                  ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {active && (
                <span className="absolute -top-1.5 w-6 h-1 bg-brand-600 dark:bg-brand-400 rounded-full shadow-sm" />
              )}
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px] scale-110' : 'stroke-2'} transition-transform`} />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all app-touch-active text-slate-500 dark:text-slate-400`}
        >
          <MoreHorizontal className="w-5 h-5 stroke-2" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">{isHindi ? 'मेनू' : 'More'}</span>
        </button>
      </nav>

      {/* Slide-over Mobile Navigation Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 flex-1 flex flex-col p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <ChickLogo size={32} />
                <span className="font-black text-xs text-brand-900 dark:text-white">BANSHIDHAR ADMIN</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all app-touch-active ${
                      active
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {!isInstalled && (
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleInstallApp();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 my-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded-xl font-bold text-xs shadow-sm border border-brand-200 dark:border-brand-800"
              >
                <Download className="w-4 h-4" />
                <span>{isHindi ? '📱 एडमिन ऐप इंस्टॉल' : '📱 Install Admin App'}</span>
              </button>
            )}

            <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
              <span>Developed by </span>
              <span className="font-extrabold text-brand-600 dark:text-brand-400">Nishant</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setSecurityModalOpen(true);
                }}
                className="flex items-center gap-2 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs">
                  A
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-white">Admin</p>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400">Security & Password</p>
                </div>
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Password Modal (Bottom Sheet on Mobile) */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-bottom-sheet sm:animate-in sm:zoom-in-95 max-h-[90vh] overflow-y-auto pb-safe">
            {/* Mobile Sheet Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'एडमिन सुरक्षा व पासवर्ड सेटिंग्स' : 'Admin Security & Password'}
                </h3>
              </div>
              <button
                onClick={() => setSecurityModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Registered Email for Password Reset */}
            <form onSubmit={handleSaveEmail} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                📧 {isHindi ? 'पंजीकृत ईमेल (पासवर्ड रीसेट लिंक के लिए)' : 'Registered Email (For Password Recovery)'}
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@banshidharpoultry.com"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {emailSaving ? 'Saving...' : 'Save Email'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  {isHindi ? 'पासवर्ड भूलने पर इसी ईमेल पर 15 मिनट का रीसेट लिंक जाएगा।' : 'Reset links will expire in 15 minutes.'}
                </span>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={resetEmailSending}
                  className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                >
                  {resetEmailSending ? 'Sending...' : isHindi ? 'रीसेट लिंक भेजें →' : 'Send Reset Link →'}
                </button>
              </div>

              {emailSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{emailSuccess}</span>
                </div>
              )}
              {resetEmailSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{resetEmailSuccess}</span>
                </div>
              )}
            </form>

            {/* Direct Password Update */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                🔑 {isHindi ? 'सीधा नया पासवर्ड बदलें (पुराना पासवर्ड आवश्यक नहीं)' : 'Direct Change Password'}
              </span>

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-600 font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'नया पासवर्ड (New Password)' : 'New Password'} *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'पासवर्ड की पुष्टि करें (Confirm Password)' : 'Confirm Password'} *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
