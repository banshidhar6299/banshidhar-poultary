import React, { useState, useEffect } from 'react';
import {
  Download,
  Receipt,
  Calendar,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Share2,
  BookOpen,
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatINR, formatDate } from '../../api/client';
import { LedgerTransaction, BalanceSummary } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const FarmerLedgerPage: React.FC = () => {
  const { user } = useAuth();
  const { t, isHindi } = useLanguage();

  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const loadLedger = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const farmerId = user.id || (user as any)._id;
      let url = `/ledger/farmer/${farmerId}?`;
      if (fromDate) url += `fromDate=${fromDate}&`;
      if (toDate) url += `toDate=${toDate}&`;
      if (typeFilter && typeFilter !== 'ALL') url += `type=${typeFilter}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setTransactions(res.data.data.transactions);
        setBalanceSummary(res.data.data.balanceSummary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [user, fromDate, toDate, typeFilter]);

  const handleDownloadPDF = async () => {
    if (!user) return;
    setDownloadingPDF(true);
    try {
      const farmerId = user.id || (user as any)._id;
      let url = `/ledger/farmer/${farmerId}/pdf?`;
      if (fromDate) url += `fromDate=${fromDate}&`;
      if (toDate) url += `toDate=${toDate}&`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Khatabook_Passbook_${user.farmerId || 'Farmer'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF statement.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!balanceSummary || !user) return;
    const isDue = balanceSummary.netBalance > 0;
    const balanceText = isDue
      ? `बकाया राशि: ₹${balanceSummary.amountDue}`
      : `एडवांस राशि: ₹${balanceSummary.advanceAmount}`;

    const text = encodeURIComponent(
      `*बंशीधर पोल्ट्री डिजिटल खाताबही (Passbook)*\n` +
      `किसान: ${user.name} (${user.farmerId})\n` +
      `कुल खरीद (नामे): ₹${balanceSummary.totalDebit}\n` +
      `कुल जमा (भुगतान): ₹${balanceSummary.totalCredit}\n` +
      `वर्तमान स्थिति: *${balanceText}*\n\n` +
      `पूरा विवरण देखें: http://localhost:5173/farmer/ledger`
    );

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const setPresetRange = (preset: 'THIS_MONTH' | 'LAST_30' | 'ALL') => {
    if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
      return;
    }
    const end = new Date();
    const start = new Date();
    if (preset === 'THIS_MONTH') {
      start.setDate(1);
    } else if (preset === 'LAST_30') {
      start.setDate(start.getDate() - 30);
    }
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  if (loading) return <ChickLoader text={isHindi ? 'आपकी खाताबही लोड हो रही है...' : 'Loading your khatabook...'} />;

  const isDue = balanceSummary ? balanceSummary.netBalance > 0 : false;
  const isAdvance = balanceSummary ? balanceSummary.netBalance < 0 : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              {isHindi ? 'मेरी खाताबही (Digital Khatabook)' : 'My Digital Khatabook'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? 'दाना, चूजा, नकद भुगतान, मुर्गी बिक्री जमा एवं शेष हिसाब का संपूर्ण डिजिटल खाता'
              : 'Complete ledger record of feed, chicks, payments, bird sales, and running balance'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* WhatsApp Share */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 transition-all shadow-sm"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPDF ? 'Generating PDF...' : isHindi ? 'पासबुक PDF डाउनलोड' : 'Download PDF Passbook'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Purchases / Udhar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isHindi ? 'कुल माल लिया (उधार / नामे)' : 'Total Purchases (Debit)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-display text-slate-900 dark:text-white">
            {formatINR(balanceSummary?.totalDebit || 0)}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            {isHindi ? 'दाना व चूजा खरीद कुल योग' : 'Total feed & chick supplies'}
          </p>
        </div>

        {/* Total Payments / Jama */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {isHindi ? 'कुल जमा किया (भुगतान / जमा)' : 'Total Payments (Credit)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400">
            {formatINR(balanceSummary?.totalCredit || 0)}
          </span>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-semibold">
            {isHindi ? 'नकद, ऑनलाइन एवं मुर्गी बिक्री जमा' : 'Cash, UPI, & bird sale credits'}
          </p>
        </div>

        {/* Net Balance */}
        <div
          className={`p-5 rounded-3xl border shadow-md ${
            isDue
              ? 'bg-red-50/90 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
              : isAdvance
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider">
              {isDue
                ? isHindi ? 'आपका कुल बकाया (Due Balance)' : 'Total Due Balance'
                : isAdvance
                ? isHindi ? 'आपका एडवांस जमा (Advance)' : 'Advance Balance'
                : isHindi ? 'हिसाब चुकता (Settled)' : 'Settled Balance'}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg ${
              isDue ? 'bg-red-200/60 text-red-800 dark:bg-red-900/60 dark:text-red-200' : 'bg-emerald-200/60 text-emerald-800'
            }`}>
              {isDue ? 'देना है' : isAdvance ? 'जमा है' : '0.00'}
            </span>
          </div>
          <span className="text-2xl font-black font-display tracking-tight">
            {formatINR(Math.abs(balanceSummary?.netBalance || 0))}
          </span>
          <p className="text-[10px] opacity-80 mt-1 font-semibold">
            {isDue
              ? isHindi ? 'डीलर को भुगतान किया जाना शेष है' : 'Pending payment to dealership'
              : isAdvance
              ? isHindi ? 'डीलर के पास आपका अतिरिक्त जमा है' : 'Advance deposit with dealership'
              : isHindi ? 'कोई बकाया नहीं है' : 'All accounts settled'}
          </p>
        </div>
      </div>

      {/* Filter and Range Controls */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: isHindi ? 'सभी प्रविष्टियां (All)' : 'All Entries' },
            { id: 'PRODUCT_PURCHASE', label: isHindi ? '🔴 दाना खरीद' : 'Feed Purchases' },
            { id: 'CHICK_PURCHASE', label: isHindi ? '🔴 चूजा आपूर्ति' : 'Chicks' },
            { id: 'PAYMENT_RECEIVED', label: isHindi ? '🟢 नकद/UPI जमा' : 'Payments Done' },
            { id: 'BIRD_SALE_CREDIT', label: isHindi ? '🐔 मुर्गी बिक्री जमा' : 'Bird Sale Credit' },
            { id: 'DISCOUNT', label: isHindi ? '🎁 छूट' : 'Discounts' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setTypeFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === pill.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Date Range Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isHindi ? 'तारीख:' : 'Date:'}</span>
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
            <span className="text-slate-400">से</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPresetRange('THIS_MONTH')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-[11px]"
            >
              {isHindi ? 'इस महीने' : 'This Month'}
            </button>
            <button
              onClick={() => setPresetRange('LAST_30')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-[11px]"
            >
              {isHindi ? 'पिछले 30 दिन' : 'Last 30 Days'}
            </button>
            {(fromDate || toDate) && (
              <button
                onClick={() => setPresetRange('ALL')}
                className="px-2.5 py-1 rounded-lg text-brand-600 font-bold text-[11px] hover:underline"
              >
                {isHindi ? 'हटाएं' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Passbook Stream */}
      {transactions.length === 0 ? (
        <EmptyState
          title={isHindi ? 'कोई लेन-देन नहीं मिला' : t.ledger.emptyLedger}
          description={isHindi ? 'जैसे ही आपका ऑर्डर या भुगतान दर्ज होगा, यहां दिखाई देगा।' : 'Transactions will appear as soon as orders or payments are recorded.'}
          icon={Receipt}
        />
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isDebit = tx.debit > 0;
            return (
              <div
                key={tx._id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                      isDebit
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-600 border border-red-200/60 dark:border-red-900/60'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200/60 dark:border-emerald-900/60'
                    }`}
                  >
                    {isDebit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {isHindi && tx.descriptionHi ? tx.descriptionHi : tx.description}
                      </p>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                        isDebit ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                      }`}>
                        {isDebit ? (isHindi ? 'उधार' : 'Debit') : (isHindi ? 'जमा' : 'Credit')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{formatDate(tx.transactionDate)}</span>
                      {tx.referenceId && <span>बिल / रसीद: {tx.referenceId}</span>}
                      {tx.quantity && (
                        <span>
                          मात्रा: {tx.quantity} {tx.unit || ''} {tx.rate ? `@ ₹${tx.rate}` : ''}
                        </span>
                      )}
                      {tx.notes && <span className="text-slate-500 italic">· {tx.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <span
                    className={`text-base font-black font-display ${
                      isDebit ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isDebit ? `+ ${formatINR(tx.debit)}` : `- ${formatINR(tx.credit)}`}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>शेष (Balance):</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {formatINR(tx.calculatedRunningBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
