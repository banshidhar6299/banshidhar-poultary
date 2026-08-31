import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldAlert, Clock } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ChickLogo } from '../../components/ChickLogo';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockCountdown, setLockCountdown] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (lockCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockCountdown > 0) return;
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', { username, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/admin');
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.locked && data?.remainingSec) {
        setLockCountdown(data.remainingSec);
        setError(data.message || 'Too many failed login attempts (10+). Account locked for 15 minutes.');
      } else {
        setError(data?.message || 'Invalid admin credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <ChickLogo size={48} className="justify-center" />
          <h2 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            Admin Portal Login
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Banshidhar Poultry Management & Dealership Console
          </p>
        </div>

        {/* Lockout Timer Banner */}
        {lockCountdown > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1 text-center animate-pulse">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>SECURITY LOCKOUT ACTIVATED</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              10+ incorrect attempts detected. Please wait:
            </p>
            <p className="text-xl font-mono font-black text-amber-950 dark:text-amber-100">
              {formatTimer(lockCountdown)}
            </p>
          </div>
        )}

        {error && lockCountdown <= 0 && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                disabled={lockCountdown > 0}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or admin@banshidharpoultry.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password?role=ADMIN"
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={lockCountdown > 0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || lockCountdown > 0}
            className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-brand-600/30 transition-all"
          >
            {loading
              ? 'Authenticating...'
              : lockCountdown > 0
              ? `Locked (${formatTimer(lockCountdown)})`
              : 'Login as Admin'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 transition-colors"
          >
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
};
