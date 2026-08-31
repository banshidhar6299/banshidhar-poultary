import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Filter, User } from 'lucide-react';
import { api, formatDateTime } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { AuditLog } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';
import { EmptyState } from '../../components/EmptyState';

export const AdminAuditPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadAuditLogs = async () => {
    try {
      let url = '/audit?limit=100';
      if (actionFilter) url += `&action=${actionFilter}`;
      const res = await api.get(url);
      if (res.data.success) setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  if (loading) return <ChickLoader text="Loading audit logs..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-600" />
            <span>{isHindi ? 'सिस्टम ऑडिट एवं सुरक्षा लॉग्स' : 'System Audit & Activity Logs'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable log of all financial updates, rate modifications, ledger postings, and authentication events
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
        >
          <option value="">All Actions</option>
          <option value="FARMER_CREATED">FARMER_CREATED</option>
          <option value="ORDER_CREATED">ORDER_CREATED</option>
          <option value="ORDER_STATUS_CHANGED">ORDER_STATUS_CHANGED</option>
          <option value="LEDGER_TRANSACTION_ADDED">LEDGER_TRANSACTION_ADDED</option>
          <option value="CHICK_SUPPLY_RECORDED">CHICK_SUPPLY_RECORDED</option>
          <option value="BIRD_SALE_SETTLED">BIRD_SALE_SETTLED</option>
          <option value="RATE_CARD_CREATED">RATE_CARD_CREATED</option>
          <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
        </select>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          description="Activity logs will be recorded as actions take place in the system."
          icon={ShieldCheck}
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Performer</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="p-3.5 text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-800 dark:text-slate-200">
                    {log.performerRole} {log.performerId && `(${log.performerId.slice(-4)})`}
                  </td>
                  <td className="p-3.5 font-sans text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="p-3.5 text-slate-400 text-[10px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
