import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Download,
  Share2,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  User,
  Phone,
  MapPin,
  X,
  FileText,
  RotateCcw,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { api, formatINR, formatDate } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';
import { TransactionType } from '../../types';

interface FarmerKhata {
  id: string;
  farmerId: string;
  name: string;
  phone: string;
  village?: string;
  district?: string;
  farmName?: string;
  status: string;
  balanceSummary: {
    totalDebit: number;
    totalCredit: number;
    netBalance: number;
    isDue: boolean;
    isAdvance: boolean;
    amountDue: number;
    advanceAmount: number;
  };
}

interface KhatabookMetrics {
  totalReceivable: number;
  totalAdvance: number;
  todayCollectionAmount: number;
  totalFarmers: number;
  dueFarmersCount: number;
  advanceFarmersCount: number;
  settledFarmersCount: number;
}

export const AdminKhatabookPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [metrics, setMetrics] = useState<KhatabookMetrics | null>(null);
  const [farmerKhatas, setFarmerKhatas] = useState<FarmerKhata[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DUE' | 'ADVANCE' | 'SETTLED'>('ALL');
  const [activeTab, setActiveTab] = useState<'FARMERS' | 'TRANSACTIONS'>('FARMERS');

  // Add Khata Entry Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [entryType, setEntryType] = useState<TransactionType>('PAYMENT_RECEIVED');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryQty, setEntryQty] = useState('');
  const [entryRate, setEntryRate] = useState('');
  const [entryRef, setEntryRef] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Void Modal
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const loadKhatabook = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ledger/khatabook/overview?search=${search}&filterType=${filterType}`);
      if (res.data.success) {
        setMetrics(res.data.data.metrics);
        setFarmerKhatas(res.data.data.farmerKhatas);
        setRecentTransactions(res.data.data.recentTransactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKhatabook();
  }, [search, filterType]);

  const handleOpenAddEntry = (farmerId?: string) => {
    setSelectedFarmerId(farmerId || (farmerKhatas[0]?.id || ''));
    setEntryType('PAYMENT_RECEIVED');
    setEntryAmount('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryDesc('');
    setEntryQty('');
    setEntryRate('');
    setEntryRef('');
    setEntryNotes('');
    setModalError('');
    setModalOpen(true);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId || !entryAmount || Number(entryAmount) <= 0) {
      setModalError(isHindi ? 'कृपया किसान और वैध राशि दर्ज करें।' : 'Please select farmer and enter valid amount.');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const res = await api.post('/ledger/transaction', {
        farmerId: selectedFarmerId,
        transactionDate: entryDate,
        transactionType: entryType,
        description: entryDesc,
        quantity: entryQty ? Number(entryQty) : undefined,
        rate: entryRate ? Number(entryRate) : undefined,
        amount: Number(entryAmount),
        referenceId: entryRef,
        notes: entryNotes
      });

      if (res.data.success) {
        setModalOpen(false);
        loadKhatabook();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to record entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoidTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) return;
    setVoidLoading(true);
    try {
      const res = await api.post(`/ledger/transaction/${selectedTxId}/void`, { reason: voidReason });
      if (res.data.success) {
        setVoidModalOpen(false);
        setVoidReason('');
        loadKhatabook();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to void transaction');
    } finally {
      setVoidLoading(false);
    }
  };

  const handleSendWhatsAppReminder = (farmer: FarmerKhata) => {
    const isDue = farmer.balanceSummary.netBalance > 0;
    const balanceText = isDue
      ? `बकाया राशि: ₹${farmer.balanceSummary.amountDue}`
      : `एडवांस राशि: ₹${farmer.balanceSummary.advanceAmount}`;

    const text = encodeURIComponent(
      `*बंशीधर पोल्ट्री खाताबही विवरण*\n` +
      `नमस्ते ${farmer.name} जी,\n` +
      `किसान आईडी: ${farmer.farmerId}\n` +
      `आपका वर्तमान खाता स्थिति: *${balanceText}*\n` +
      `कुल खरीद (उधार): ₹${farmer.balanceSummary.totalDebit}\n` +
      `कुल जमा (भुगतान): ₹${farmer.balanceSummary.totalCredit}\n\n` +
      `डिजिटल पासबुक देखने के लिए लॉगिन करें: http://localhost:5173/farmer/login\n` +
      `धन्यवाद, बंशीधर पोल्ट्री`
    );

    const cleanPhone = farmer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  const handleDownloadFarmerPDF = async (farmerId: string, farmerCode: string) => {
    try {
      const res = await api.get(`/ledger/farmer/${farmerId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Khatabook_Statement_${farmerCode}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF statement.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              {isHindi ? 'डीलरशिप खाताबही (Khatabook)' : 'Dealership Khatabook & Ledger'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? 'सभी किसानों के उधार, जमा, दाना-चूजा खरीद एवं शेष हिसाब का डिजिटल प्रबंधन'
              : 'Complete digital ledger, market receivables, advance deposits, and payment tracking'}
          </p>
        </div>

        <button
          onClick={() => handleOpenAddEntry()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isHindi ? '+ नया लेन-देन दर्ज करें' : '+ Add Khata Entry'}</span>
        </button>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Market Receivable (उधार लेना है) */}
        <div className="p-5 rounded-3xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-300">
              {isHindi ? 'मार्केट बकाया (लेना है)' : 'Total Market Udhar (Receivable)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-red-700 dark:text-red-300 tracking-tight">
            {formatINR(metrics?.totalReceivable || 0)}
          </p>
          <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1 font-semibold">
            {metrics?.dueFarmersCount || 0} {isHindi ? 'किसानों पर बकाया' : 'Farmers with pending balance'}
          </p>
        </div>

        {/* Total Advance Deposits (एडवांस देना है) */}
        <div className="p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {isHindi ? 'एडवांस जमा (देना है)' : 'Total Advance Deposits'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-emerald-700 dark:text-emerald-300 tracking-tight">
            {formatINR(metrics?.totalAdvance || 0)}
          </p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-semibold">
            {metrics?.advanceFarmersCount || 0} {isHindi ? 'किसानों का एडवांस जमा' : 'Farmers in credit balance'}
          </p>
        </div>

        {/* Today's Collections */}
        <div className="p-5 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
              {isHindi ? 'आज की जमा वसूली' : "Today's Collections"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-blue-700 dark:text-blue-300 tracking-tight">
            {formatINR(metrics?.todayCollectionAmount || 0)}
          </p>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1 font-semibold">
            {isHindi ? 'आज प्राप्त कुल नकद/UPI भुगतान' : 'Cash & Online collections today'}
          </p>
        </div>

        {/* Total Farmer Khatas */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isHindi ? 'कुल सक्रिय खाते' : 'Total Farmer Khatas'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            {metrics?.totalFarmers || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">
            {metrics?.settledFarmersCount || 0} {isHindi ? 'हिसाब चुकता' : 'Settled accounts'}
          </p>
        </div>
      </div>

      {/* Main Tabs & Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Switcher */}
          <div className="flex bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('FARMERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'FARMERS'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isHindi ? '📖 किसानों की खाताबही (Farmer Khatas)' : 'Farmer Khatas'}
            </button>
            <button
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isHindi ? '⚡ हाल के सभी लेन-देन (Recent Entries)' : 'Recent Transactions'}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHindi ? 'नाम, किसान आईडी या फोन नंबर से खोजें...' : 'Search by name, ID, phone...'}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Filter Pills */}
        {activeTab === 'FARMERS' && (
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: isHindi ? 'सभी खाते (All)' : 'All Khatas' },
              { id: 'DUE', label: isHindi ? '🔴 केवल बकाया वाले (Due)' : 'Only Due' },
              { id: 'ADVANCE', label: isHindi ? '🟢 केवल एडवांस वाले (Advance)' : 'Only Advance' },
              { id: 'SETTLED', label: isHindi ? '⚪ हिसाब चुकता (Settled)' : 'Settled' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === f.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <ChickLoader text="खाताबही लोड हो रही है..." />
      ) : activeTab === 'FARMERS' ? (
        /* Farmer Khatas List */
        farmerKhatas.length === 0 ? (
          <EmptyState
            title={isHindi ? 'कोई खाता नहीं मिला' : 'No farmer khatas found'}
            description={isHindi ? 'खोज या फ़िल्टर बदलें।' : 'Try changing your search or filter.'}
            icon={BookOpen}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmerKhatas.map((khata) => {
              const isDue = khata.balanceSummary.netBalance > 0;
              const isAdvance = khata.balanceSummary.netBalance < 0;
              return (
                <div
                  key={khata.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Farmer Info Top */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {khata.name}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold rounded-md text-slate-600 dark:text-slate-300">
                          {khata.farmerId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{khata.phone}</span>
                        {khata.village && <span>· {khata.village}</span>}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase shrink-0 ${
                        isDue
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900'
                          : isAdvance
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {isDue ? 'बकाया' : isAdvance ? 'एडवांस' : 'चुकता'}
                    </span>
                  </div>

                  {/* Financial Balance Overview */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">कुल खरीद (नामे)</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {formatINR(khata.balanceSummary.totalDebit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                        कुल जमा (भुगतान)
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatINR(khata.balanceSummary.totalCredit)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-600 dark:text-slate-400 text-xs">
                        {isDue ? 'वर्तमान बकाया (Net Due):' : isAdvance ? 'वर्तमान एडवांस:' : 'शेष हिसाब:'}
                      </span>
                      <span
                        className={`text-base font-black font-display ${
                          isDue
                            ? 'text-red-600 dark:text-red-400'
                            : isAdvance
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {formatINR(Math.abs(khata.balanceSummary.netBalance))}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenAddEntry(khata.id)}
                      className="flex items-center justify-center gap-1 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs rounded-xl border border-brand-200 dark:border-brand-800 transition-all"
                      title="Add Jama/Udhar Entry"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ लेन-देन</span>
                    </button>

                    <Link
                      to={`/admin/farmers/${khata.id}`}
                      className="flex items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                      title="View Passbook & Statement"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>खाता देखें</span>
                    </Link>

                    <button
                      onClick={() => handleSendWhatsAppReminder(khata)}
                      className="flex items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all"
                      title="Send WhatsApp Khata Statement"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Recent Transactions Stream */
        recentTransactions.length === 0 ? (
          <EmptyState
            title={isHindi ? 'कोई लेन-देन नहीं मिला' : 'No transactions recorded yet'}
            description={isHindi ? 'नया लेन-देन दर्ज करने के लिए ऊपर दिए बटन पर क्लिक करें।' : 'Click Add Khata Entry above to record.'}
            icon={Receipt}
          />
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => {
              const isDebit = tx.debit > 0;
              return (
                <div
                  key={tx._id}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border ${
                    tx.isVoided
                      ? 'border-red-200 dark:border-red-950 opacity-60'
                      : 'border-slate-200/80 dark:border-slate-800'
                  } shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                        isDebit
                          ? 'bg-red-50 dark:bg-red-950 text-red-600'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                      }`}
                    >
                      {isDebit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {tx.farmerName}
                        </span>
                        {tx.isVoided && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-md">
                            रद्द (Voided)
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                        {isHindi && tx.descriptionHi ? tx.descriptionHi : tx.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatDate(tx.transactionDate)}</span>
                        {tx.referenceId && <span>Ref: {tx.referenceId}</span>}
                        {tx.notes && <span>· {tx.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <span
                        className={`text-sm font-black font-display ${
                          isDebit ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isDebit ? `+ ${formatINR(tx.debit)} (उधार)` : `- ${formatINR(tx.credit)} (जमा)`}
                      </span>
                    </div>

                    {!tx.isVoided && (
                      <button
                        onClick={() => {
                          setSelectedTxId(tx._id);
                          setVoidReason('');
                          setVoidModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                        title="Void/Reverse Entry"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add Khata Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'नया खाताबही लेन-देन दर्ज करें' : 'Record New Khatabook Entry'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
              {/* Select Farmer */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'किसान चुनें (Select Farmer)' : 'Select Farmer'} *
                </label>
                <select
                  required
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">-- किसान चुनें --</option>
                  {farmerKhatas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.farmerId}) - {f.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'लेन-देन का प्रकार (Transaction Type)' : 'Transaction Type'} *
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="PAYMENT_RECEIVED">🟢 भुगतान प्राप्त (Payment Received / जमा)</option>
                  <option value="ADVANCE_PAYMENT">🟢 एडवांस जमा (Advance Deposit / अग्रिम)</option>
                  <option value="PRODUCT_PURCHASE">🔴 उधार दाना / सामग्री खरीद (Feed Purchase / बकाया)</option>
                  <option value="CHICK_PURCHASE">🔴 चूजा आपूर्ति (Chick Supply / बकाया)</option>
                  <option value="DISCOUNT">🟢 विशेष छूट (Special Discount / Rebate)</option>
                  <option value="ADJUSTMENT_DEBIT">🔴 खाता समायोजन (Debit Adjustment / बकाया)</option>
                  <option value="ADJUSTMENT_CREDIT">🟢 खाता समायोजन (Credit Adjustment / जमा)</option>
                </select>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'राशि (Amount ₹)' : 'Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'तारीख (Date)' : 'Transaction Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quantity & Rate (Optional for product/chick purchase) */}
              {['PRODUCT_PURCHASE', 'CHICK_PURCHASE'].includes(entryType) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isHindi ? 'मात्रा (Quantity)' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      value={entryQty}
                      onChange={(e) => {
                        setEntryQty(e.target.value);
                        if (entryRate && e.target.value) {
                          setEntryAmount((Number(e.target.value) * Number(entryRate)).toString());
                        }
                      }}
                      placeholder="e.g. 10 (Bags / Chicks)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isHindi ? 'दर (Rate ₹)' : 'Rate (₹)'}
                    </label>
                    <input
                      type="number"
                      value={entryRate}
                      onChange={(e) => {
                        setEntryRate(e.target.value);
                        if (entryQty && e.target.value) {
                          setEntryAmount((Number(entryQty) * Number(e.target.value)).toString());
                        }
                      }}
                      placeholder="e.g. 1650"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Description & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'विवरण (Description)' : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                    placeholder="उदा. 10 बोरी स्टार्टर दाना / नकद जमा"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'बिल / रसीद नंबर (Ref No.)' : 'Bill / Reference No.'}
                  </label>
                  <input
                    type="text"
                    value={entryRef}
                    onChange={(e) => setEntryRef(e.target.value)}
                    placeholder="e.g. INV-1049 / UPI-998822"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'अतिरिक्त टिप्पणी (Notes)' : 'Additional Notes'}
                </label>
                <input
                  type="text"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="e.g. PhonePe transfer / Driver delivery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md"
                >
                  {submitting ? 'Saving...' : isHindi ? 'खाते में दर्ज करें' : 'Save Khata Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              <span>{isHindi ? 'लेन-देन रद्द / वापस करें (Void Entry)' : 'Void Transaction'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isHindi
                ? 'यह प्रविष्टि रद्द कर दी जाएगी और किसान के खाते का शेष स्वचालित रूप से ठीक हो जाएगा।'
                : 'This entry will be voided and the running balance will adjust automatically with an audit record.'}
            </p>
            <form onSubmit={handleVoidTx} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'रद्द करने का कारण (Reason)' : 'Reason for voiding'} *
                </label>
                <input
                  type="text"
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="उदा. गलत राशि दर्ज हो गई थी / बिल रद्द हुआ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voidLoading}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md"
                >
                  {voidLoading ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
