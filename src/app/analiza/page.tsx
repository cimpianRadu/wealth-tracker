'use client';

import { useEffect } from 'react';
import { useWealthStore } from '@/lib/store';
import { Header, Footer } from '@/components/layout/Header';
import { AssetPieChart } from '@/components/dashboard/AssetPieChart';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { Loader2 } from 'lucide-react';

export default function AnalizaPage() {
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

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl font-bold mb-6">Analiză</h1>

        <div className="space-y-6">
          <MonthlyChart />
          <AssetPieChart />
        </div>
      </main>

      <Footer />
    </div>
  );
}
