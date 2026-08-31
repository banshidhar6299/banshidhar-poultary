import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AIFloatingButton } from '../components/AIFloatingButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { WebsiteSettings } from '../types';
import { api } from '../api/client';

export const PublicLayout: React.FC = () => {
  const [settings, setSettings] = useState<WebsiteSettings | undefined>(undefined);

  useEffect(() => {
    api
      .get('/settings/website')
      .then((res) => {
        if (res.data.success) {
          setSettings(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar logoUrl={settings?.logoUrl} />
      <main className="flex-1">
        <Outlet context={{ settings }} />
      </main>
      <Footer settings={settings} />
      <AIFloatingButton />
      <OfflineBanner />
    </div>
  );
};
