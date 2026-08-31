import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Receipt,
  Calendar,
  Filter,
  Share2,
  BookOpen,
  IndianRupee,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatINR, formatDate, formatDateTime } from '../../api/client';
import { LedgerTransaction, BalanceSummary } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const FarmerLedgerPage: React.FC = () => {
  const { user } = useAuth();
  const { isHindi } = useLanguage();

  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Date Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activePreset, setActivePreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30'>('ALL');

  const loadLedger = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const farmerId = user.id || (user as any)._id;
      let url = `/ledger/farmer/${farmerId}?`;
      if (fromDate) url += `fromDate=${fromDate}&`;
      if (toDate) url += `toDate=${toDate}&`;

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
  }, [user, fromDate, toDate]);

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
      alert(isHindi ? 'पासबुक PDF डाउनलोड करने में विफल।' : 'Failed to download PDF statement.');
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
      `*बंशीधर पोल्ट्री डिजिटल पासबुक*\n` +
      `किसान: ${user.name} (${user.farmerId})\n` +
      `कुल खरीद (नामे): ₹${balanceSummary.totalDebit}\n` +
      `कुल जमा (भुगतान): ₹${balanceSummary.totalCredit}\n` +
      `वर्तमान स्थिति: *${balanceText}*\n\n` +
      `डिजिटल पासबुक देखें: ${window.location.origin}/farmer`
    );

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const setPresetRange = (preset: 'THIS_MONTH' | 'LAST_30' | 'ALL') => {
    setActivePreset(preset);
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

  if (loading) return <ChickLoader text={isHindi ? 'आपकी डिजिटल पासबुक लोड हो रही है...' : 'Loading your passbook...'} />;

  const isDue = balanceSummary ? balanceSummary.netBalance > 0 : false;
  const isAdvance = balanceSummary ? balanceSummary.netBalance < 0 : false;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              {isHindi ? 'मेरी डिजिटल पासबुक (Passbook)' : 'My Digital Passbook'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? `नमस्ते ${user?.name} जी, आपके दाना-चूजा खरीद, नकद भुगतान और शेष खाते का संपूर्ण विवरण`
              : `Welcome ${user?.name}, your complete ledger of supplies, payments, and outstanding dues`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Chat with Dealer Shortcut */}
          <Link
            to="/farmer/messages"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <span>{isHindi ? 'डीलर चैट' : 'Chat'}</span>
          </Link>

          {/* WhatsApp Share */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 transition-all shadow-sm"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPDF ? (isHindi ? 'PDF बन रही है...' : 'Generating...') : (isHindi ? 'पासबुक PDF डाउनलोड' : 'Download PDF')}</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Purchases (सामान लिया) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isHindi ? 'कुल सामान लिया (नामे)' : 'Total Purchases (Debit)'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
            {formatINR(balanceSummary?.totalDebit || 0)}
          </span>
          <p className="text-[11px] text-slate-400 mt-1 font-semibold">
            {isHindi ? 'दाना, चूजा व दवाई का कुल योग' : 'Total supplies delivered'}
          </p>
        </div>

        {/* Total Payments (जमा किया) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {isHindi ? 'कुल जमा किया (भुगतान)' : 'Total Payments (Credit)'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black font-display text-emerald-600 dark:text-emerald-400">
            {formatINR(balanceSummary?.totalCredit || 0)}
          </span>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-semibold">
            {isHindi ? 'नकद एवं ऑनलाइन जमा भुगतान' : 'Total payments cleared'}
          </p>
        </div>

        {/* Net Outstanding Balance Card */}
        <div
          className={`p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all ${
            isDue
              ? 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
              : isAdvance
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDue
                  ? 'text-red-700 dark:text-red-300'
                  : isAdvance
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {isDue
                ? isHindi ? 'आपका कुल बकाया (Due)' : 'Outstanding Due'
                : isAdvance
                ? isHindi ? 'आपका एडवांस जमा (Advance)' : 'Advance Deposit'
                : isHindi ? 'वर्तमान स्थिति (Account Status)' : 'Account Status'}
            </span>

            <span
              className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg ${
                isDue
                  ? 'bg-red-200/80 text-red-800 dark:bg-red-900/80 dark:text-red-200'
                  : isAdvance
                  ? 'bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {isDue
                ? isHindi ? 'देना बाकी' : 'Pending'
                : isAdvance
                ? isHindi ? 'अग्रिम जमा' : 'Credit'
                : isHindi ? 'हिसाब चुकता' : 'Settled'}
            </span>
          </div>

          <span
            className={`text-2xl sm:text-3xl font-black font-display tracking-tight block ${
              isDue
                ? 'text-red-600 dark:text-red-400'
                : isAdvance
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatINR(Math.abs(balanceSummary?.netBalance || 0))}
          </span>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            {isDue
              ? isHindi ? 'डीलर को भुगतान किया जाना शेष है' : 'Pending balance to dealership'
              : isAdvance
              ? isHindi ? 'डीलर के पास आपका अग्रिम जमा है' : 'Credit balance with dealership'
              : isHindi ? 'खाते का पूरा हिसाब चुकता है (₹0 बकाया)' : 'All accounts are cleared (Zero balance)'}
          </p>
        </div>
      </div>

      {/* Date Filter & Control Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPresetRange('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePreset === 'ALL' && !fromDate && !toDate
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isHindi ? '📅 सभी समय (All Time)' : 'All Time'}
            </button>
            <button
              onClick={() => setPresetRange('THIS_MONTH')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePreset === 'THIS_MONTH'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isHindi ? 'इस महीने (This Month)' : 'This Month'}
            </button>
            <button
              onClick={() => setPresetRange('LAST_30')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePreset === 'LAST_30'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isHindi ? 'पिछले 30 दिन (Last 30 Days)' : 'Last 30 Days'}
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-semibold">{isHindi ? 'तारीख से:' : 'From:'}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActivePreset('ALL');
                }}
                className="bg-transparent border-0 text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-semibold">{isHindi ? 'तारीख तक:' : 'To:'}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActivePreset('ALL');
                }}
                className="bg-transparent border-0 text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                onClick={() => setPresetRange('ALL')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all"
              >
                {isHindi ? 'साफ़ करें' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Passbook Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isHindi ? 'खाता विवरण तालिका (Passbook Ledger)' : 'Transaction History'} ({transactions.length} प्रविष्टियां)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {fromDate && toDate ? `${formatDate(fromDate)} - ${formatDate(toDate)}` : (isHindi ? 'सभी लेन-देन' : 'All Entries')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">{isHindi ? 'तारीख व समय' : 'Date & Time'}</th>
                <th className="p-3.5">{isHindi ? 'सामान / भुगतान विवरण' : 'Description'}</th>
                <th className="p-3.5">{isHindi ? 'माध्यम' : 'Payment Mode'}</th>
                <th className="p-3.5 text-right">{isHindi ? 'सामान लिया (नामे - DR)' : 'Debit (₹)'}</th>
                <th className="p-3.5 text-right">{isHindi ? 'जमा किया (भुगतान - CR)' : 'Credit (₹)'}</th>
                <th className="p-3.5 text-right">{isHindi ? 'बकाया हिसाब (Balance)' : 'Running Balance (₹)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold">{isHindi ? 'इस अवधि में कोई लेन-देन नहीं मिला।' : 'No transactions found for this period.'}</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className={
                      tx.isVoided
                        ? 'opacity-40 line-through bg-slate-50/50 dark:bg-slate-950/50'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }
                  >
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(tx.transactionDate)}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {isHindi && tx.descriptionHi ? tx.descriptionHi : tx.description}
                      </p>
                      {tx.notes && <p className="text-[10px] text-slate-400 mt-0.5">{tx.notes}</p>}
                    </td>
                    <td className="p-3.5">
                      {tx.paymentMode ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                          {tx.paymentMode}
                        </span>
                      ) : tx.referenceId ? (
                        <span className="text-[10px] text-slate-400">{tx.referenceId}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">
                      {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                      {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatINR(tx.calculatedRunningBalance || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default FarmerLedgerPage;
