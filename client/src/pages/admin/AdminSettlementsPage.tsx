import React, { useState, useEffect } from 'react';
import { Scale, Plus, Calendar, DollarSign, User, X } from 'lucide-react';
import { api, formatINR, formatDate } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { BirdSale, User as FarmerUser, ChickBatch } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const AdminSettlementsPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [settlements, setSettlements] = useState<BirdSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Settle Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [farmers, setFarmers] = useState<FarmerUser[]>([]);
  const [batches, setBatches] = useState<ChickBatch[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [settleForm, setSettleForm] = useState({
    actualBirds: '',
    actualTotalKg: '',
    ratePerKg: '120',
    deductions: '0',
    adjustments: '0',
    buyerName: 'Direct Dealership Lifting',
    notes: '',
    postToLedger: true
  });
  const [submitting, setSubmitting] = useState(false);

  const loadSettlements = async () => {
    try {
      const res = await api.get('/bird-sales');
      if (res.data.success) setSettlements(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    try {
      const fRes = await api.get('/farmers?limit=100');
      if (fRes.data.success && fRes.data.data.length > 0) {
        setFarmers(fRes.data.data);
        const fId = fRes.data.data[0]._id || fRes.data.data[0].id;
        setSelectedFarmerId(fId);
        loadFarmerBatches(fId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFarmerBatches = async (fId: string) => {
    try {
      const bRes = await api.get(`/batches?farmerId=${fId}`);
      if (bRes.data.success) {
        setBatches(bRes.data.data);
        if (bRes.data.data.length > 0) setSelectedBatchId(bRes.data.data[0]._id);
        else setSelectedBatchId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFarmerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = e.target.value;
    setSelectedFarmerId(fId);
    loadFarmerBatches(fId);
  };

  const grossAmount = Number(settleForm.actualTotalKg || 0) * Number(settleForm.ratePerKg || 0);
  const netCredit = grossAmount - Number(settleForm.deductions || 0) + Number(settleForm.adjustments || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId || !selectedBatchId) {
      alert('Please select farmer and flock batch.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/bird-sales/settle', {
        farmerId: selectedFarmerId,
        batchId: selectedBatchId,
        ...settleForm
      });

      if (res.data.success) {
        setIsModalOpen(false);
        setSettleForm({
          actualBirds: '',
          actualTotalKg: '',
          ratePerKg: '120',
          deductions: '0',
          adjustments: '0',
          buyerName: 'Direct Dealership Lifting',
          notes: '',
          postToLedger: true
        });
        loadSettlements();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to settle bird sale.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ChickLoader text="Loading settlements..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'मुर्गी बिक्री व तौल निपटान' : 'Bird Sales & Weighment Settlements'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record live bird weighments (Weight × Rate) and credit amounts to farmer ledgers
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all shrink-0"
        >
          <Scale className="w-4 h-4" />
          <span>New Bird Sale Settlement</span>
        </button>
      </div>

      {settlements.length === 0 ? (
        <EmptyState
          title="No bird sale settlements recorded"
          description="Settle bird sales when dealership lifts grown flocks from farmer sheds."
          icon={Scale}
        />
      ) : (
        <div className="space-y-4">
          {settlements.map((s) => (
            <div
              key={s._id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono font-bold text-xs text-brand-600 dark:text-brand-400">
                    {s.settlementId}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Farmer: {s.farmerName}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">{formatDate(s.settlementDate)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Birds Lifted</span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.actualBirds} Birds</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Total Weight</span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.actualTotalKg} KG</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Rate per KG</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{s.ratePerKg} / KG</span>
                </div>

                <div>
                  <span className="text-emerald-600 block text-[11px] font-bold">Net Credited to Ledger</span>
                  <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {formatINR(s.netCreditAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold">New Bird Sale Settlement</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Select Farmer *</label>
                <select
                  value={selectedFarmerId}
                  onChange={handleFarmerChange}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  {farmers.map((f) => (
                    <option key={f.id || (f as any)._id} value={f.id || (f as any)._id}>
                      {f.farmerId} - {f.name} ({f.village})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Select Flock Batch *</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.batchNumber} - {b.breed} ({b.chicksSupplied} chicks, {b.approxAgeDays} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Actual Birds Lifted *</label>
                  <input
                    type="number"
                    required
                    value={settleForm.actualBirds}
                    onChange={(e) => setSettleForm({ ...settleForm, actualBirds: e.target.value })}
                    placeholder="e.g. 950"
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
                    placeholder="e.g. 2100"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Agreed Rate per KG (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={settleForm.ratePerKg}
                    onChange={(e) => setSettleForm({ ...settleForm, ratePerKg: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={settleForm.deductions}
                    onChange={(e) => setSettleForm({ ...settleForm, deductions: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Live Calculation Preview */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Gross (Total Weight × Rate):</span>
                  <span>{formatINR(grossAmount)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-300 pt-1 border-t border-emerald-200/60">
                  <span>Net Credited to Farmer Ledger:</span>
                  <span>{formatINR(netCredit)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-md"
              >
                {submitting ? 'Settling...' : 'Confirm Settlement & Post Credit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
