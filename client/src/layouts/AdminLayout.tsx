import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Package,
  Tags,
  TrendingUp,
  UserPlus,
  Scale,
  MessageSquare,
  Globe,
  Sun,
  Moon,
  LogOut,
  Sliders,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  Download,
  KeyRound,
  Mail,
  CheckCircle,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { ChickLogo } from '../components/ChickLogo';
import { NotificationBell } from '../components/NotificationBell';
import { OfflineBanner } from '../components/OfflineBanner';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, isHindi } = useLanguage();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Security / Password Modal State
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@banshidharpoultry.com');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailResetSent, setEmailResetSent] = useState(false);
  const [emailResetLoading, setEmailResetLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

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
          ? 'एडमिन ऐप इंस्टॉल करने के लिए अपने ब्राउज़र मेनू (⋮) पर क्लिक करें और "Install Banshidhar Admin" या "Add to Home Screen" चुनें।'
          : 'To install Admin app: Click your browser menu (⋮) and select "Install Banshidhar Admin" or "Add to Home Screen".'
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
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        newPassword
      });
      if (res.data.success) {
        setPasswordSuccess('Admin password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    setEmailResetLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', {
        email: adminEmail || user?.email || 'admin@banshidharpoultry.com',
        role: 'ADMIN'
      });
      if (res.data.success) {
        setEmailResetSent(true);
        if (res.data.devResetUrl) {
          setDevResetUrl(res.data.devResetUrl);
        }
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setEmailResetLoading(false);
    }
  };

  const navItems = [
    { path: '/admin', label: isHindi ? 'डैशबोर्ड' : 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/khatabook', label: isHindi ? 'खाताबही (Khatabook)' : 'Khatabook', icon: BookOpen },
    { path: '/admin/farmers', label: isHindi ? 'किसान प्रबंधन' : 'Farmers', icon: Users },
    { path: '/admin/orders', label: isHindi ? 'ऑर्डर' : 'Orders', icon: ClipboardList },
    { path: '/admin/products', label: isHindi ? 'उत्पाद सूची' : 'Products', icon: Package },
    { path: '/admin/categories', label: isHindi ? 'श्रेणियां' : 'Categories', icon: Tags },
    { path: '/admin/rates', label: isHindi ? 'आज का रेट' : 'Daily Rates', icon: TrendingUp },
    { path: '/admin/join-requests', label: isHindi ? 'पंजीकरण आवेदन' : 'Join Requests', icon: UserPlus },
    { path: '/admin/settlements', label: isHindi ? 'मुर्गी बिक्री निपटान' : 'Bird Settlements', icon: Scale },
    { path: '/admin/messages', label: isHindi ? 'चैट इनबॉक्स' : 'Messages', icon: MessageSquare },
    { path: '/admin/settings/website', label: isHindi ? 'वेबसाइट सेटिंग्स' : 'Website Settings', icon: Sliders },
    { path: '/admin/settings/ai', label: isHindi ? 'AI सहायक सेटिंग्स' : 'AI Settings', icon: Sparkles },
    { path: '/admin/audit', label: isHindi ? 'ऑडिट लॉग्स' : 'Audit Logs', icon: ShieldCheck }
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
      {/* Sidebar for Desktop */}
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
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
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
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHindi ? '📱 एडमिन ऐप डाउनलोड' : '📱 Install Admin App'}</span>
            </button>
          </div>
        )}

        {/* Bottom User info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setSecurityModalOpen(true)}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
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
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
              {isHindi ? 'बंशीधर पोल्ट्री प्रबंधन' : 'Banshidhar Poultry Management'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button in Header */}
            {!isInstalled && (
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                title="Install Admin Web App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isHindi ? 'एडमिन ऐप' : 'Admin App'}</span>
              </button>
            )}

            {/* Admin Security / Password */}
            <button
              onClick={() => setSecurityModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              title="Admin Security / Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">{isHindi ? 'पासवर्ड सेटिंग्स' : 'Password'}</span>
            </button>

            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* Theme */}
            <button
              onClick={cycleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-72 max-w-[80%] bg-white dark:bg-slate-900 p-4 z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <ChickLogo size={32} showText />
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {!isInstalled && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleInstallApp();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>{isHindi ? '📱 एडमिन ऐप डाउनलोड' : '📱 Install Admin App'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Security / Change Password / Email Reset Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'एडमिन पासवर्ड एवं सुरक्षा' : 'Admin Security & Password'}
                </h3>
              </div>
              <button
                onClick={() => setSecurityModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Section 1: Registered Email Address */}
            <form onSubmit={handleSaveEmail} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                {isHindi ? '1. पंजीकृत ईमेल पता (Registered Email)' : '1. Registered Email Address'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHindi ? 'पासवर्ड भूलने पर इसी ईमेल पते पर 15 मिनट का रीसेट लिंक जाएगा।' : 'Password reset link will be sent to this email address.'}
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. admin@banshidharpoultry.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  {emailSaving ? 'Saving...' : 'Save Email'}
                </button>
              </div>
              {emailSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">✓ {emailSuccess}</p>
              )}
            </form>

            {/* Section 2: Change Password (No Current Password needed) */}
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                {isHindi ? '2. नया पासवर्ड सेट करें (Set New Password)' : '2. Set New Password Directly'}
              </span>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  New Password (नया पासवर्ड - कम से कम 6 अक्षर)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Confirm New Password (पासवर्ड दोबारा लिखें)
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                {passwordLoading ? 'Updating...' : 'Update Password Directly'}
              </button>
            </form>

            {/* Section 3: Send Brevo Email Reset Link */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                {isHindi ? '3. ईमेल पर रीसेट लिंक भेजें (15 मिनट तक वैध)' : '3. Send Brevo Reset Link (Valid for 15 mins)'}
              </span>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Send a secure 15-minute password reset link to: <span className="font-bold text-slate-700 dark:text-slate-300">{adminEmail}</span>
              </p>

              {emailResetSent ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Reset email dispatched via Brevo! (Valid for 15 min)</span>
                  </p>
                  <p className="text-[11px]">Check your inbox to create your new password.</p>
                  {devResetUrl && (
                    <div className="pt-1.5 border-t border-emerald-200 dark:border-emerald-800">
                      <a href={devResetUrl} className="text-[10px] font-mono text-brand-600 dark:text-brand-400 underline break-all">
                        {devResetUrl}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={emailResetLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-600" />
                  <span>{emailResetLoading ? 'Dispatching email...' : 'Send Password Reset Email'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <OfflineBanner />
    </div>
  );
};
