'use client';

import { useEffect } from 'react';
import { useWealthStore } from '@/lib/store';
import { Header, Footer } from '@/components/layout/Header';
import { TopBanner } from '@/components/ads/TopBanner';
import { CurrencySettings } from '@/components/dashboard/CurrencySettings';
import { DataManagement } from '@/components/dashboard/DataManagement';
import { BackupHistory } from '@/components/settings/BackupHistory';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { isLoading, loadAll } = useWealthStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      <TopBanner sticky />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl font-bold mb-6">Setări</h1>
        <div className="max-w-2xl space-y-6">
          <CurrencySettings />
          <DataManagement />
          <BackupHistory />
        </div>
      </main>

      <Footer />
    </div>
  );
}
