import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Key,
  CheckCircle,
  ShieldAlert,
  Save,
  Mail,
  Send,
  LogOut,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';

export const FarmerProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { isHindi } = useLanguage();

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    farmName: user?.farmName || '',
    farmCapacity: user?.farmCapacity || 1000,
    address: user?.address || '',
    village: user?.village || '',
    district: user?.district || '',
    pinCode: user?.pinCode || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Email / Password Recovery State
  const [farmerEmail, setFarmerEmail] = useState(user?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.email) {
      setFarmerEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      const res = await api.put('/farmers/profile/update', {
        ...profileForm,
        email: farmerEmail ? farmerEmail.trim().toLowerCase() : undefined
      });
      if (res.data.success) {
        updateUser(res.data.data);
        setProfileSuccess(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setResetSuccess('');
    setDevResetUrl(null);

    if (!farmerEmail || !farmerEmail.trim()) {
      setEmailError(isHindi ? 'कृपया एक वैध ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    setSavingEmail(true);
    try {
      const clean = farmerEmail.trim().toLowerCase();
      const res = await api.put('/farmers/profile/update', { email: clean });
      if (res.data.success) {
        updateUser({ email: clean });
        setEmailSuccess(
          isHindi
            ? 'पंजीकृत ईमेल सुरक्षित हो गया! अब पासवर्ड भूलने पर इस ईमेल पर रीसेट लिंक प्राप्त होगा।'
            : 'Registered email saved successfully! You can now use this email to recover your password.'
        );
      }
    } catch (err: any) {
      setEmailError(err.response?.data?.message || 'Failed to update email.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSendTestResetLink = async () => {
    const targetEmail = farmerEmail || user?.email;
    if (!targetEmail || !targetEmail.trim()) {
      setEmailError(
        isHindi
          ? 'रीसेट लिंक भेजने से पहले कृपया अपना ईमेल पता सेव करें।'
          : 'Please enter and save your email address before requesting a reset link.'
      );
      return;
    }

    setSendingReset(true);
    setEmailError('');
    setResetSuccess('');
    setDevResetUrl(null);

    try {
      const res = await api.post('/auth/forgot-password', {
        email: targetEmail.trim(),
        role: 'FARMER'
      });

      if (res.data.success) {
        setResetSuccess(
          isHindi
            ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है (15 मिनट तक मान्य)!'
            : 'Password reset link sent to your email (Valid for 15 minutes)!'
        );
        if (res.data.devResetUrl) {
          setDevResetUrl(res.data.devResetUrl);
        }
      }
    } catch (err: any) {
      setEmailError(err.response?.data?.message || 'Failed to send reset link email.');
    } finally {
      setSendingReset(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(isHindi ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isHindi ? 'नए पासवर्ड मेल नहीं खा रहे हैं।' : 'New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">
          {isHindi ? 'किसान प्रोफ़ाइल एवं खाता सुरक्षा' : 'Farmer Profile & Security'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isHindi ? 'अपने फार्म की जानकारी, रिकवरी ईमेल और पोर्टल पासवर्ड प्रबंधित करें' : 'Manage your farm details, recovery email, and portal password'}
        </p>
      </div>

      {/* Account Info Badge */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-700 to-indigo-800 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-brand-200 block">
            Farmer ID / Username
          </span>
          <h2 className="text-xl font-black font-mono tracking-tight">{user?.farmerId}</h2>
          <p className="text-xs text-brand-200 mt-0.5">
            {user?.name} · {user?.phone} {user?.email ? `· ${user.email}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs border border-white/20 transition-all app-touch-active"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>{isHindi ? 'लॉगआउट' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* 1. Registered Email & Password Recovery (Brevo Reset Link) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-600" />
            <span>{isHindi ? 'पंजीकृत ईमेल (पासवर्ड रीसेट एवं रिकवरी)' : 'Registered Email for Password Reset'}</span>
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            {isHindi ? '15-मिनट सुरक्षा लिंक' : '15-Min Reset Link'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isHindi
            ? 'अपना ईमेल पता यहां सुरक्षित करें। पासवर्ड भूलने पर (Forgot Password) इसी ईमेल पर 15 मिनट का पासवर्ड रीसेट लिंक भेजा जाएगा।'
            : 'Save your email address here. If you ever forget your password, a 15-minute Brevo reset link will be sent to this email.'}
        </p>

        {emailError && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{emailError}</span>
          </div>
        )}

        {emailSuccess && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{emailSuccess}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {devResetUrl && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-brand-200 dark:border-brand-800 text-xs">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">
              Direct Reset Link (Dev Mode / लोकल लिंक):
            </span>
            <a
              href={devResetUrl}
              className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 underline break-all"
            >
              {devResetUrl}
            </a>
          </div>
        )}

        <form onSubmit={handleSaveEmail} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={farmerEmail}
                onChange={(e) => setFarmerEmail(e.target.value)}
                placeholder="e.g. farmer@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingEmail}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{savingEmail ? 'Saving...' : isHindi ? 'ईमेल सेव करें' : 'Save Email'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {isHindi ? 'पासवर्ड भूलने पर तुरंत ईमेल पर लिंक पाने के लिए इसे टेस्ट करें:' : 'Test password reset link dispatch to your email:'}
            </span>
            <button
              type="button"
              onClick={handleSendTestResetLink}
              disabled={sendingReset || !farmerEmail}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingReset ? 'Sending...' : isHindi ? 'रीसेट लिंक भेजें →' : 'Send Reset Link →'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Farm Details Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" />
          <span>{isHindi ? 'फार्म विवरण' : 'Farm Details'}</span>
        </h3>

        {profileSuccess && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{isHindi ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!' : 'Profile updated successfully!'}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isHindi ? 'फार्म का नाम' : 'Farm Name'}
              </label>
              <input
                type="text"
                value={profileForm.farmName}
                onChange={(e) => setProfileForm({ ...profileForm, farmName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isHindi ? 'फार्म क्षमता (पक्षियों की संख्या)' : 'Farm Capacity (Birds)'}
              </label>
              <input
                type="number"
                value={profileForm.farmCapacity}
                onChange={(e) => setProfileForm({ ...profileForm, farmCapacity: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isHindi ? 'गांव / कस्बा' : 'Village'}
              </label>
              <input
                type="text"
                value={profileForm.village}
                onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isHindi ? 'जिला' : 'District'}
              </label>
              <input
                type="text"
                value={profileForm.district}
                onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isHindi ? 'पूरा पता (Address)' : 'Full Address'}
              </label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isHindi ? 'पिन कोड (PIN Code)' : 'PIN Code'}
              </label>
              <input
                type="text"
                value={profileForm.pinCode}
                onChange={(e) => setProfileForm({ ...profileForm, pinCode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{savingProfile ? 'Saving...' : isHindi ? 'बदलाव सुरक्षित करें' : 'Save Changes'}</span>
          </button>
        </form>
      </div>

      {/* 3. Change Password Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-600" />
          <span>{isHindi ? 'सीधा पासवर्ड बदलें' : 'Change Password Directly'}</span>
        </h3>

        {passwordError && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{isHindi ? 'पासवर्ड सफलतापूर्वक बदल दिया गया!' : 'Password updated successfully!'}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isHindi ? 'वर्तमान पासवर्ड' : 'Current Password'}
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isHindi ? 'नया पासवर्ड' : 'New Password'}
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isHindi ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all"
          >
            {savingPassword ? 'Updating...' : isHindi ? 'पासवर्ड अपडेट करें' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* 4. Logout Section */}
      <div className="p-6 rounded-3xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
            <LogOut className="w-4 h-4 text-red-600" />
            <span>{isHindi ? 'किसान पोर्टल से लॉगआउट करें' : 'Logout from Farmer Portal'}</span>
          </h4>
          <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
            {isHindi
              ? 'लॉगआउट करने पर आपका सत्र सुरक्षित रूप से समाप्त हो जाएगा और आप मुख्य वेबसाइट होमपेज पर वापस पहुँच जाएंगे।'
              : 'Logging out will safely terminate your session and return you to the website home page.'}
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold rounded-xl shadow-md transition-all text-xs shrink-0 app-touch-active"
        >
          <LogOut className="w-4 h-4" />
          <span>{isHindi ? 'लॉगआउट करें (Home)' : 'Logout to Home'}</span>
        </button>
      </div>
    </div>
  );
};

export default FarmerProfilePage;
