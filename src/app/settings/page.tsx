'use client';

import { useEffect } from 'react';
import { useWealthStore } from '@/lib/store';
import { Header, Footer } from '@/components/layout/Header';
import { TopBanner } from '@/components/ads/TopBanner';
import { CurrencySettings } from '@/components/dashboard/CurrencySettings';
import { DataManagement } from '@/components/dashboard/DataManagement';
import { BackupHistory } from '@/components/settings/BackupHistory';
import { AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

function BackupBanner({ lastBackupDate }: { lastBackupDate: string | null }) {
  if (lastBackupDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 7) return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-amber-900 text-sm">
          {lastBackupDate ? 'Backup-ul tău e vechi' : 'Nu ai niciun backup'}
        </p>
        <p className="text-amber-800 text-sm mt-1">
          Datele tale sunt stocate doar în acest browser. Dacă ștergi datele browser-ului,
          reinstalezi sistemul de operare, sau schimbi dispozitivul, totul se pierde.
          Exportă un backup regulat pentru a fi în siguranță.
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isLoading, loadAll, lastBackupDate } = useWealthStore();

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

        <BackupBanner lastBackupDate={lastBackupDate} />

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div className="space-y-6">
            <CurrencySettings />
            <DataManagement />
          </div>
          <div>
            <BackupHistory />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
