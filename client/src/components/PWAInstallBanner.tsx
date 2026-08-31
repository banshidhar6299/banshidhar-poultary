import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, Share, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t, isHindi } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert(
        isHindi
          ? 'iPhone पर इंस्टॉल करने के लिए Safari में नीचे दिए गए Share बटन (⎋) पर टैप करें और "Add to Home Screen" चुनें।'
          : 'To install on iPhone/iPad: Tap the Safari Share button (⎋) at the bottom and select "Add to Home Screen".'
      );
    } else {
      alert(
        isHindi
          ? 'Chrome मेनू (⋮) पर टैप करें और "Install App" या "Add to Home Screen" चुनें।'
          : 'Tap your browser menu (⋮) and select "Install App" or "Add to Home Screen".'
      );
    }
  };

  return (
    <section className={`w-full py-6 ${className}`}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-6 sm:p-10 text-white shadow-2xl shadow-brand-900/30 border border-brand-700/50">
        {/* Glow & Chick background */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-400/30">
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t.appDownload.badge}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              {t.appDownload.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {t.appDownload.description}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>{t.appDownload.installed}</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-brand-900 font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 text-brand-600" />
                <span>{t.appDownload.installBtn}</span>
              </button>
            )}

            <a
              href="/farmer/login"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-700/60 hover:bg-brand-700 text-white font-bold text-xs border border-brand-500/30 transition-all text-center"
            >
              <span>{t.appDownload.loginBtn}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
