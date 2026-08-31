import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Receipt,
  ClipboardList,
  Layers,
  Scale,
  MessageSquare,
  KeyRound,
  Download,
  Plus,
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { api, formatINR, formatDate, formatDateTime } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { User as FarmerUser, LedgerTransaction, BalanceSummary, Order, ChickBatch, BirdSale, Product } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { CredentialsCard } from '../../components/CredentialsCard';

export const AdminFarmerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isHindi } = useLanguage();

  const [activeTab, setActiveTab] = useState<'LEDGER' | 'ORDERS' | 'CHICKS' | 'SETTLEMENTS'>('LEDGER');
  const [farmer, setFarmer] = useState<FarmerUser | null>(null);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ChickBatch[]>([]);
  const [settlements, setSettlements] = useState<BirdSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Delete states
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

  // Modals
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isAddSupplyModalOpen, setIsAddSupplyModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [resetCredentials, setResetCredentials] = useState<any | null>(null);

  // Form states
  const [txForm, setTxForm] = useState({
    transactionType: 'PAYMENT_RECEIVED',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  const [orderCart, setOrderCart] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState('');

  const [supplyForm, setSupplyForm] = useState({
    quantity: '1000',
    ratePerChick: '35',
    breed: 'Broiler (Cobb 500)',
    supplyDate: new Date().toISOString().split('T')[0],
    postToLedger: true
  });

  const [settleForm, setSettleForm] = useState({
    batchId: '',
    actualBirds: '',
    actualTotalKg: '',
    ratePerKg: '120',
    deductions: '0',
    adjustments: '0',
    buyerName: '',
    notes: '',
    postToLedger: true
  });

  const loadData = async () => {
    if (!id) return;
    try {
      const [farmerRes, ledgerRes, orderRes, batchRes, settleRes, prodRes] = await Promise.all([
        api.get(`/farmers/${id}`),
        api.get(`/ledger/farmer/${id}`),
        api.get(`/orders?farmerId=${id}`),
        api.get(`/batches?farmerId=${id}`),
        api.get(`/bird-sales?farmerId=${id}`),
        api.get('/products/active')
      ]);

      if (farmerRes.data.success) setFarmer(farmerRes.data.data);
      if (ledgerRes.data.success) {
        setTransactions(ledgerRes.data.data.transactions);
        setBalanceSummary(ledgerRes.data.data.balanceSummary);
      }
      if (orderRes.data.success) setOrders(orderRes.data.data);
      if (batchRes.data.success) setBatches(batchRes.data.data);
      if (settleRes.data.success) setSettlements(settleRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handlers
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/ledger/transaction', {
        farmerId: id,
        ...txForm
      });
      if (res.data.success) {
        setIsAddTxModalOpen(false);
        setTxForm({
          transactionType: 'PAYMENT_RECEIVED',
          amount: '',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0]
        });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add transaction.');
    }
  };

  const handleVoidTransaction = async (txId: string) => {
    const reason = prompt('Enter reason for voiding/reversing this transaction:');
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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.keys(orderCart)
      .filter((pId) => orderCart[pId] > 0)
      .map((pId) => ({
        productId: pId,
        quantity: orderCart[pId]
      }));

    if (items.length === 0) {
      alert('Select at least one product.');
      return;
    }

    try {
      const res = await api.post('/orders', {
        targetFarmerId: id,
        items,
        notes: orderNotes
      });
      if (res.data.success) {
        setIsCreateOrderModalOpen(false);
        setOrderCart({});
        setOrderNotes('');
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create order.');
    }
  };

  const handleAddSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/batches/supply', {
        farmerId: id,
        ...supplyForm
      });
      if (res.data.success) {
        setIsAddSupplyModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record chick supply.');
    }
  };

  const handleSettleBirdSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/bird-sales/settle', {
        farmerId: id,
        ...settleForm
      });
      if (res.data.success) {
        setIsSettleModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to settle bird sale.');
    }
  };

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [customResetPassword, setCustomResetPassword] = useState('');

  const handleOpenResetModal = () => {
    setCustomResetPassword('');
    setIsResetModalOpen(true);
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

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/ledger/farmer/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Statement_${farmer?.farmerId || 'Farmer'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF.');
    }
  };

  if (loading) return <ChickLoader text="Loading farmer details..." />;
  if (!farmer) return <div className="p-8 text-center text-xs">Farmer not found.</div>;

  const isDue = balanceSummary ? balanceSummary.netBalance > 0 : false;
  const isAdvance = balanceSummary ? balanceSummary.netBalance < 0 : false;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Farmer Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/farmers"
            className="p-2 text-slate-500 hover:text-brand-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
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
              {farmer.phone} · {farmer.village}, {farmer.district}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Farmer */}
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
            title="Edit Farmer Profile"
          >
            <Pencil className="w-3.5 h-3.5 text-brand-600" />
            <span>{isHindi ? 'संपादित करें (Edit)' : 'Edit Profile'}</span>
          </button>

          {/* Set / Reset Password */}
          <button
            onClick={handleOpenResetModal}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>

          {/* Download PDF Statement */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* Delete Farmer */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl shadow-sm hover:bg-red-100 transition-all"
            title="Delete Farmer Account"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isHindi ? 'खाता हटाएं (Delete)' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* Balance Summary Header Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 block">Total Purchases (Debit)</span>
          <span className="text-xl font-black font-display text-slate-900 dark:text-white">
            {formatINR(balanceSummary?.totalDebit || 0)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-emerald-600 block">Total Payments (Credit)</span>
          <span className="text-xl font-black font-display text-emerald-600">
            {formatINR(balanceSummary?.totalCredit || 0)}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDue
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-900 dark:text-red-200'
              : isAdvance
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
              : 'bg-white dark:bg-slate-900 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase block">
            {isDue ? 'Outstanding Due (बकाया)' : isAdvance ? 'Advance Balance (एडवांस)' : 'Settled'}
          </span>
          <span className="text-xl font-black font-display">
            {formatINR(Math.abs(balanceSummary?.netBalance || 0))}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'LEDGER'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Passbook / Ledger ({transactions.length})
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'ORDERS'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('CHICKS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'CHICKS'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chick Supply & Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab('SETTLEMENTS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'SETTLEMENTS'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bird Sale Settlements ({settlements.length})
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ledger Transactions
            </h3>
            <button
              onClick={() => setIsAddTxModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry (Payment / Debit)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Type & Description</th>
                  <th className="p-3.5 text-right">Debit (₹)</th>
                  <th className="p-3.5 text-right">Credit (₹)</th>
                  <th className="p-3.5 text-right">Running Balance (₹)</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx._id} className={tx.isVoided ? 'opacity-40 line-through' : ''}>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{tx.description}</p>
                      {tx.referenceId && <span className="text-[10px] text-slate-400">Ref: {tx.referenceId}</span>}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-600">
                      {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                      {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatINR(tx.calculatedRunningBalance || 0)}
                    </td>
                    <td className="p-3.5 text-center">
                      {!tx.isVoided && (
                        <button
                          onClick={() => handleVoidTransaction(tx._id)}
                          className="text-[10px] text-red-600 hover:underline font-bold"
                        >
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Farmer Orders</h3>
            <button
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Order for Farmer</span>
            </button>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-xs text-brand-600">{order.orderId}</span>
                  <p className="text-xs text-slate-500">
                    {order.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-display">{formatINR(order.totalAmount)}</span>
                  <span className="block text-[10px] font-bold text-slate-400">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHICKS */}
      {activeTab === 'CHICKS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chick Supply & Batches</h3>
            <button
              onClick={() => setIsAddSupplyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chick Supply</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {batches.map((b) => (
              <div
                key={b._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-xs text-brand-600">{b.batchNumber}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    {b.status}
                  </span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{b.breed}</p>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Chicks: {b.chicksSupplied}</span>
                  <span>Age: {b.approxAgeDays} Days</span>
                  <span>Cost: {formatINR(b.initialChicksCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SETTLEMENTS */}
      {activeTab === 'SETTLEMENTS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bird Sale Settlements</h3>
            <button
              onClick={() => setIsSettleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Settle Bird Sale</span>
            </button>
          </div>

          <div className="space-y-3">
            {settlements.map((s) => (
              <div
                key={s._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-xs text-brand-600">{s.settlementId}</span>
                  <span className="text-xs text-slate-400">{formatDate(s.settlementDate)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div>Birds: <span className="font-bold">{s.actualBirds}</span></div>
                  <div>Total Weight: <span className="font-bold">{s.actualTotalKg} KG</span></div>
                  <div>Rate: <span className="font-bold">₹{s.ratePerKg}/KG</span></div>
                  <div>Net Credit: <span className="font-bold text-emerald-600">{formatINR(s.netCreditAmount)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Transaction */}
      {isAddTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Add Ledger Transaction</h4>
              <button onClick={() => setIsAddTxModalOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Transaction Type</label>
                <select
                  value={txForm.transactionType}
                  onChange={(e) => setTxForm({ ...txForm, transactionType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                >
                  <option value="PAYMENT_RECEIVED">Payment Received (Credit / Jama)</option>
                  <option value="ADVANCE_PAYMENT">Advance Payment (Credit)</option>
                  <option value="PRODUCT_PURCHASE">Product Purchase (Debit / Baki)</option>
                  <option value="CHICK_PURCHASE">Chick Supply (Debit)</option>
                  <option value="ADJUSTMENT_CREDIT">Adjustment (Credit)</option>
                  <option value="ADJUSTMENT_DEBIT">Adjustment (Debit)</option>
                  <option value="DISCOUNT">Discount (Credit)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  placeholder="Optional custom description"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl">
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Order */}
      {isCreateOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Create Order for {farmer.name}</h4>
              <button onClick={() => setIsCreateOrderModalOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {products.map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2 rounded-xl border">
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <span className="text-[10px] text-slate-400">{formatINR(p.price)} / {p.unit}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={orderCart[p._id] || 0}
                      onChange={(e) => setOrderCart({ ...orderCart, [p._id]: Number(e.target.value) })}
                      className="w-20 p-1.5 rounded-lg border text-center font-bold"
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl">
                Create Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Chick Supply */}
      {isAddSupplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold">Add Chick Supply & Create Batch</h4>
              <button onClick={() => setIsAddSupplyModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddSupply} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Quantity of Chicks *</label>
                <input
                  type="number"
                  required
                  value={supplyForm.quantity}
                  onChange={(e) => setSupplyForm({ ...supplyForm, quantity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Rate per Chick (₹) *</label>
                <input
                  type="number"
                  required
                  value={supplyForm.ratePerChick}
                  onChange={(e) => setSupplyForm({ ...supplyForm, ratePerChick: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl text-brand-900 dark:text-brand-200 font-bold">
                Total Amount: {formatINR(Number(supplyForm.quantity || 0) * Number(supplyForm.ratePerChick || 0))}
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl">
                Save & Post to Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bird Sale Settle */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold">Settle Bird Sale & Post Credit</h4>
              <button onClick={() => setIsSettleModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSettleBirdSale} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Actual Bird Count *</label>
                <input
                  type="number"
                  required
                  value={settleForm.actualBirds}
                  onChange={(e) => setSettleForm({ ...settleForm, actualBirds: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Actual Total Weight (KG) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settleForm.actualTotalKg}
                  onChange={(e) => setSettleForm({ ...settleForm, actualTotalKg: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Live Rate per KG (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settleForm.ratePerKg}
                  onChange={(e) => setSettleForm({ ...settleForm, ratePerKg: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-900 dark:text-emerald-200 font-bold">
                Gross Credit: {formatINR(Number(settleForm.actualTotalKg || 0) * Number(settleForm.ratePerKg || 0))}
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl">
                Settle & Credit Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <span>Set Custom Password / पासवर्ड रीसेट</span>
              </h3>
              <button onClick={() => setIsResetModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteResetPassword} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Farmer:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                  {farmer.name} ({farmer.farmerId})
                </span>
                <span className="text-[11px] text-slate-400 block">Phone: {farmer.phone}</span>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  New Password (नया पासवर्ड दर्ज करें या जनरेट करें)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customResetPassword}
                    onChange={(e) => setCustomResetPassword(e.target.value)}
                    placeholder="Type custom password (e.g. 123456) or generate"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = Math.random().toString(36).slice(-8).toUpperCase();
                      setCustomResetPassword(randomPass);
                    }}
                    className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Leave blank to automatically generate a secure 8-character password.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold shadow-md transition-all"
                >
                  Save & View Credentials Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Farmer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'किसान विवरण संपादित करें (Edit Farmer)' : 'Edit Farmer Profile'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Farmer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (सक्रिय - लॉगिन चालू)</option>
                    <option value="SUSPENDED">SUSPENDED (निलंबित - लॉगिन बंद)</option>
                    <option value="INACTIVE">INACTIVE (निष्क्रिय)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    value={editForm.farmName}
                    onChange={(e) => setEditForm({ ...editForm, farmName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Farm Capacity (Birds)
                  </label>
                  <input
                    type="number"
                    value={editForm.farmCapacity}
                    onChange={(e) => setEditForm({ ...editForm, farmCapacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Village *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.village}
                    onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.pinCode}
                    onChange={(e) => setEditForm({ ...editForm, pinCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold shadow-md transition-all"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Farmer Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Farmer Confirmation Modal */}
      {isDeleteModalOpen && farmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-red-200 dark:border-red-900 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isHindi ? 'क्या आप इस किसान को हटाना चाहते हैं?' : 'Delete Farmer Account?'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {isHindi
                  ? `आप "${farmer.name}" (${farmer.farmerId}) का खाता हटाने जा रहे हैं।`
                  : `You are about to delete account for "${farmer.name}" (${farmer.farmerId}).`}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 space-y-1">
              <p className="font-bold">
                ⚠️ {isHindi ? 'स्थायी निष्कासन चेतावनी:' : 'Permanent Action:'}
              </p>
              <p className="text-[11px]">
                {isHindi
                  ? 'हटाने के बाद यह किसान अपने किसान आईडी अथवा मोबाइल नंबर से दोबारा लॉगिन नहीं कर सकेगा।'
                  : 'Once deleted, this farmer will be permanently blocked from logging into the portal.'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteFarmer}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all"
              >
                {deleteSubmitting ? 'Deleting...' : isHindi ? 'हाँ, खाता हटाएं' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Credentials Popup */}
      {resetCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <CredentialsCard
            farmerId={resetCredentials.farmerId}
            username={resetCredentials.username}
            temporaryPassword={resetCredentials.temporaryPassword}
            name={resetCredentials.name}
            phone={resetCredentials.phone}
            onClose={() => setResetCredentials(null)}
          />
        </div>
      )}
    </div>
  );
};
