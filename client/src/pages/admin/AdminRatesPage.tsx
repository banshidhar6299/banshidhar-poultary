import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Edit, Trash2, X } from 'lucide-react';
import { api, formatINR, formatDate } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { RateCard } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';

export const AdminRatesPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [rates, setRates] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RateCard | null>(null);
  const [form, setForm] = useState({
    title: '',
    titleHi: '',
    rate: '',
    unit: 'per Chick',
    unitHi: 'प्रति चूजा',
    note: '',
    noteHi: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    displayOrder: 0,
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);

  const loadRates = async () => {
    try {
      const res = await api.get('/rates');
      if (res.data.success) setRates(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleOpenModal = (r?: RateCard) => {
    if (r) {
      setEditingRate(r);
      setForm({
        title: r.title,
        titleHi: r.titleHi,
        rate: String(r.rate),
        unit: r.unit,
        unitHi: r.unitHi,
        note: r.note || '',
        noteHi: r.noteHi || '',
        effectiveDate: new Date(r.effectiveDate).toISOString().split('T')[0],
        displayOrder: r.displayOrder || 0,
        isActive: r.isActive
      });
    } else {
      setEditingRate(null);
      setForm({
        title: '',
        titleHi: '',
        rate: '',
        unit: 'per Chick',
        unitHi: 'प्रति चूजा',
        note: '',
        noteHi: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        displayOrder: rates.length + 1,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRate) {
        await api.put(`/rates/${editingRate._id}`, form);
      } else {
        await api.post('/rates', form);
      }
      setIsModalOpen(false);
      loadRates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save rate card.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate card?')) return;
    try {
      const res = await api.delete(`/rates/${id}`);
      if (res.data.success) loadRates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete rate.');
    }
  };

  if (loading) return <ChickLoader text="Loading rates..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'दैनिक पोल्ट्री रेट प्रबंधन' : 'Daily Poultry Rates Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Update live chick prices, live bird lifting rates, and feed bag rates
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rate Card</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rates.map((rate) => (
          <div
            key={rate._id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {formatDate(rate.effectiveDate)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    rate.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {rate.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{rate.title}</h3>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">{rate.titleHi}</p>

              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-display text-brand-600 dark:text-brand-400">
                  {formatINR(rate.rate)}
                </span>
                <span className="text-xs text-slate-500 block">/ {rate.unit}</span>
              </div>

              {rate.note && <p className="text-[11px] text-slate-400 mt-1">{rate.note}</p>}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => handleOpenModal(rate)}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(rate._id)}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold">{editingRate ? 'Edit Rate Card' : 'Add Rate Card'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Title (Hindi) *</label>
                  <input
                    type="text"
                    required
                    value={form.titleHi}
                    onChange={(e) => setForm({ ...form, titleHi: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Rate (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Unit (e.g. per Chick) *</label>
                  <input
                    type="text"
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Unit in Hindi</label>
                <input
                  type="text"
                  value={form.unitHi}
                  onChange={(e) => setForm({ ...form, unitHi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Cobb 500 / Ross 308"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
              >
                {submitting ? 'Saving...' : 'Save Rate Card'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
