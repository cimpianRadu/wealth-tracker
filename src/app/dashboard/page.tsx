'use client';

import { useEffect } from 'react';
import { useWealthStore } from '@/lib/store';
import { Header, Footer } from '@/components/layout/Header';
import { NetWorthCard } from '@/components/dashboard/NetWorthCard';
import { AssetPieChart } from '@/components/dashboard/AssetPieChart';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { AssetList } from '@/components/dashboard/AssetList';
import { DebtList } from '@/components/dashboard/DebtList';
import { TopBanner } from '@/components/ads/TopBanner';
import { DashboardBottomBar } from '@/components/dashboard/DashboardBottomBar';
import { IncognitoWarning, BackupReminder } from '@/components/dashboard/IncognitoWarning';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
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

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20">
        <div className="space-y-4 mb-6">
          <IncognitoWarning />
          <BackupReminder />
        </div>

        <div className="space-y-6">
          <NetWorthCard />

          <div className="grid gap-6 md:grid-cols-2">
            <AssetPieChart />
            <MonthlyChart />
          </div>

          <AssetList />
          <DebtList />
        </div>
      </main>

      <DashboardBottomBar />
      <Footer />
    </div>
  );
}
