import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  PlusCircle,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Download,
  CheckCircle2,
  Phone,
  ArrowRight
} from 'lucide-react';
import { api, formatINR } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ChickLoader } from '../../components/ChickLoader';

interface DashboardData {
  totalReceivable: number;
  totalAdvance: number;
  activeFarmers: number;
  totalFarmers: number;
  totalProducts: number;
  todayCollections: number;
  dueFarmersCount: number;
  advanceFarmersCount: number;
}

export const AdminDashboardPage: React.FC = () => {
  const { isHindi } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [khataRes, prodRes] = await Promise.all([
          api.get('/ledger/khatabook/overview?filterType=ALL'),
          api.get('/products')
        ]);

        const metrics = khataRes.data.success ? khataRes.data.data.metrics : null;
        const productsList = prodRes.data.success ? prodRes.data.data : [];

        setData({
          totalReceivable: metrics?.totalReceivable || 0,
          totalAdvance: metrics?.totalAdvance || 0,
          activeFarmers: metrics?.totalFarmers || 0,
          totalFarmers: metrics?.totalFarmers || 0,
          totalProducts: productsList.length || 0,
          todayCollections: metrics?.todayCollectionAmount || 0,
          dueFarmersCount: metrics?.dueFarmersCount || 0,
          advanceFarmersCount: metrics?.advanceFarmersCount || 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

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

  if (loading) return <ChickLoader text={isHindi ? 'डैशबोर्ड लोड हो रहा है...' : 'Loading dashboard...'} />;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'प्रबंधन डैशबोर्ड' : 'Executive Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? 'बंशीधर पोल्ट्री व्यापार, किसान खाताबही एवं दैनिक संचालन का संपूर्ण विवरण'
              : 'Overview of dealership metrics, farmer accounts, and ledger operations'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/khatabook"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-2xl shadow-lg shadow-brand-600/30 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isHindi ? 'खाताबही खोलें' : 'Open Khatabook'}</span>
          </Link>
          <Link
            to="/admin/farmers"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>{isHindi ? 'नया किसान' : 'Add Farmer'}</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Financial & Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Receivable (Due from farmers) */}
        <div className="p-5 rounded-3xl bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-red-700 dark:text-red-300 uppercase tracking-wider">
              {isHindi ? 'मार्केट बकाया (लेना है)' : 'Total Receivable (Due)'}
            </span>
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-red-700 dark:text-red-300 mt-2">
            {formatINR(data?.totalReceivable || 0)}
          </p>
          <span className="text-[11px] text-red-600/80 dark:text-red-400/80 font-semibold block mt-1">
            {data?.dueFarmersCount || 0} {isHindi ? 'किसानों पर बकाया' : 'Farmers with pending balance'}
          </span>
        </div>

        {/* Card 2: Total Advance */}
        <div className="p-5 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              {isHindi ? 'एडवांस जमा (देना है)' : 'Total Advance Balance'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-emerald-700 dark:text-emerald-300 mt-2">
            {formatINR(data?.totalAdvance || 0)}
          </p>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold block mt-1">
            {data?.advanceFarmersCount || 0} {isHindi ? 'किसानों का अग्रिम जमा' : 'Farmers in advance credit'}
          </span>
        </div>

        {/* Card 3: Active Farmers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {isHindi ? 'कुल किसान खाते' : 'Total Farmers'}
            </span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white mt-2">
            {data?.activeFarmers || 0}
          </p>
          <Link
            to="/admin/farmers"
            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-bold block mt-1"
          >
            {isHindi ? 'किसान सूची देखें →' : 'View farmer accounts →'}
          </Link>
        </div>

        {/* Card 4: Total Products */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {isHindi ? 'कुल उत्पाद (कैटलॉग)' : 'Active Products'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white mt-2">
            {data?.totalProducts || 0}
          </p>
          <Link
            to="/admin/products"
            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-bold block mt-1"
          >
            {isHindi ? 'उत्पाद रेट प्रबंधित करें →' : 'Manage products & rates →'}
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tile 1: Issue Goods */}
        <Link
          to="/admin/khatabook"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isHindi ? 'सामान दिया (Issue Goods)' : 'Issue Goods / Delivery'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHindi ? 'दाना, दवाई व चूजा बिल एंट्री' : 'Add product delivery entry'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Tile 2: Payment Received */}
        <Link
          to="/admin/khatabook"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isHindi ? 'जमा लिया (Clear Dues)' : 'Record Payment / Clear Dues'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHindi ? 'नकद, UPI एवं बैंक भुगतान दर्ज करें' : 'Cash & online payment collection'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Tile 3: Direct Messages */}
        <Link
          to="/admin/messages"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isHindi ? 'किसान संदेश (Farmer Chat)' : 'Farmer Chat & Support'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHindi ? 'किसानों के साथ 1-on-1 लाइव बातचीत' : 'Direct messages and audio notes'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* PWA App Install Banner */}
      {!isInstalled && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-700/40">
          <div>
            <h3 className="text-base font-bold text-white">
              {isHindi ? '📱 बंशीधर एडमिन वेब ऐप इंस्टॉल करें' : '📱 Install Banshidhar Admin Web App'}
            </h3>
            <p className="text-xs text-brand-200 mt-1">
              {isHindi
                ? 'अपने मोबाइल या कंप्यूटर पर ऐप की तरह सीधे होम स्क्रीन से तेज़ एक्सेस करें।'
                : 'Fast, native app-like experience with 1-tap launch from your home screen.'}
            </p>
          </div>

          <button
            onClick={handleInstallApp}
            className="px-6 py-3 bg-white hover:bg-brand-50 text-brand-950 font-black text-xs rounded-2xl shadow-md transition-all shrink-0 active:scale-95 flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>{isHindi ? 'एडमिन ऐप इंस्टॉल करें' : 'Install Admin App'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default AdminDashboardPage;
