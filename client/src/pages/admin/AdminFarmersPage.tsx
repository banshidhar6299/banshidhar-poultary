import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ArrowRight,
  Eye,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Phone,
  MapPin,
  Building,
  Mail
} from 'lucide-react';
import { api, formatINR } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { User, BalanceSummary } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';
import { CredentialsCard } from '../../components/CredentialsCard';

interface FarmerWithBalance extends User {
  balanceSummary?: BalanceSummary;
}

export const AdminFarmersPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [farmers, setFarmers] = useState<FarmerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add Farmer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [farmerForm, setFarmerForm] = useState({
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
    password: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);

  // Edit Farmer Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFarmerId, setEditingFarmerId] = useState('');
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

  // Delete Farmer Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingFarmer, setDeletingFarmer] = useState<FarmerWithBalance | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      let url = `/farmers?`;
      if (search) url += `search=${search}&`;
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setFarmers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, [search, statusFilter]);

  const handleCreateFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/farmers', farmerForm);
      if (res.data.success) {
        setCreatedCredentials(res.data.credentials);
        setIsAddModalOpen(false);
        setFarmerForm({
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
          password: '',
          notes: ''
        });
        loadFarmers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create farmer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (farmer: FarmerWithBalance) => {
    setEditingFarmerId(farmer.id || (farmer as any)._id);
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
    setEditSubmitting(true);
    try {
      const res = await api.put(`/farmers/${editingFarmerId}`, editForm);
      if (res.data.success) {
        setIsEditModalOpen(false);
        loadFarmers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update farmer.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenDelete = (farmer: FarmerWithBalance) => {
    setDeletingFarmer(farmer);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteFarmer = async () => {
    if (!deletingFarmer) return;
    const farmerId = deletingFarmer.id || (deletingFarmer as any)._id;
    setDeleteSubmitting(true);
    try {
      const res = await api.delete(`/farmers/${farmerId}`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        setDeletingFarmer(null);
        loadFarmers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete farmer.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'किसान खाता प्रबंधन' : 'Farmer Accounts Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isHindi
              ? 'पंजीकृत किसानों की सूची, संशोधन, खाता शेष और नए किसान जोड़ें'
              : 'Manage registered farmers, edit details, delete accounts, and review live ledger balances'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isHindi ? 'नया किसान जोड़ें' : 'Add New Farmer'}</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isHindi ? 'नाम, किसान आईडी, मोबाइल या गांव खोजें...' : 'Search by name, ID, mobile, or village...'}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
        >
          <option value="ALL">{isHindi ? 'सभी स्थिति (All Status)' : 'All Status'}</option>
          <option value="ACTIVE">ACTIVE (सक्रिय)</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>

      {/* Farmers List / Table */}
      {loading ? (
        <ChickLoader text="Loading farmers..." />
      ) : farmers.length === 0 ? (
        <EmptyState
          title={isHindi ? 'कोई किसान नहीं मिला' : 'No farmers found'}
          description={isHindi ? 'नया किसान खाता जोड़ने के लिए बटन पर क्लिक करें।' : 'Click Add New Farmer to create an account.'}
          actionLabel="Add Farmer"
          onAction={() => setIsAddModalOpen(true)}
          icon={Users}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmers.map((farmer) => {
            const bal = farmer.balanceSummary;
            const isDue = bal ? bal.netBalance > 0 : false;
            const isAdvance = bal ? bal.netBalance < 0 : false;

            return (
              <div
                key={farmer.id || (farmer as any)._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-black text-brand-600 dark:text-brand-400 uppercase">
                        {farmer.farmerId}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {farmer.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{farmer.phone}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          farmer.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {farmer.status}
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(farmer)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-all"
                        title={isHindi ? 'विवरण बदलें (Edit)' : 'Edit Farmer'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleOpenDelete(farmer)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                        title={isHindi ? 'खाता हटाएं (Delete)' : 'Delete Farmer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-1">
                    {farmer.farmName ? `${farmer.farmName} · ` : ''} {farmer.village}, {farmer.district}
                  </p>
                </div>

                {/* Balance Summary Box */}
                <div
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                    isDue
                      ? 'bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-300'
                      : isAdvance
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold text-[11px]">
                    {isDue ? 'Due (बकाया)' : isAdvance ? 'Advance (एडवांस)' : 'Settled'}
                  </span>
                  <span className="font-mono font-black text-sm">
                    {formatINR(Math.abs(bal?.netBalance || 0))}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    to={`/admin/farmers/${farmer.id || (farmer as any)._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <span>{isHindi ? 'खाता विवरण व लेन-देन' : 'View Ledger & Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
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

                <div>
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
      {isDeleteModalOpen && deletingFarmer && (
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
                  ? `आप "${deletingFarmer.name}" (${deletingFarmer.farmerId}) का खाता हटाने जा रहे हैं।`
                  : `You are about to delete account for "${deletingFarmer.name}" (${deletingFarmer.farmerId}).`}
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
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingFarmer(null);
                }}
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

      {/* Add Farmer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'नया किसान खाता जोड़ें' : 'Create New Farmer Account'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isHindi
                    ? 'सिस्टम स्वचालित रूप से किसान आईडी और अस्थायी पासवर्ड जनरेट करेगा'
                    : 'System will auto-generate Farmer ID and temporary password'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Farmer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmerForm.name}
                    onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
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
                    value={farmerForm.phone}
                    onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={farmerForm.email}
                    onChange={(e) => setFarmerForm({ ...farmerForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    value={farmerForm.farmName}
                    onChange={(e) => setFarmerForm({ ...farmerForm, farmName: e.target.value })}
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
                    value={farmerForm.address}
                    onChange={(e) => setFarmerForm({ ...farmerForm, address: e.target.value })}
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
                    value={farmerForm.village}
                    onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
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
                    value={farmerForm.district}
                    onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
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
                    value={farmerForm.pinCode}
                    onChange={(e) => setFarmerForm({ ...farmerForm, pinCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Farm Capacity (Birds)
                  </label>
                  <input
                    type="number"
                    value={farmerForm.farmCapacity}
                    onChange={(e) => setFarmerForm({ ...farmerForm, farmCapacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2 p-3 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/50 space-y-1.5">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    Set Custom Password / पासवर्ड सेट करें (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={farmerForm.password}
                      onChange={(e) => setFarmerForm({ ...farmerForm, password: e.target.value })}
                      placeholder="Leave blank for auto-generated password, or type your own (e.g. 123456)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = Math.random().toString(36).slice(-8).toUpperCase();
                        setFarmerForm({ ...farmerForm, password: randomPass });
                      }}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs whitespace-nowrap text-slate-700 dark:text-slate-200"
                    >
                      Generate Random
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Note: The farmer can log in using either this Password + Farmer ID or Password + Mobile Number.
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold shadow-md transition-all"
                >
                  {submitting ? 'Creating Account...' : 'Create Account & Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Credentials Popup Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <CredentialsCard
            farmerId={createdCredentials.farmerId}
            username={createdCredentials.username}
            temporaryPassword={createdCredentials.temporaryPassword}
            name={createdCredentials.name}
            phone={createdCredentials.phone}
            onClose={() => setCreatedCredentials(null)}
          />
        </div>
      )}
    </div>
  );
};
