import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { isHindi } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {isHindi
          ? 'आप ऑफलाइन हैं। कुछ खाता व ऑर्डर सुविधाएं इंटरनेट पर निर्भर हैं।'
          : "You're offline. Some account and ordering features require internet."}
      </span>
    </div>
  );
};
