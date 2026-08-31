import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  CheckCircle,
  Video,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileVideo,
  Loader2,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { WebsiteSettings } from '../../types';
import { ChickLoader } from '../../components/ChickLoader';

export const AdminWebsiteSettingsPage: React.FC = () => {
  const { isHindi } = useLanguage();

  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // File state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings/website');
      if (res.data.success) {
        setSettings(res.data.data);
        if (res.data.data.logoUrl) {
          setLogoPreview(res.data.data.logoUrl);
        }
        if (res.data.data.heroVideoUrl) {
          setVideoPreview(res.data.data.heroVideoUrl);
        }
        if (res.data.data.heroPosterUrl) {
          setPosterPreview(res.data.data.heroPosterUrl);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file size exceeds 100MB limit. Please choose a smaller video.');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    if (settings) {
      setSettings({ ...settings, logoUrl: '' });
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    if (settings) {
      setSettings({ ...settings, heroVideoUrl: '' });
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview('');
    if (settings) {
      setSettings({ ...settings, heroPosterUrl: '' });
    }
    if (posterInputRef.current) {
      posterInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccess(false);

    try {
      const formData = new FormData();

      // Append text fields
      formData.append('heroTitle', settings.heroTitle || '');
      formData.append('heroTitleHi', settings.heroTitleHi || '');
      formData.append('heroSubtitle', settings.heroSubtitle || '');
      formData.append('heroSubtitleHi', settings.heroSubtitleHi || '');
      formData.append('phone', settings.phone || '');
      formData.append('whatsappNumber', settings.whatsappNumber || '');
      formData.append('address', settings.address || '');
      formData.append('addressHi', settings.addressHi || '');

      // Keep existing URLs if no new files selected
      if (!logoFile && settings.logoUrl !== undefined) {
        formData.append('logoUrl', settings.logoUrl);
      }
      if (!videoFile && settings.heroVideoUrl !== undefined) {
        formData.append('heroVideoUrl', settings.heroVideoUrl);
      }
      if (!posterFile && settings.heroPosterUrl !== undefined) {
        formData.append('heroPosterUrl', settings.heroPosterUrl);
      }

      // Append new files if selected
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (videoFile) {
        formData.append('heroVideo', videoFile);
      }
      if (posterFile) {
        formData.append('heroPoster', posterFile);
      }

      const res = await api.put('/settings/website', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setSuccess(true);
        setSettings(res.data.data);
        if (res.data.data.logoUrl) setLogoPreview(res.data.data.logoUrl);
        if (res.data.data.heroVideoUrl) setVideoPreview(res.data.data.heroVideoUrl);
        if (res.data.data.heroPosterUrl) setPosterPreview(res.data.data.heroPosterUrl);
        setLogoFile(null);
        setVideoFile(null);
        setPosterFile(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save website settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ChickLoader text="Loading website settings..." />;
  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-600" />
            <span>{isHindi ? 'वेबसाइट ब्रांडिंग, लोगो व वीडियो सेटिंग्स' : 'Website Branding, Logo & Video Settings'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload brand logo, hero background video (MP4), fallback poster, titles, and dealership contact info
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Brand logo and website configuration updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: Brand Logo Upload */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Brand Logo (ब्रांड लोगो अपलोड)</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Appears in Header, Footer & Mobile PWA App
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            {/* Logo Preview Box */}
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner overflow-hidden shrink-0">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Brand Logo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-2">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                  <span className="text-[9px] text-slate-400 block mt-1">Default Chick</span>
                </div>
              )}
            </div>

            {/* Logo Upload Controls */}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoSelect}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-600" />
                  <span>{logoPreview ? 'Change Logo (लोगो बदलें)' : 'Upload Logo (लोगो अपलोड करें)'}</span>
                </button>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Recommended: Square image (.PNG with transparent background, .SVG, or .WEBP). Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Hero Banner Titles */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Hero Banner Titles & Headings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Hero Title (English)</label>
              <input
                type="text"
                value={settings.heroTitle}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Hero Title (Hindi)</label>
              <input
                type="text"
                value={settings.heroTitleHi}
                onChange={(e) => setSettings({ ...settings, heroTitleHi: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Hero Subtitle (English)</label>
              <textarea
                rows={2}
                value={settings.heroSubtitle}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Hero Subtitle (Hindi)</label>
              <textarea
                rows={2}
                value={settings.heroSubtitleHi}
                onChange={(e) => setSettings({ ...settings, heroSubtitleHi: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Direct Video & Poster Upload */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-brand-600" />
              <span>Direct Video & Poster Upload (डायरेक्ट वीडियो अपलोड)</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              No URLs needed — Upload directly from device
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Upload Card */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-brand-600" />
                  <span>Hero Background Video (MP4 / WebM)</span>
                </label>
                {videoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="p-1 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Remove Video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Video Player Preview */}
              {videoPreview ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-700 shadow-inner">
                  <video
                    src={videoPreview}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {videoFile && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-brand-600 text-white text-[10px] font-bold shadow-md">
                      Ready to Upload ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center space-y-2">
                  <FileVideo className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">No video uploaded yet</p>
                </div>
              )}

              {/* File Picker Button */}
              <div>
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoSelect}
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-98"
                >
                  <Upload className="w-4 h-4 text-brand-600" />
                  <span>{videoPreview ? 'Change Video File (बदलें)' : 'Choose Video File (वीडियो चुनें)'}</span>
                </button>
                <span className="text-[10px] text-slate-400 block text-center mt-1">
                  Supported formats: MP4, WebM (Max 100MB)
                </span>
              </div>
            </div>

            {/* Poster Image Upload Card */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-brand-600" />
                  <span>Fallback Poster Image (फोटो / पोस्टर)</span>
                </label>
                {posterPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePoster}
                    className="p-1 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Remove Poster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Image Preview */}
              {posterPreview ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-700 shadow-inner">
                  <img
                    src={posterPreview}
                    alt="Poster Preview"
                    className="w-full h-full object-cover"
                  />
                  {posterFile && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-md">
                      Ready to Upload ({(posterFile.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">No poster image uploaded yet</p>
                </div>
              )}

              {/* File Picker Button */}
              <div>
                <input
                  type="file"
                  ref={posterInputRef}
                  onChange={handlePosterSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-98"
                >
                  <Upload className="w-4 h-4 text-brand-600" />
                  <span>{posterPreview ? 'Change Poster Image (बदलें)' : 'Choose Poster Image (फोटो चुनें)'}</span>
                </button>
                <span className="text-[10px] text-slate-400 block text-center mt-1">
                  Supported formats: JPG, PNG, WebP (Shown while video loads)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Dealership Contact Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Dealership Contact & Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Phone Number</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">WhatsApp Number (e.g. 919876543210)</label>
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Office Address (English)</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Office Address (Hindi)</label>
              <input
                type="text"
                value={settings.addressHi}
                onChange={(e) => setSettings({ ...settings, addressHi: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-brand-600/30 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading & Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Website Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
