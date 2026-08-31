import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, ShieldAlert, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';
import { api } from '../../api/client';
import { ChickLogo } from '../../components/ChickLogo';

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'FARMER' ? 'FARMER' : 'ADMIN';

  const [role, setRole] = useState<'ADMIN' | 'FARMER'>(initialRole);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim(), role });
      if (res.data.success) {
        setSubmitted(true);
        setMessage(res.data.message);
        if (res.data.devResetUrl) {
          setDevResetUrl(res.data.devResetUrl);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <ChickLogo size={48} className="justify-center" />
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            Reset Password / पासवर्ड रीसेट
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your registered email address to receive a secure Brevo email reset link.
          </p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole('ADMIN')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              role === 'ADMIN'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('FARMER')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              role === 'FARMER'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Farmer Portal</span>
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              {message}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Please check your inbox (and spam folder) for the password reset link from Banshidhar Poultry.
            </p>

            {devResetUrl && (
              <div className="pt-2 text-left bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">
                  Direct Reset Link (Dev Mode):
                </span>
                <a
                  href={devResetUrl}
                  className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 underline break-all"
                >
                  {devResetUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {role === 'ADMIN' ? 'Admin Registered Email' : 'Farmer Registered Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'ADMIN' ? 'e.g. admin@banshidharpoultry.com' : 'e.g. farmer@example.com'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {role === 'FARMER'
                  ? 'आपके पंजीकृत ईमेल पर 15 मिनट तक मान्य सुरक्षित पासवर्ड रीसेट लिंक भेजा जाएगा।'
                  : 'A secure 15-minute Brevo password reset link will be sent to this email address.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-brand-600/30 transition-all"
            >
              {loading ? 'Sending Reset Link...' : 'रीसेट लिंक भेजें / Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            to={role === 'ADMIN' ? '/admin/login' : '/farmer/login'}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
