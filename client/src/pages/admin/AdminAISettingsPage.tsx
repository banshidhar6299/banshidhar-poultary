import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  CheckCircle,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Eye,
  AlertTriangle,
  Layers,
  Zap
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { AISettings, ProviderHealthStatus } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';

export const AdminAISettingsPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [settings, setSettings] = useState<AISettings | null>(null);
  const [healthStatus, setHealthStatus] = useState<ProviderHealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [settingsRes, healthRes] = await Promise.all([
        api.get('/settings/ai'),
        api.get('/ai/health')
      ]);

      if (settingsRes.data.success) {
        setSettings(settingsRes.data.data);
      }
      if (healthRes.data.success) {
        setHealthStatus(healthRes.data.data.providers || []);
      }
    } catch (err) {
      console.error('Error loading AI configuration:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshHealth = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccess(false);
    try {
      const res = await api.put('/settings/ai', settings);
      if (res.data.success) {
        setSuccess(true);
        setSettings(res.data.data);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ChickLoader text="Loading AI settings..." />;
  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-600" />
            <span>{isHindi ? 'AI कुक्कुट मित्र सेटिंग्स (AgentRouter · Gemini · Groq)' : 'AI Health Assistant Settings'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure intelligent multi-provider routing (AgentRouter → Gemini → Groq), vision models, and automatic cooldown circuit breaker
          </p>
        </div>

        <button
          onClick={handleRefreshHealth}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Health</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>AI configuration saved successfully!</span>
        </div>
      )}

      {/* Provider Health & Circuit-Breaker Live Monitor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthStatus.map((p) => (
          <div
            key={p.name}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    p.isAvailable && p.isConfigured
                      ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm animate-pulse'
                      : p.cooldownRemainingSec > 0
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {p.displayName}
                </h3>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  p.isAvailable && p.isConfigured
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : p.cooldownRemainingSec > 0
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                }`}
              >
                {p.cooldownRemainingSec > 0
                  ? `Cooldown (${p.cooldownRemainingSec}s)`
                  : p.isConfigured
                  ? 'Active / Ready'
                  : 'Key Missing (Fallback)'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Model:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                  {p.model}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Vision Support:</span>
                <span className={`font-bold ${p.supportsVision ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {p.supportsVision ? 'Enabled ✓' : 'Text Only'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Failure Count:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {p.failureCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Enable Toggle Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Assistant Global Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              When disabled, the AI chat button is completely hidden across the public website and farmer portal.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {/* Priority & Failover Architecture */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-600" />
            <span>Intelligent Router & Failover Flow</span>
          </h3>

          <div>
            <label className="block font-bold mb-1">Provider Priority Sequence</label>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>1. AgentRouter (Primary)  →  2. Google Gemini (Secondary)  →  3. Groq (Tertiary)  →  [Local RAG Fallback]</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              If AgentRouter gets 429, timeout, network error, or server error, it is placed in cooldown and request automatically retries on Gemini, then Groq.
            </span>
          </div>

          {/* Model Configuration per Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-bold mb-1">AgentRouter Model</label>
              <input
                type="text"
                value={settings.agentRouterModel}
                onChange={(e) => setSettings({ ...settings, agentRouterModel: e.target.value })}
                placeholder="claude-3-5-sonnet-20241022"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">e.g. claude-3-5-sonnet-20241022, gpt-4o</span>
            </div>

            <div>
              <label className="block font-bold mb-1">Google Gemini Model</label>
              <input
                type="text"
                value={settings.geminiModel}
                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                placeholder="gemini-1.5-flash"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">e.g. gemini-1.5-flash, gemini-1.5-pro</span>
            </div>

            <div>
              <label className="block font-bold mb-1">Groq Model</label>
              <input
                type="text"
                value={settings.groqModel}
                onChange={(e) => setSettings({ ...settings, groqModel: e.target.value })}
                placeholder="llama-3.3-70b-versatile"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">e.g. llama-3.3-70b-versatile, llama-3.2-11b-vision-preview</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-bold mb-1">Circuit Breaker Cooldown Duration (Seconds)</label>
              <input
                type="number"
                value={settings.circuitBreakerCooldownSec || 60}
                onChange={(e) => setSettings({ ...settings, circuitBreakerCooldownSec: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Time to pause requests to a failing provider before auto-restoring.</span>
            </div>

            <div>
              <label className="block font-bold mb-1">Max Response Tokens</label>
              <input
                type="number"
                value={settings.maxResponseTokens || 800}
                onChange={(e) => setSettings({ ...settings, maxResponseTokens: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Veterinary Emergency Disclaimers
          </h3>

          <div>
            <label className="block font-bold mb-1">English Disclaimer</label>
            <textarea
              rows={2}
              value={settings.emergencyDisclaimerEn}
              onChange={(e) => setSettings({ ...settings, emergencyDisclaimerEn: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Hindi Disclaimer</label>
            <textarea
              rows={2}
              value={settings.emergencyDisclaimerHi}
              onChange={(e) => setSettings({ ...settings, emergencyDisclaimerHi: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-brand-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save AI Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
