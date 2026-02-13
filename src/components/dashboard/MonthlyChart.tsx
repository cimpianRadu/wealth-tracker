'use client';

import { useState, useMemo } from 'react';
import { useWealthStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const RANGES = [
  { label: '3L', months: 3 },
  { label: '6L', months: 6 },
  { label: '1A', months: 12 },
  { label: 'Tot', months: 0 },
] as const;

export function MonthlyChart() {
  const { snapshots, displayCurrency, displayValue } = useWealthStore();
  const [range, setRange] = useState<number>(0); // 0 = all

  const filteredSnapshots = useMemo(() => {
    if (range === 0 || snapshots.length === 0) return snapshots;
    return snapshots.slice(-range);
  }, [snapshots, range]);

  if (snapshots.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evoluție Lunară</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground text-sm text-center">
          Salvează snapshots lunare pentru a vedea evoluția averii tale.
          <br />
          Sunt necesare minimum 2 snapshots.
        </CardContent>
      </Card>
    );
  }

  const chartData = filteredSnapshots.map(s => ({
    month: s.month,
    'Avere Netă': Math.round(displayValue(s.netWorth)),
    'Active': Math.round(displayValue(s.totalAssets)),
    'Datorii': Math.round(displayValue(s.totalDebts)),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Evoluție Lunară</CardTitle>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <Button
              key={r.label}
              variant={range === r.months ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setRange(r.months)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), displayCurrency)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Avere Netă"
              stroke="#1E40AF"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Active"
              stroke="#10B981"
              strokeWidth={1.5}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Datorii"
              stroke="#EF4444"
              strokeWidth={1.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
