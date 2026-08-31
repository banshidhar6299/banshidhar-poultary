import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  ClipboardList,
  Receipt,
  Layers,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
  MessageSquare,
  MessageCircle,
  Mic
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatINR, formatDate } from '../../api/client';
import { BalanceSummary, ChickBatch, Order, RateCard } from '../../types';
import { WeightCalculator } from '../../components/WeightCalculator';
import { ChickLoader } from '../../components/ChickLoader';

export const FarmerHomePage: React.FC = () => {
  const { user } = useAuth();
  const { t, isHindi } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [activeBatch, setActiveBatch] = useState<ChickBatch | null>(null);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [rates, setRates] = useState<RateCard[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [ledgerRes, batchRes, orderRes, rateRes] = await Promise.all([
          api.get(`/ledger/farmer/${user.id || (user as any)._id}`),
          api.get('/batches?status=ACTIVE'),
          api.get('/orders?limit=1'),
          api.get('/rates/active')
        ]);

        if (ledgerRes.data.success) {
          setBalance(ledgerRes.data.data.balanceSummary);
        }
        if (batchRes.data.success && batchRes.data.data.length > 0) {
          setActiveBatch(batchRes.data.data[0]);
        }
        if (orderRes.data.success && orderRes.data.data.length > 0) {
          setRecentOrder(orderRes.data.data[0]);
        }
        if (rateRes.data.success) {
          setRates(rateRes.data.data);
        }
      } catch (err) {
        console.error('Error loading farmer home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) return <ChickLoader text="Loading your portal..." />;

  const isDue = balance ? balance.netBalance > 0 : false;
  const isAdvance = balance ? balance.netBalance < 0 : false;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Card */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-200 uppercase tracking-widest block mb-1">
            {t.farmer.welcome}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            {user?.name}
          </h1>
          <p className="text-xs text-brand-200 mt-1">
            {user?.farmName ? `${user.farmName} · ` : ''} {user?.village}, {user?.district}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/farmer/products"
            className="px-4 py-2.5 rounded-2xl bg-white text-brand-900 font-extrabold text-xs shadow-md hover:bg-brand-50 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-brand-600" />
            <span>{t.farmer.orderNow}</span>
          </Link>

          <Link
            to="/farmer/batches"
            className="px-4 py-2.5 rounded-2xl bg-brand-600/60 hover:bg-brand-600 text-white font-bold text-xs border border-brand-400/30 transition-all flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>{isHindi ? 'बैच स्थिति' : 'Flock Status'}</span>
          </Link>
        </div>
      </div>

      {/* 2. Prominent Due / Advance Passbook Summary Card (Spec #62, #96) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div
          className={`md:col-span-2 p-6 rounded-3xl border shadow-lg flex flex-col justify-between ${
            isDue
              ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-slate-900 border-red-200 dark:border-red-900/60 shadow-red-500/5'
              : isAdvance
              ? 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 border-emerald-200 dark:border-emerald-900/60 shadow-emerald-500/5'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                  isDue
                    ? 'text-red-700 dark:text-red-400'
                    : isAdvance
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isDue
                  ? t.farmer.dueBalance
                  : isAdvance
                  ? t.farmer.advanceBalance
                  : t.farmer.clearBalance}
              </span>

              <p
                className={`text-3xl sm:text-4xl font-black font-display tracking-tight ${
                  isDue
                    ? 'text-red-600 dark:text-red-400'
                    : isAdvance
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {formatINR(Math.abs(balance?.netBalance || 0))}
              </p>
            </div>

            <Link
              to="/farmer/ledger"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>{t.farmer.viewLedger}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {t.ledger.totalPurchases}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatINR(balance?.totalDebit || 0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {t.ledger.totalPayments}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatINR(balance?.totalCredit || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Active Flock Summary */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {t.farmer.activeFlock}
              </span>
              {activeBatch && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold text-[10px]">
                  {activeBatch.status}
                </span>
              )}
            </div>

            {activeBatch ? (
              <div className="space-y-2 my-2">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {activeBatch.batchNumber}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-2xl font-black font-display text-brand-600 dark:text-brand-400">
                      {activeBatch.approxAgeDays || 0}
                    </span>
                    <span className="block text-[10px] text-slate-400">{t.farmer.daysOld}</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {activeBatch.chicksSupplied}
                    </span>
                    <span className="block text-[10px] text-slate-400">{t.farmer.chicksSupplied}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400">
                {isHindi ? 'वर्तमान में कोई सक्रिय बैच नहीं है।' : 'No active flock batch currently.'}
              </div>
            )}
          </div>

          <Link
            to="/farmer/batches"
            className="mt-3 block text-center py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all"
          >
            {isHindi ? 'बिक्री सूचना भेजें / बैच देखें' : 'Manage Flock / Inform Sale'}
          </Link>
        </div>
      </div>

      {/* 3. Dealership Quick Direct Chat Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-800 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-700/50">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-white/10 text-emerald-300 backdrop-blur-md shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {isHindi ? 'डीलरशिप से सीधी बातचीत (Live Chat & Voice Notes)' : 'Direct 1-on-1 Chat with Dealer'}
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              {isHindi
                ? 'चूजा, दाना डिलीवरी, बिल पर्ची या आपातकालीन सहायता के लिए एडमिन को वॉयस नोट, फोटो या मैसेज भेजें।'
                : 'Send text messages, audio voice notes, and flock photos directly to Banshidhar Poultry admin.'}
            </p>
          </div>
        </div>

        <Link
          to="/farmer/messages"
          className="px-6 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2 shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-emerald-700" />
          <span>{isHindi ? 'मैसेज भेजें (Chat Now)' : 'Open Dealer Chat'}</span>
        </Link>
      </div>

      {/* 4. Today's Rates Mini Board */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <span>{t.farmer.quickRates}</span>
          </h3>
          <span className="text-[10px] text-slate-400">
            {isHindi ? 'दैनिक डीलर भाव' : 'Daily Dealer Price'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rates.map((rate) => (
            <div
              key={rate._id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-center"
            >
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block line-clamp-1">
                {isHindi && rate.titleHi ? rate.titleHi : rate.title}
              </span>
              <span className="text-xl font-black font-display text-brand-600 dark:text-brand-400 mt-1 block">
                {formatINR(rate.rate)}
              </span>
              <span className="text-[9px] text-slate-400 block">
                / {isHindi && rate.unitHi ? rate.unitHi : rate.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Automatic Weight x Rate Calculator */}
      <WeightCalculator defaultRate={rates[0]?.rate || 120} />
    </div>
  );
};
