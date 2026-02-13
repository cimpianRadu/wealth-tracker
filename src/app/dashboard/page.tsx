'use client';

import { useEffect } from 'react';
import { useWealthStore } from '@/lib/store';
import { Header, Footer } from '@/components/layout/Header';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { AssetList } from '@/components/dashboard/AssetList';
import { DebtList } from '@/components/dashboard/DebtList';
import { TopBanner } from '@/components/ads/TopBanner';
import { DashboardBottomBar } from '@/components/dashboard/DashboardBottomBar';
import { IncognitoWarning, BackupReminder } from '@/components/dashboard/IncognitoWarning';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { isLoading, loadAll, seedData } = useWealthStore();

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

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20">
        <div className="space-y-4 mb-6">
          <IncognitoWarning />
          <BackupReminder />
          {/* TODO: Buton temporar - de șters după testare */}
          <button
            onClick={seedData}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
          >
            Încarcă date de test
          </button>
        </div>

        <div className="space-y-6">
          <NetWorthCard />

          <AssetList />
          <DebtList />
        </div>
      </main>

      <DashboardBottomBar />
      <Footer />
    </div>
  );
}
