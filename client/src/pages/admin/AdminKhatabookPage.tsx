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
  User,
  Phone,
  X,
  FileText,
  TrendingDown,
  TrendingUp,
  Receipt,
  Package,
  Clock,
  CreditCard,
  IndianRupee,
  Sparkles
} from 'lucide-react';
import { api, formatINR, formatDate, formatDateTime } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';
import { Product } from '../../types';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DUE' | 'ADVANCE' | 'SETTLED'>('ALL');
  const [activeTab, setActiveTab] = useState<'FARMERS' | 'TRANSACTIONS'>('FARMERS');

  // Modal 1: Issue Goods (सामान दिया)
  const [goodsModalOpen, setGoodsModalOpen] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [goodsQty, setGoodsQty] = useState('');
  const [goodsRate, setGoodsRate] = useState('');
  const [goodsDate, setGoodsDate] = useState(new Date().toISOString().split('T')[0]);
  const [goodsTime, setGoodsTime] = useState(
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  );
  const [goodsNotes, setGoodsNotes] = useState('');
  const [goodsSubmitting, setGoodsSubmitting] = useState(false);
  const [goodsError, setGoodsError] = useState('');

  // Modal 2: Payment Received (जमा लिया / Dues Clear)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState(
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  );
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Void Modal
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const loadKhatabook = async () => {
    try {
      setLoading(true);
      const [khataRes, prodRes] = await Promise.all([
        api.get(`/ledger/khatabook/overview?search=${search}&filterType=${filterType}`),
        api.get('/products/active')
      ]);

      if (khataRes.data.success) {
        setMetrics(khataRes.data.data.metrics);
        setFarmerKhatas(khataRes.data.data.farmerKhatas);
        setRecentTransactions(khataRes.data.data.recentTransactions);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
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

  // Open Issue Goods Modal
  const handleOpenIssueGoods = (farmerId?: string) => {
    const defaultFarmer = farmerId || farmerKhatas[0]?.id || '';
    setSelectedFarmerId(defaultFarmer);
    const defaultProd = products[0];
    if (defaultProd) {
      setSelectedProductId(defaultProd._id);
      setGoodsRate(String(defaultProd.price));
    } else {
      setSelectedProductId('');
      setGoodsRate('');
    }
    setGoodsQty('1');
    setGoodsDate(new Date().toISOString().split('T')[0]);
    setGoodsTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
    setGoodsNotes('');
    setGoodsError('');
    setGoodsModalOpen(true);
  };

  // Open Payment Received Modal
  const handleOpenPayment = (farmerId?: string) => {
    const targetFarmer = farmerKhatas.find((f) => f.id === farmerId) || farmerKhatas[0];
    setSelectedFarmerId(targetFarmer?.id || '');
    if (targetFarmer && targetFarmer.balanceSummary.netBalance > 0) {
      setPaymentAmount(String(targetFarmer.balanceSummary.netBalance));
    } else {
      setPaymentAmount('');
    }
    setPaymentMode('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
    setPaymentNotes('');
    setPaymentError('');
    setPaymentModalOpen(true);
  };

  // On Product Change in Goods modal
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      setGoodsRate(String(prod.price));
    }
  };

  // Submit Goods Issue (सामान दिया)
  const handleSaveIssueGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId) {
      setGoodsError(isHindi ? 'कृपया किसान चुनें।' : 'Please select a farmer.');
      return;
    }
    const qty = Number(goodsQty);
    const rate = Number(goodsRate);
    if (!qty || qty <= 0 || !rate || rate <= 0) {
      setGoodsError(isHindi ? 'कृपया वैध मात्रा और रेट दर्ज करें।' : 'Please enter valid quantity and rate.');
      return;
    }

    const selectedProduct = products.find((p) => p._id === selectedProductId);
    const totalAmount = qty * rate;

    setGoodsSubmitting(true);
    setGoodsError('');
    try {
      const res = await api.post('/ledger/transaction', {
        farmerId: selectedFarmerId,
        transactionDate: goodsDate,
        transactionTime: goodsTime,
        transactionType: 'PRODUCT_PURCHASE',
        productId: selectedProduct?._id,
        productName: selectedProduct?.name || 'Goods Issue',
        quantity: qty,
        unit: selectedProduct?.unit || 'Units',
        rate: rate,
        amount: totalAmount,
        notes: goodsNotes
      });

      if (res.data.success) {
        setGoodsModalOpen(false);
        loadKhatabook();
      }
    } catch (err: any) {
      setGoodsError(err.response?.data?.message || 'Failed to record entry.');
    } finally {
      setGoodsSubmitting(false);
    }
  };

  // Submit Payment Received (जमा लिया / Clear Dues)
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId) {
      setPaymentError(isHindi ? 'कृपया किसान चुनें।' : 'Please select a farmer.');
      return;
    }
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError(isHindi ? 'कृपया वैध जमा राशि दर्ज करें।' : 'Please enter a valid payment amount.');
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError('');
    try {
      const res = await api.post('/ledger/transaction', {
        farmerId: selectedFarmerId,
        transactionDate: paymentDate,
        transactionTime: paymentTime,
        transactionType: 'PAYMENT_RECEIVED',
        paymentMode: paymentMode,
        amount: amount,
        notes: paymentNotes
      });

      if (res.data.success) {
        setPaymentModalOpen(false);
        loadKhatabook();
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Void Transaction
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
      `कुल खरीद (नामे): ₹${farmer.balanceSummary.totalDebit}\n` +
      `कुल जमा (भुगतान): ₹${farmer.balanceSummary.totalCredit}\n\n` +
      `डिजिटल पासबुक देखने के लिए लॉगिन करें: ${window.location.origin}/farmer/login\n` +
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

  const selectedFarmerForGoods = farmerKhatas.find((f) => f.id === selectedFarmerId);
  const selectedFarmerForPayment = farmerKhatas.find((f) => f.id === selectedFarmerId);
  const calculatedGoodsTotal = Number(goodsQty || 0) * Number(goodsRate || 0);

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
              ? 'किसान को सामान देने (ऑटोमैटिक रेट/हिसाब), जमा भुगतान दर्ज करने और बकाया चुकता करने का डिजिटल लेजर'
              : 'Product-based goods billing, automated price calculation, payment entries, and dues clearance'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Issue Goods Button (सामान दिया) */}
          <button
            onClick={() => handleOpenIssueGoods()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition-all"
          >
            <Package className="w-4 h-4" />
            <span>{isHindi ? '+ सामान दिया (Issue Goods)' : '+ Issue Goods'}</span>
          </button>

          {/* Record Payment Button (जमा लिया) */}
          <button
            onClick={() => handleOpenPayment()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>{isHindi ? '+ जमा लिया (Payment)' : '+ Record Payment'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Market Receivable (उधार लेना है) */}
        <div className="p-5 rounded-3xl bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-300">
              {isHindi ? 'मार्केट बकाया (लेना है)' : 'Total Receivable (Due)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-display text-red-700 dark:text-red-300 tracking-tight">
            {formatINR(metrics?.totalReceivable || 0)}
          </p>
          <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1 font-semibold">
            {metrics?.dueFarmersCount || 0} {isHindi ? 'किसानों पर बकाया है' : 'Farmers with pending balance'}
          </p>
        </div>

        {/* Total Advance Deposits (एडवांस जमा) */}
        <div className="p-5 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 shadow-sm relative overflow-hidden">
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
        <div className="p-5 rounded-3xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-sm">
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

        {/* Total Active Farmer Khatas */}
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
        <ChickLoader text={isHindi ? 'खाताबही लोड हो रही है...' : 'Loading khatabook...'} />
      ) : activeTab === 'FARMERS' ? (
        /* Farmer Khatas List */
        farmerKhatas.length === 0 ? (
          <EmptyState
            title={isHindi ? 'कोई खाता नहीं मिला' : 'No farmer khatas found'}
            description={isHindi ? 'खोज या फ़िल्टर बदलें।' : 'Try changing your search or filter.'}
            icon={BookOpen}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {farmerKhatas.map((khata) => {
              const isDue = khata.balanceSummary.netBalance > 0;
              const isAdvance = khata.balanceSummary.netBalance < 0;
              return (
                <div
                  key={khata.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Farmer Info Top */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
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
                      {isDue ? (isHindi ? 'बकाया' : 'Due') : isAdvance ? (isHindi ? 'एडवांस' : 'Advance') : (isHindi ? 'चुकता' : 'Settled')}
                    </span>
                  </div>

                  {/* Financial Balance Overview */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">{isHindi ? 'कुल खरीद (नामे)' : 'Total Purchases (Dr)'}</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {formatINR(khata.balanceSummary.totalDebit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                        {isHindi ? 'कुल जमा (भुगतान)' : 'Total Payments (Cr)'}
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatINR(khata.balanceSummary.totalCredit)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-600 dark:text-slate-400 text-xs">
                        {isDue ? (isHindi ? 'वर्तमान बकाया (Net Due):' : 'Net Due Balance:') : isAdvance ? (isHindi ? 'वर्तमान एडवांस:' : 'Advance Deposit:') : (isHindi ? 'शेष हिसाब:' : 'Balance:')}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {/* Issue Goods */}
                    <button
                      onClick={() => handleOpenIssueGoods(khata.id)}
                      className="flex items-center justify-center gap-1 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs rounded-xl border border-brand-200 dark:border-brand-800 transition-all"
                      title="Issue Goods to Farmer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{isHindi ? '+ सामान' : '+ Goods'}</span>
                    </button>

                    {/* Record Payment / Dues Clear */}
                    <button
                      onClick={() => handleOpenPayment(khata.id)}
                      className="flex items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all"
                      title="Record Payment / Clear Dues"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isHindi ? '+ जमा' : '+ Pay'}</span>
                    </button>

                    {/* View Statement Details */}
                    <Link
                      to={`/admin/farmers/${khata.id}`}
                      className="flex items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                      title="View Passbook & Statement"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'खाता' : 'View'}</span>
                    </Link>

                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadFarmerPDF(khata.id, khata.farmerId)}
                      className="flex items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                      title="Download PDF Statement"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Recent Transactions Table */
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">{isHindi ? 'तारीख व समय' : 'Date & Time'}</th>
                  <th className="p-3.5">{isHindi ? 'किसान' : 'Farmer'}</th>
                  <th className="p-3.5">{isHindi ? 'विवरण (सामान/पेमेंट)' : 'Description'}</th>
                  <th className="p-3.5 text-right">{isHindi ? 'सामान लिया (नामे)' : 'Debit (₹)'}</th>
                  <th className="p-3.5 text-right">{isHindi ? 'जमा किया (भुगतान)' : 'Credit (₹)'}</th>
                  <th className="p-3.5 text-center">{isHindi ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className={tx.isVoided ? 'opacity-40 line-through bg-slate-50/50 dark:bg-slate-950/50' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'}>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(tx.transactionDate)}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{tx.farmerName}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{tx.description}</p>
                      {tx.paymentMode && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                          {tx.paymentMode}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">
                      {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                      {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      {!tx.isVoided ? (
                        <button
                          onClick={() => {
                            setSelectedTxId(tx._id);
                            setVoidModalOpen(true);
                          }}
                          className="px-2 py-1 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-bold transition-all"
                        >
                          {isHindi ? 'रद्द करें' : 'Void'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">{isHindi ? 'रद्द' : 'Voided'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Issue Goods (सामान दिया - Auto Price Calculation) */}
      {goodsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'किसान को सामान दिया (Issue Goods Entry)' : 'Issue Goods / Product Delivery'}
                </h3>
              </div>
              <button onClick={() => setGoodsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {goodsError && (
              <div className="p-3 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{goodsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveIssueGoods} className="space-y-4 text-xs">
              {/* Select Farmer */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'किसान चुनें (Select Farmer) *' : 'Select Farmer *'}
                </label>
                <select
                  required
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                >
                  <option value="">{isHindi ? '-- किसान चुनें --' : '-- Select Farmer --'}</option>
                  {farmerKhatas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.farmerId}) - {f.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Product */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'उत्पाद / सामान चुनें (Product Dropdown) *' : 'Select Product *'}
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                >
                  <option value="">{isHindi ? '-- उत्पाद चुनें --' : '-- Select Product --'}</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.nameHi ? `(${p.nameHi})` : ''} - ₹{p.price}/{p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity and Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'मात्रा (Quantity / बोरी/किलो) *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.1"
                    placeholder="e.g. 10"
                    value={goodsQty}
                    onChange={(e) => setGoodsQty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'भाव / रेट (Rate per Unit ₹) *' : 'Rate (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    placeholder="e.g. 2200"
                    value={goodsRate}
                    onChange={(e) => setGoodsRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black text-sm"
                  />
                </div>
              </div>

              {/* Automatic Total Price Calculation Highlight */}
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-brand-800 dark:text-brand-300 block">
                    {isHindi ? 'कुल राशि (Auto-Calculated Total):' : 'Calculated Total Amount:'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {goodsQty || 0} × ₹{goodsRate || 0}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black font-display text-brand-700 dark:text-brand-300">
                  {formatINR(calculatedGoodsTotal)}
                </span>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'तारीख (Date) *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={goodsDate}
                    onChange={(e) => setGoodsDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'समय (Time) *' : 'Time *'}
                  </label>
                  <input
                    type="time"
                    required
                    value={goodsTime}
                    onChange={(e) => setGoodsTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'अतिरिक्त नोट / बिल पर्ची नंबर (वैकल्पिक)' : 'Notes / Slip Ref (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="उदा. गाड़ी नंबर या चालान पर्ची"
                  value={goodsNotes}
                  onChange={(e) => setGoodsNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGoodsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={goodsSubmitting}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {goodsSubmitting
                    ? isHindi
                      ? 'खाते में दर्ज कर रहे हैं...'
                      : 'Posting...'
                    : isHindi
                    ? 'सामान एंट्री दर्ज करें (Save & Debit)'
                    : 'Save & Post Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Payment Received / Dues Clear (जमा लिया) */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'किसान से भुगतान प्राप्त (Dues Clear / Payment Entry)' : 'Payment Collection / Clear Dues'}
                </h3>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              {/* Select Farmer */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'किसान चुनें (Select Farmer) *' : 'Select Farmer *'}
                </label>
                <select
                  required
                  value={selectedFarmerId}
                  onChange={(e) => {
                    const fId = e.target.value;
                    setSelectedFarmerId(fId);
                    const targetFarmer = farmerKhatas.find((f) => f.id === fId);
                    if (targetFarmer && targetFarmer.balanceSummary.netBalance > 0) {
                      setPaymentAmount(String(targetFarmer.balanceSummary.netBalance));
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                >
                  <option value="">{isHindi ? '-- किसान चुनें --' : '-- Select Farmer --'}</option>
                  {farmerKhatas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.farmerId}) - बकाया: ₹{f.balanceSummary.amountDue}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Dues Display & Quick Fill */}
              {selectedFarmerForPayment && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      {isHindi ? 'वर्तमान खाता स्थिति:' : 'Current Due Balance:'}
                    </span>
                    <span className={`text-base font-black font-display ${selectedFarmerForPayment.balanceSummary.netBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedFarmerForPayment.balanceSummary.netBalance > 0
                        ? `₹${selectedFarmerForPayment.balanceSummary.amountDue} (बकाया)`
                        : selectedFarmerForPayment.balanceSummary.netBalance < 0
                        ? `₹${selectedFarmerForPayment.balanceSummary.advanceAmount} (एडवांस)`
                        : '₹0 (चुकता)'}
                    </span>
                  </div>

                  {selectedFarmerForPayment.balanceSummary.netBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(selectedFarmerForPayment.balanceSummary.amountDue))}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded-xl font-extrabold text-[11px] border border-brand-200 dark:border-brand-800"
                    >
                      {isHindi ? '⚡ पूरा बकाया भरें' : '⚡ Fill Full Due'}
                    </button>
                  )}
                </div>
              )}

              {/* Payment Amount & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'जमा राशि (Amount ₹) *' : 'Amount Received (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black text-sm text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'भुगतान माध्यम (Mode) *' : 'Payment Mode *'}
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="CASH">{isHindi ? '💵 नकद (Cash)' : 'Cash'}</option>
                    <option value="UPI">{isHindi ? '📱 PhonePe / GooglePay / UPI' : 'UPI'}</option>
                    <option value="BANK_TRANSFER">{isHindi ? '🏦 बैंक ट्रांसफर (IMPS/NEFT)' : 'Bank Transfer'}</option>
                    <option value="CHEQUE">{isHindi ? '📝 चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'तारीख (Date) *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'समय (Time) *' : 'Time *'}
                  </label>
                  <input
                    type="time"
                    required
                    value={paymentTime}
                    onChange={(e) => setPaymentTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'रसीद / संदर्भ नोट (वैकल्पिक)' : 'Notes / Receipt Reference'}
                </label>
                <input
                  type="text"
                  placeholder="उदा. UPI रिफरेंस नंबर या रसीद"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {paymentSubmitting
                    ? isHindi
                      ? 'जमा दर्ज कर रहे हैं...'
                      : 'Recording...'
                    : isHindi
                    ? 'जमा सुरक्षित करें (Save & Credit)'
                    : 'Save & Credit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {voidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isHindi ? 'लेन-देन रद्द करें (Void Transaction)' : 'Void Transaction'}
            </h4>
            <form onSubmit={handleVoidTx} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {isHindi ? 'रद्द करने का कारण *' : 'Reason for Voiding *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. गलत एंट्री दर्ज हो गई थी"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={voidLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                >
                  {voidLoading ? 'Voiding...' : isHindi ? 'पुष्टि करें' : 'Confirm Void'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminKhatabookPage;
