import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { api, formatDate } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { FarmerJoinRequest } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';
import { CredentialsCard } from '../../components/CredentialsCard';

export const AdminJoinRequestsPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [requests, setRequests] = useState<FarmerJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let url = `/join-requests?`;
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;

      const res = await api.get(url);
      if (res.data.success) setRequests(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      const res = await api.post(`/join-requests/${id}/approve`, {});
      if (res.data.success) {
        setCreatedCredentials(res.data.credentials);
        loadRequests();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const res = await api.post(`/join-requests/${id}/reject`, { reason });
      if (res.data.success) loadRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            {isHindi ? 'किसान पंजीकरण आवेदन' : 'Farmer Registration Requests'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review new farmer inquiries submitted from the website and convert them into registered accounts
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
        >
          <option value="PENDING">PENDING (लंबित)</option>
          <option value="APPROVED">APPROVED (स्वीकृत)</option>
          <option value="REJECTED">REJECTED (अस्वीकृत)</option>
          <option value="ALL">All Requests</option>
        </select>
      </div>

      {loading ? (
        <ChickLoader text="Loading applications..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No join requests found"
          description="New applications submitted through the public website will appear here for verification."
          icon={UserPlus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{req.fullName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{req.phone}</span>
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : req.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{req.farmAddress}, {req.village}, {req.district} - {req.pinCode}</span>
                  </p>
                  <p>Expected Chicks: <span className="font-bold text-slate-800 dark:text-white">{req.expectedChicks}</span></p>
                  {req.message && <p className="italic text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl">"{req.message}"</p>}
                </div>
              </div>

              {req.status === 'PENDING' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReject(req._id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req._id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Convert to Farmer</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generated Credentials Modal on Approval */}
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
