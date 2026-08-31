import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Scale,
  DollarSign,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Download,
  CheckCircle
} from 'lucide-react';
import { api, formatINR, formatDate } from '../../api/client';
import { DashboardStats } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ChickLoader } from '../../components/ChickLoader';

export const AdminDashboardPage: React.FC = () => {
  const { isHindi } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    api
      .get('/settings/dashboard-stats')
      .then((res) => {
        if (res.data.success) setStats(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

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
          ? 'एडमिन ऐप इंस्टॉल करने के लिए अपने ब्राउज़र मेनू (⋮) पर क्लिक करें और "Install App" या "Add to Home Screen" चुनें।'
          : 'To install Admin app: Click browser menu (⋮) and select "Install App" or "Add to Home Screen".'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'प्रबंधन डैशबोर्ड' : 'Executive Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isHindi ? 'बंशीधर पोल्ट्री व्यापार एवं किसान खाता अवलोकन' : 'Overview of dealership metrics, farmer accounts, and daily operations'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/farmers"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isHindi ? 'नया किसान जोड़ें' : 'Add Farmer'}</span>
          </Link>
          <Link
            to="/admin/rates"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
            <span>{isHindi ? 'आज का रेट अपडेट' : 'Update Rates'}</span>
          </Link>
        </div>
      </div>

      {/* Financial Overview Cards (Receivables vs Advances) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Receivable (Due from farmers) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-slate-900 border border-red-200 dark:border-red-900/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
              {isHindi ? 'कुल बकाया (मार्केट बाकी)' : 'Total Receivable (Due)'}
            </span>
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-red-600 dark:text-red-400 mt-2">
            {formatINR(stats?.totalReceivable || 0)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Across all registered farmers</span>
        </div>

        {/* Card 2: Total Advance */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              {isHindi ? 'कुल एडवांस जमा' : 'Total Advance Balance'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-2">
            {formatINR(stats?.totalAdvance || 0)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Farmer credit deposits</span>
        </div>

        {/* Card 3: Farmers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'कुल किसान' : 'Active Farmers'}
            </span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white mt-2">
            {stats?.activeFarmers || 0}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Total {stats?.totalFarmers || 0} accounts
          </span>
        </div>

        {/* Card 4: Join Applications */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isHindi ? 'नए आवेदन' : 'Pending Join Requests'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-amber-600 mt-2">
            {stats?.pendingJoinRequests || 0}
          </p>
          <Link
            to="/admin/join-requests"
            className="text-[10px] text-brand-600 hover:underline font-bold block mt-1"
          >
            Review applications →
          </Link>
        </div>
      </div>

      {/* Orders Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">{isHindi ? 'आज के ऑर्डर' : "Today's Orders"}</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{stats?.todayOrders || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">{isHindi ? 'लंबित ऑर्डर' : 'Pending Orders'}</span>
            <span className="text-lg font-black text-amber-600">{stats?.pendingOrders || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">{isHindi ? 'कन्फर्म ऑर्डर' : 'Confirmed'}</span>
            <span className="text-lg font-black text-indigo-600">{stats?.confirmedOrders || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">{isHindi ? 'डिलीवर ऑर्डर' : 'Delivered'}</span>
            <span className="text-lg font-black text-emerald-600">{stats?.deliveredOrders || 0}</span>
          </div>
        </div>
      </div>

      {/* Today's Rates Board */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <span>{isHindi ? 'वर्तमान सक्रिय रेट्स' : 'Active Rate Cards'}</span>
          </h3>
          <Link
            to="/admin/rates"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Manage Rates →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(stats?.todayRates || []).map((r) => (
            <div
              key={r._id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-center"
            >
              <span className="text-xs font-bold text-slate-500 block line-clamp-1">{r.title}</span>
              <span className="text-xl font-black font-display text-brand-600 dark:text-brand-400 mt-1 block">
                {formatINR(r.rate)}
              </span>
              <span className="text-[10px] text-slate-400 block">/ {r.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin PWA Standalone App Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isHindi ? 'बंशीधर पोल्ट्री एडमिन ऐप (PWA)' : 'Banshidhar Admin Web App'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              {isHindi
                ? 'अपने मोबाइल या कंप्यूटर पर इस एडमिन पोर्टल को ऐप की तरह बिना ब्राउज़र बार के सीधे होमस्क्रीन पर चलाएं।'
                : 'Install this executive console as a dedicated standalone app on Android, iOS, Windows, or Mac.'}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isInstalled ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>{isHindi ? 'ऐप पहले से इंस्टॉल है' : 'App Installed'}</span>
            </div>
          ) : (
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-extrabold text-xs shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isHindi ? 'एडमिन ऐप इंस्टॉल करें' : 'Install Admin App'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
