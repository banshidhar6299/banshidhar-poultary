import React, { useState, useEffect } from 'react';
import { Layers, Calendar, Scale, CheckCircle2, AlertCircle, Send, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatDate, formatINR } from '../../api/client';
import { ChickBatch } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const FarmerBatchesPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [batches, setBatches] = useState<ChickBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Sale inquiry modal state
  const [selectedBatch, setSelectedBatch] = useState<ChickBatch | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    approxBirds: '',
    approxAvgWeightKg: '',
    approxTotalKg: '',
    notes: ''
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const loadBatches = async () => {
    try {
      const res = await api.get('/batches');
      if (res.data.success) setBatches(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleOpenInquiry = (batch: ChickBatch) => {
    setSelectedBatch(batch);
    setInquiryForm({
      approxBirds: String(batch.chicksSupplied - (batch.mortalityCount || 0)),
      approxAvgWeightKg: '2.0',
      approxTotalKg: String((batch.chicksSupplied - (batch.mortalityCount || 0)) * 2),
      notes: ''
    });
    setInquirySuccess(false);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setSubmittingInquiry(true);
    try {
      const res = await api.post(`/batches/${selectedBatch._id}/sale-inquiry`, inquiryForm);
      if (res.data.success) {
        setInquirySuccess(true);
        loadBatches();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit inquiry.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) return <ChickLoader text="Loading flock batches..." />;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
          {isHindi ? 'चूजा बैच एवं फ्लॉक ट्रैकिंग' : 'Chick Flock & Batch Tracking'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isHindi
            ? 'चूजों की आयु (दिन), कुल संख्या और मुर्गियां तैयार होने पर बिक्री सूचना भेजें'
            : 'Track flock age, supplied chicks, and notify dealer when birds are ready for sale'}
        </p>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          title={isHindi ? 'कोई सक्रिय चूजा बैच नहीं है।' : 'No flock batches recorded.'}
          description={
            isHindi
              ? 'जब बंशीधर पोल्ट्री द्वारा आपके शेड में चूजे डाले जाएंगे, यहां बैच रिकॉर्ड दिखाई देगा।'
              : 'Flock records will appear once chicks are supplied to your farm.'
          }
          icon={Layers}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Batch Number
                  </span>
                  <h3 className="text-lg font-black font-mono text-brand-700 dark:text-brand-400">
                    {batch.batchNumber}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                    {batch.breed}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    batch.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : batch.status === 'READY_FOR_SALE'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {batch.status}
                </span>
              </div>

              {/* Stats Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <span className="text-xl font-black font-display text-brand-600 dark:text-brand-400 block">
                    {batch.approxAgeDays || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {isHindi ? 'दिन का चूजा' : 'Days Old'}
                  </span>
                </div>

                <div>
                  <span className="text-xl font-black font-display text-slate-800 dark:text-slate-200 block">
                    {batch.chicksSupplied}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {isHindi ? 'डाले गए चूजे' : 'Supplied'}
                  </span>
                </div>

                <div>
                  <span className="text-xl font-black font-display text-slate-800 dark:text-slate-200 block">
                    {formatDate(batch.startDate)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {isHindi ? 'शुरुआत तिथि' : 'Start Date'}
                  </span>
                </div>
              </div>

              {/* Sale inquiry info if submitted */}
              {batch.saleInquiry?.isInquired && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>{isHindi ? 'बिक्री सूचना भेजी गई है' : 'Sale Inquiry Sent to Dealer'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Approx: {batch.saleInquiry.approxBirds} birds · {batch.saleInquiry.approxTotalKg} KG total
                  </p>
                </div>
              )}

              {/* Action Button */}
              {batch.status === 'ACTIVE' && (
                <button
                  onClick={() => handleOpenInquiry(batch)}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Scale className="w-4 h-4" />
                  <span>
                    {isHindi ? 'मुर्गी तैयार: डीलर को उठान सूचना दें' : 'Inform Dealer: Birds Ready for Lifting'}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sale Inquiry Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'मुर्गी बिक्री सूचना (Lifting Inquiry)' : 'Bird Sale / Lifting Notification'}
                </h3>
                <span className="text-[11px] text-slate-500">Batch: {selectedBatch.batchNumber}</span>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'सूचना डीलर को भेज दी गई है!' : 'Inquiry Sent Successfully!'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isHindi
                    ? 'बंशीधर पोल्ट्री गाड़ी और तौल का समय निर्धारित करके आपसे संपर्क करेगी।'
                    : 'Banshidhar Poultry will arrange lifting vehicle and weighment.'}
                </p>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="px-6 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'अनुमानित तैयार मुर्गियों की संख्या' : 'Approximate Number of Birds'}
                  </label>
                  <input
                    type="number"
                    required
                    value={inquiryForm.approxBirds}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, approxBirds: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'अनुमानित प्रति मुर्गी वजन (KG)' : 'Approx Average Weight per Bird (KG)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inquiryForm.approxAvgWeightKg}
                    onChange={(e) => {
                      const avg = e.target.value;
                      const birds = parseFloat(inquiryForm.approxBirds) || 0;
                      setInquiryForm({
                        ...inquiryForm,
                        approxAvgWeightKg: avg,
                        approxTotalKg: String(Math.round(birds * parseFloat(avg || '0') * 100) / 100)
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'अनुमानित कुल वजन (KG)' : 'Approx Total Weight (KG)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={inquiryForm.approxTotalKg}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, approxTotalKg: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isHindi ? 'विशेष टिप्पणी / संदेश' : 'Additional Notes / Message'}
                  </label>
                  <textarea
                    rows={2}
                    value={inquiryForm.notes}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, notes: e.target.value })}
                    placeholder="e.g. Birds ready for lifting this weekend"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingInquiry}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submittingInquiry ? 'Sending...' : isHindi ? 'डीलर को सूचना भेजें' : 'Send to Dealer'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
