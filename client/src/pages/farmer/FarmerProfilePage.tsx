import React, { useState } from 'react';
import { User, Lock, Key, CheckCircle, ShieldAlert, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';

export const FarmerProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
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

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      const res = await api.put('/farmers/profile/update', profileForm);
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
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
          {isHindi ? 'अपने फार्म की जानकारी और पोर्टल पासवर्ड प्रबंधित करें' : 'Manage your farm details and portal login password'}
        </p>
      </div>

      {/* Account Info Badge */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-700 to-indigo-800 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-brand-200 block">
            Farmer ID / Username
          </span>
          <h2 className="text-xl font-black font-mono tracking-tight">{user?.farmerId}</h2>
          <p className="text-xs text-brand-200 mt-0.5">{user?.name} · {user?.phone}</p>
        </div>
      </div>

      {/* 1. Farm Details Form */}
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

      {/* 2. Change Password Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-600" />
          <span>{isHindi ? 'पासवर्ड बदलें' : 'Change Password'}</span>
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
    </div>
  );
};
