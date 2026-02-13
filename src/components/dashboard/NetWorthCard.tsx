'use client';

import { useWealthStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank } from 'lucide-react';

export function NetWorthCard() {
  const { totalAssets, totalDebts, netWorth, displayCurrency, displayValue, snapshots } = useWealthStore();

  const currentNetWorth = netWorth();
  const currentAssets = totalAssets();
  const currentDebts = totalDebts();

  // Calculate change from previous month's snapshot
  // If the latest snapshot is from the current month, compare with the one before it
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const lastSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const prevSnapshot = lastSnapshot?.month === currentMonth && snapshots.length > 1
    ? snapshots[snapshots.length - 2]
    : lastSnapshot;
  const prevNetWorth = prevSnapshot?.netWorth ?? 0;
  const change = prevSnapshot ? currentNetWorth - prevNetWorth : 0;
  const changePercent = prevNetWorth !== 0 ? ((change / Math.abs(prevNetWorth)) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Avere Netă</p>
              <p className="text-3xl md:text-4xl font-bold mt-1">
                {formatCurrency(displayValue(currentNetWorth), displayCurrency)}
              </p>
              {lastSnapshot && (
                <div className="flex items-center gap-1 mt-2">
                  {change >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-300" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-300" />
                  )}
                  <span className={`text-sm ${change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {change >= 0 ? '+' : ''}{formatCurrency(displayValue(change), displayCurrency)}
                    {' '}({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                  </span>
                  <span className="text-blue-200 text-sm ml-1">față de luna trecută</span>
                </div>
              )}
            </div>
            <Wallet className="h-12 w-12 text-blue-200 hidden md:block" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <PiggyBank className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Active</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(displayValue(currentAssets), displayCurrency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Datorii</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(displayValue(currentDebts), displayCurrency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {currentNetWorth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-blue-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Raport Active/Datorii</p>
              <p className="text-xl font-bold">
                {currentDebts > 0
                  ? `${(currentAssets / currentDebts).toFixed(2)}x`
                  : '∞'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
