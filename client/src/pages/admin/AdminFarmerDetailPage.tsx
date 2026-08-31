import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Receipt,
  Download,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Package,
  Share2,
  KeyRound,
  FileText,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { api, formatINR, formatDate, formatDateTime } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { User as FarmerUser, LedgerTransaction, BalanceSummary, Product } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { CredentialsCard } from '../../components/CredentialsCard';

export const AdminFarmerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isHindi } = useLanguage();

  const [farmer, setFarmer] = useState<FarmerUser | null>(null);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [goodsQty, setGoodsQty] = useState('1');
  const [goodsRate, setGoodsRate] = useState('');
  const [goodsDate, setGoodsDate] = useState(new Date().toISOString().split('T')[0]);
  const [goodsTime, setGoodsTime] = useState(
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  );
  const [goodsNotes, setGoodsNotes] = useState('');
  const [goodsSubmitting, setGoodsSubmitting] = useState(false);
  const [goodsError, setGoodsError] = useState('');

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState(
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  );
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Edit / Delete / Reset Password states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    farmName: '',
    address: '',
    village: '',
    district: '',
    state: 'Bihar',
    pinCode: '',
    farmCapacity: 1000,
    status: 'ACTIVE',
    notes: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [customResetPassword, setCustomResetPassword] = useState('');
  const [resetCredentials, setResetCredentials] = useState<any | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      let ledgerUrl = `/ledger/farmer/${id}?`;
      if (fromDate) ledgerUrl += `fromDate=${fromDate}&`;
      if (toDate) ledgerUrl += `toDate=${toDate}&`;

      const [farmerRes, ledgerRes, prodRes] = await Promise.all([
        api.get(`/farmers/${id}`),
        api.get(ledgerUrl),
        api.get('/products/active')
      ]);

      if (farmerRes.data.success) setFarmer(farmerRes.data.data);
      if (ledgerRes.data.success) {
        setTransactions(ledgerRes.data.data.transactions);
        setBalanceSummary(ledgerRes.data.data.balanceSummary);
      }
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, fromDate, toDate]);

  // Open Goods Issue modal
  const handleOpenGoodsModal = () => {
    const defaultProd = products[0];
    if (defaultProd) {
      setSelectedProductId(defaultProd._id);
      setGoodsRate(String(defaultProd.price));
    }
    setGoodsQty('1');
    setGoodsDate(new Date().toISOString().split('T')[0]);
    setGoodsTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
    setGoodsNotes('');
    setGoodsError('');
    setIsGoodsModalOpen(true);
  };

  // Open Payment modal
  const handleOpenPaymentModal = () => {
    if (balanceSummary && balanceSummary.netBalance > 0) {
      setPaymentAmount(String(balanceSummary.netBalance));
    } else {
      setPaymentAmount('');
    }
    setPaymentMode('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
    setPaymentNotes('');
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      setGoodsRate(String(prod.price));
    }
  };

  const handleSaveIssueGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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
        farmerId: id,
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
        setIsGoodsModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setGoodsError(err.response?.data?.message || 'Failed to record goods issue.');
    } finally {
      setGoodsSubmitting(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError(isHindi ? 'कृपया वैध राशि दर्ज करें।' : 'Please enter a valid amount.');
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError('');
    try {
      const res = await api.post('/ledger/transaction', {
        farmerId: id,
        transactionDate: paymentDate,
        transactionTime: paymentTime,
        transactionType: 'PAYMENT_RECEIVED',
        paymentMode: paymentMode,
        amount: amount,
        notes: paymentNotes
      });

      if (res.data.success) {
        setIsPaymentModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleVoidTransaction = async (txId: string) => {
    const reason = prompt(isHindi ? 'लेन-देन रद्द करने का कारण दर्ज करें:' : 'Enter reason for voiding this entry:');
    if (!reason) return;

    try {
      const res = await api.post(`/ledger/transaction/${txId}/void`, { reason });
      if (res.data.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to void transaction.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      let url = `/ledger/farmer/${id}/pdf?`;
      if (fromDate) url += `fromDate=${fromDate}&`;
      if (toDate) url += `toDate=${toDate}&`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Statement_${farmer?.farmerId || 'Farmer'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF.');
    }
  };

  const handleSendWhatsAppReminder = () => {
    if (!farmer || !balanceSummary) return;
    const isDue = balanceSummary.netBalance > 0;
    const balanceText = isDue
      ? `बकाया राशि: ₹${balanceSummary.amountDue}`
      : `एडवांस राशि: ₹${balanceSummary.advanceAmount}`;

    const text = encodeURIComponent(
      `*बंशीधर पोल्ट्री खाताबही विवरण*\n` +
      `नमस्ते ${farmer.name} जी,\n` +
      `किसान कोड: ${farmer.farmerId}\n` +
      `खाता स्थिति: *${balanceText}*\n` +
      `कुल खरीद (नामे): ₹${balanceSummary.totalDebit}\n` +
      `कुल जमा (भुगतान): ₹${balanceSummary.totalCredit}\n\n` +
      `डिजिटल पासबुक देखें: ${window.location.origin}/farmer/login\n` +
      `धन्यवाद, बंशीधर पोल्ट्री`
    );

    const cleanPhone = farmer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  const handleOpenEdit = () => {
    if (!farmer) return;
    setEditForm({
      name: farmer.name || '',
      phone: farmer.phone || '',
      email: farmer.email || '',
      farmName: farmer.farmName || '',
      address: farmer.address || '',
      village: farmer.village || '',
      district: farmer.district || '',
      state: farmer.state || 'Bihar',
      pinCode: farmer.pinCode || '',
      farmCapacity: farmer.farmCapacity || 1000,
      status: farmer.status || 'ACTIVE',
      notes: farmer.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEditSubmitting(true);
    try {
      const res = await api.put(`/farmers/${id}`, editForm);
      if (res.data.success) {
        setIsEditModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update farmer.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteFarmer = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      const res = await api.delete(`/farmers/${id}`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        navigate('/admin/farmers');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete farmer.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/farmers/${id}/reset-password`, {
        newPassword: customResetPassword
      });
      if (res.data.success) {
        setIsResetModalOpen(false);
        setResetCredentials(res.data.credentials);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  if (loading) return <ChickLoader text={isHindi ? 'किसान का खाता लोड हो रहा है...' : 'Loading farmer ledger...'} />;
  if (!farmer) return <div className="p-8 text-center text-xs">Farmer not found.</div>;

  const isDue = balanceSummary ? balanceSummary.netBalance > 0 : false;
  const isAdvance = balanceSummary ? balanceSummary.netBalance < 0 : false;
  const calculatedGoodsTotal = Number(goodsQty || 0) * Number(goodsRate || 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/khatabook"
            className="p-2 text-slate-500 hover:text-brand-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-md">
                {farmer.farmerId}
              </span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{farmer.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  farmer.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {farmer.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {farmer.phone} · {farmer.village}, {farmer.district} {farmer.farmName ? `(${farmer.farmName})` : ''}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Issue Goods Button */}
          <button
            onClick={handleOpenGoodsModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isHindi ? '+ सामान दिया' : '+ Issue Goods'}</span>
          </button>

          {/* Record Payment Button */}
          <button
            onClick={handleOpenPaymentModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{isHindi ? '+ जमा लिया (Pay)' : '+ Record Payment'}</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleSendWhatsAppReminder}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all shadow-sm"
            title="Send WhatsApp Statement"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Edit Profile */}
          <button
            onClick={handleOpenEdit}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all"
            title="Edit Farmer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Password */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
            title="Delete Account"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Password Reset Alert Card */}
      {resetCredentials && (
        <CredentialsCard
          farmerId={resetCredentials.farmerId}
          username={resetCredentials.username || resetCredentials.farmerId}
          temporaryPassword={resetCredentials.temporaryPassword || resetCredentials.password}
          name={resetCredentials.name || farmer.name}
          phone={resetCredentials.phone || farmer.phone}
          onClose={() => setResetCredentials(null)}
        />
      )}

      {/* Balance Summary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Purchases */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
            {isHindi ? 'कुल माल लिया (नामे / Debit)' : 'Total Purchases (Debit)'}
          </span>
          <span className="text-2xl font-black font-display text-slate-900 dark:text-white mt-1 block">
            {formatINR(balanceSummary?.totalDebit || 0)}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            {isHindi ? 'दाना, चूजा व सामग्री का कुल बिल' : 'Total billed supplies'}
          </p>
        </div>

        {/* Total Payments */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
            {isHindi ? 'कुल जमा किया (भुगतान / Credit)' : 'Total Payments (Credit)'}
          </span>
          <span className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatINR(balanceSummary?.totalCredit || 0)}
          </span>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-semibold">
            {isHindi ? 'नकद, UPI एवं अन्य माध्यम से प्राप्त' : 'Total cleared payments'}
          </p>
        </div>

        {/* Net Outstanding Balance */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDue
              ? 'bg-red-50/90 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
              : isAdvance
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-900'
          }`}
        >
          <span className="text-xs font-black uppercase tracking-wider block">
            {isDue
              ? isHindi ? 'वर्तमान कुल बकाया (Net Due)' : 'Net Due Balance'
              : isAdvance
              ? isHindi ? 'वर्तमान एडवांस जमा (Advance)' : 'Advance Deposit'
              : isHindi ? 'हिसाब चुकता (Settled)' : 'Settled Balance'}
          </span>
          <span className="text-2xl font-black font-display tracking-tight mt-1 block">
            {formatINR(Math.abs(balanceSummary?.netBalance || 0))}
          </span>
          <p className="text-[10px] opacity-80 mt-1 font-semibold">
            {isDue
              ? isHindi ? 'किसान से यह राशि प्राप्त की जानी शेष है' : 'Receivable amount from farmer'
              : isAdvance
              ? isHindi ? 'किसान का हमारे पास अतिरिक्त जमा है' : 'Credit balance with dealership'
              : isHindi ? 'कोई बकाया नहीं है' : 'Account is fully settled'}
          </p>
        </div>
      </div>

      {/* Date Filter & Ledger Passbook Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isHindi ? 'डिजिटल पासबुक विवरण (Ledger Transactions)' : 'Passbook Ledger Entries'} ({transactions.length})
            </h3>
          </div>

          {/* Date Pickers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-semibold">{isHindi ? 'से:' : 'From:'}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent border-0 text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-semibold">{isHindi ? 'तक:' : 'To:'}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent border-0 text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all"
              >
                {isHindi ? 'रीसेट' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">{isHindi ? 'तारीख व समय' : 'Date & Time'}</th>
                  <th className="p-3.5">{isHindi ? 'विवरण (सामान / पेमेंट)' : 'Description'}</th>
                  <th className="p-3.5">{isHindi ? 'माध्यम / संदर्भ' : 'Mode / Ref'}</th>
                  <th className="p-3.5 text-right">{isHindi ? 'सामान लिया (नामे)' : 'Debit (₹)'}</th>
                  <th className="p-3.5 text-right">{isHindi ? 'जमा किया (भुगतान)' : 'Credit (₹)'}</th>
                  <th className="p-3.5 text-right">{isHindi ? 'शेष हिसाब' : 'Running Balance (₹)'}</th>
                  <th className="p-3.5 text-center">{isHindi ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      {isHindi ? 'इस अंतराल में कोई लेन-देन नहीं है।' : 'No transactions recorded in this period.'}
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
                        <p className="font-bold text-slate-900 dark:text-white">{tx.description}</p>
                        {tx.notes && <p className="text-[10px] text-slate-400 mt-0.5">{tx.notes}</p>}
                      </td>
                      <td className="p-3.5">
                        {tx.paymentMode ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                            {tx.paymentMode}
                          </span>
                        ) : tx.referenceId ? (
                          <span className="text-[10px] text-slate-400">Ref: {tx.referenceId}</span>
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
                      <td className="p-3.5 text-right font-mono font-black text-slate-800 dark:text-slate-200">
                        {formatINR(tx.calculatedRunningBalance || 0)}
                      </td>
                      <td className="p-3.5 text-center">
                        {!tx.isVoided ? (
                          <button
                            onClick={() => handleVoidTransaction(tx._id)}
                            className="px-2 py-1 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-bold transition-all"
                          >
                            {isHindi ? 'रद्द करें' : 'Void'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">{isHindi ? 'रद्द' : 'Voided'}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: Issue Goods (सामान दिया) */}
      {isGoodsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? `${farmer.name} को सामान दिया (Issue Goods)` : `Issue Goods to ${farmer.name}`}
                </h3>
              </div>
              <button onClick={() => setIsGoodsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
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
              {/* Select Product */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isHindi ? 'उत्पाद / सामान चुनें (Product) *' : 'Select Product *'}
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

              {/* Quantity & Rate */}
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
                    {isHindi ? 'भाव / रेट (Rate ₹) *' : 'Rate (₹) *'}
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

              {/* Auto calculated total amount */}
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-brand-800 dark:text-brand-300 block">
                    {isHindi ? 'कुल राशि (Auto Total):' : 'Calculated Total Amount:'}
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
                  onClick={() => setIsGoodsModalOpen(false)}
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

      {/* MODAL 2: Record Payment / Dues Clear (जमा लिया) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? `${farmer.name} से भुगतान प्राप्त (Payment Entry)` : `Record Payment from ${farmer.name}`}
                </h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
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
              {/* Current Dues Display & Quick Fill */}
              {balanceSummary && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      {isHindi ? 'वर्तमान खाता स्थिति:' : 'Current Due Balance:'}
                    </span>
                    <span className={`text-base font-black font-display ${balanceSummary.netBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {balanceSummary.netBalance > 0
                        ? `₹${balanceSummary.amountDue} (बकाया)`
                        : balanceSummary.netBalance < 0
                        ? `₹${balanceSummary.advanceAmount} (एडवांस)`
                        : '₹0 (चुकता)'}
                    </span>
                  </div>

                  {balanceSummary.netBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(balanceSummary.amountDue))}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded-xl font-extrabold text-[11px] border border-brand-200 dark:border-brand-800"
                    >
                      {isHindi ? '⚡ पूरा बकाया भरें' : '⚡ Fill Full Due'}
                    </button>
                  )}
                </div>
              )}

              {/* Amount & Mode */}
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
                  onClick={() => setIsPaymentModalOpen(false)}
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

      {/* EDIT FARMER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isHindi ? 'किसान विवरण संपादित करें' : 'Edit Farmer Profile'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateFarmer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Village</label>
                  <input
                    type="text"
                    value={editForm.village}
                    onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">District</label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isHindi ? 'पासवर्ड बदलें' : 'Set New Password'}
            </h4>
            <form onSubmit={handleExecuteResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">
                  {isHindi ? 'नया पासवर्ड (New Password) *' : 'New Password *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Min 6 characters"
                  value={customResetPassword}
                  onChange={(e) => setCustomResetPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-red-600">
              {isHindi ? 'किसान खाता हटाएं' : 'Delete Farmer Account'}
            </h4>
            <p className="text-xs text-slate-500">
              {isHindi
                ? `क्या आप वाकई ${farmer.name} का खाता हटाना चाहते हैं?`
                : `Are you sure you want to delete ${farmer.name}'s account?`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFarmer}
                disabled={deleteSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
              >
                {deleteSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminFarmerDetailPage;
